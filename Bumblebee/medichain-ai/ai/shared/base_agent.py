"""
MediChain AI — Base Agent
All agents inherit from this. Provides Kafka listener,
Masumi payment integration, and event publishing.
"""

import json
import logging
import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from kafka import KafkaConsumer, KafkaProducer
from masumi import MasumiAgent as MasumiSDK

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all MediChain AI agents.
    Every agent:
    - Listens to its own Kafka topic
    - Processes tasks autonomously
    - Publishes completion events
    - Charges via Masumi (if monetized)
    - Requests human approval when needed
    """

    def __init__(self, agent_name: str, config: dict):
        self.agent_name = agent_name
        self.config = config

        # Kafka setup
        self.consumer = KafkaConsumer(
            f"agent.{agent_name}.tasks",
            bootstrap_servers=config["kafka_servers"],
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            group_id=f"{agent_name}-group"
        )
        self.producer = KafkaProducer(
            bootstrap_servers=config["kafka_servers"],
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )

        # Masumi payment setup (if agent is monetized)
        self.masumi = None
        if config.get("masumi_enabled"):
            self.masumi = MasumiSDK(
                api_key=config["masumi_api_key"],
                wallet_address=config["masumi_wallet"]
            )

        logger.info(f"[{agent_name}] Agent initialized and listening")

    def start(self):
        """Start listening for tasks — runs forever"""
        logger.info(f"[{self.agent_name}] Starting task listener")
        for message in self.consumer:
            task = message.value
            workflow_id = task.get("workflow_id")
            action = task.get("action")

            logger.info(f"[{self.agent_name}][{workflow_id}] Task received: {action}")

            try:
                result = asyncio.run(self.execute(task))
                self._publish_completion(workflow_id, action, result)

            except HumanApprovalRequired as e:
                self._request_human_approval(workflow_id, str(e), task)

            except Exception as e:
                logger.error(f"[{self.agent_name}][{workflow_id}] Error: {e}")
                self._publish_failure(workflow_id, action, str(e))

    @abstractmethod
    async def execute(self, task: dict) -> dict:
        """Each agent implements this — the actual work"""
        pass

    def _publish_completion(self, workflow_id: str, action: str, result: dict):
        """Tell orchestrator: task is done"""
        event_type = self._get_completion_event(action)
        self.producer.send("agent.completed", {
            "event_type": event_type,
            "workflow_id": workflow_id,
            "agent": self.agent_name,
            "action": action,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"[{self.agent_name}][{workflow_id}] ✅ Published: {event_type}")

    def _request_human_approval(self, workflow_id: str, reason: str, task: dict):
        """Tell orchestrator: I need a human"""
        self.producer.send("human.approval.required", {
            "event_type": "human.approval.required",
            "workflow_id": workflow_id,
            "agent": self.agent_name,
            "reason": reason,
            "paused_agent": self.agent_name.upper(),
            "paused_payload": task,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.warning(f"[{self.agent_name}][{workflow_id}] ⏸ Human approval requested: {reason}")

    def _publish_failure(self, workflow_id: str, action: str, error: str):
        """Tell orchestrator: something went wrong"""
        self.producer.send("agent.failed", {
            "event_type": "agent.failed",
            "workflow_id": workflow_id,
            "agent": self.agent_name,
            "action": action,
            "error": error,
            "timestamp": datetime.utcnow().isoformat()
        })

    def _get_completion_event(self, action: str) -> str:
        """Map action to event type"""
        events = {
            "VERIFY_KYC": "patient.kyc.completed",
            "MINT_IDENTITY_NFT": "patient.registered",
            "DIAGNOSE": "diagnosis.completed",
            "ISSUE_PRESCRIPTION": "prescription.issued",
            "PROCESS_CLAIM": "claim.approved",
            "RELEASE_PAYMENT": "payment.released",
            "NOTIFY": "notification.sent",
        }
        return events.get(action, f"{self.agent_name}.{action.lower()}.completed")

    async def charge_via_masumi(self, amount_ada: float, description: str) -> str:
        """Charge for this agent's work via Masumi"""
        if self.masumi:
            tx = await self.masumi.charge(amount_ada, description)
            logger.info(f"[{self.agent_name}] Masumi charge: ₳{amount_ada} — Tx: {tx.hash}")
            return tx.hash
        return "masumi_disabled"


class HumanApprovalRequired(Exception):
    """Raised when agent needs human intervention"""
    pass
