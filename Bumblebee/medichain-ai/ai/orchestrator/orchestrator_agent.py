"""
MediChain AI — Orchestrator Agent
The master controller that coordinates all agents.
Receives all requests, routes to correct agent, monitors execution.
"""

import asyncio
import json
import logging
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime

from kafka import KafkaProducer, KafkaConsumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    PATIENT = "patient"
    DIAGNOSIS = "diagnosis"
    PRESCRIPTION = "prescription"
    INSURANCE = "insurance"
    PAYMENT = "payment"
    NOTIFICATION = "notification"
    KYC = "kyc"
    RECORDS = "records"
    SUPPORT = "support"


class WorkflowStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_HUMAN = "AWAITING_HUMAN"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclass
class AgentTask:
    task_id: str
    workflow_id: str
    agent_type: AgentType
    payload: dict
    status: WorkflowStatus = WorkflowStatus.PENDING
    result: Optional[dict] = None
    error: Optional[str] = None
    requires_human: bool = False
    human_reason: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class WorkflowContext:
    workflow_id: str
    workflow_type: str  # PATIENT_REGISTRATION, INSURANCE_CLAIM, PRESCRIPTION_FLOW
    patient_id: Optional[str] = None
    doctor_id: Optional[str] = None
    tasks: list = field(default_factory=list)
    status: WorkflowStatus = WorkflowStatus.PENDING
    current_step: int = 0


class OrchestratorAgent:
    """
    Master orchestrator that:
    1. Receives incoming requests
    2. Creates workflow context
    3. Routes to appropriate agent
    4. Monitors execution
    5. Handles human approval gates
    6. Chains agents automatically via Kafka events
    """

    def __init__(self, config: dict):
        self.config = config
        self.producer = KafkaProducer(
            bootstrap_servers=config["kafka_servers"],
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        self.consumer = KafkaConsumer(
            "agent.completed",
            "human.approval.received",
            bootstrap_servers=config["kafka_servers"],
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            group_id="orchestrator-group"
        )
        self.active_workflows: dict[str, WorkflowContext] = {}
        logger.info("Orchestrator Agent initialized")

    # ─────────────────────────────────────────────
    # WORKFLOW ROUTING
    # ─────────────────────────────────────────────

    async def route(self, request_type: str, payload: dict) -> WorkflowContext:
        """Route incoming request to the correct workflow"""

        workflow_id = f"wf-{datetime.utcnow().timestamp()}"

        if request_type == "PATIENT_REGISTRATION":
            return await self._start_patient_registration_workflow(workflow_id, payload)

        elif request_type == "INSURANCE_CLAIM":
            return await self._start_insurance_claim_workflow(workflow_id, payload)

        elif request_type == "DOCTOR_CONSULTATION":
            return await self._start_consultation_workflow(workflow_id, payload)

        else:
            raise ValueError(f"Unknown request type: {request_type}")

    # ─────────────────────────────────────────────
    # WORKFLOW: PATIENT REGISTRATION
    # Fully automatic — no human needed
    # ─────────────────────────────────────────────

    async def _start_patient_registration_workflow(
        self, workflow_id: str, payload: dict
    ) -> WorkflowContext:

        ctx = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="PATIENT_REGISTRATION",
            patient_id=payload.get("wallet_address")
        )
        self.active_workflows[workflow_id] = ctx
        ctx.status = WorkflowStatus.IN_PROGRESS

        logger.info(f"[{workflow_id}] Starting patient registration workflow")

        # Step 1: Patient KYC via ZKP — automatic
        self._dispatch_to_agent(AgentType.PATIENT, {
            "workflow_id": workflow_id,
            "action": "VERIFY_KYC",
            "wallet_address": payload["wallet_address"],
            "zkp_proof_hash": payload["zkp_proof_hash"]
        })

        # Remaining steps triggered automatically via Kafka events:
        # patient.kyc.completed → mint identity NFT → publish patient.registered
        # patient.registered → notification agent sends welcome message

        return ctx

    # ─────────────────────────────────────────────
    # WORKFLOW: INSURANCE CLAIM
    # Automatic UNLESS fraud detected
    # ─────────────────────────────────────────────

    async def _start_insurance_claim_workflow(
        self, workflow_id: str, payload: dict
    ) -> WorkflowContext:

        ctx = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="INSURANCE_CLAIM",
            patient_id=payload.get("patient_id")
        )
        self.active_workflows[workflow_id] = ctx
        ctx.status = WorkflowStatus.IN_PROGRESS

        logger.info(f"[{workflow_id}] Starting insurance claim workflow")

        # Step 1: Insurance agent verifies ZKP + processes claim
        self._dispatch_to_agent(AgentType.INSURANCE, {
            "workflow_id": workflow_id,
            "action": "PROCESS_CLAIM",
            "patient_id": payload["patient_id"],
            "claim_type": payload["claim_type"],
            "claim_amount_ada": payload["claim_amount_ada"],
            "zkp_eligibility_proof": payload["zkp_eligibility_proof"]
        })

        # If approved → Payment Agent releases ADA automatically
        # If fraud → human.approval.required published → workflow PAUSES

        return ctx

    # ─────────────────────────────────────────────
    # WORKFLOW: DOCTOR CONSULTATION
    # Automatic UNLESS CRITICAL urgency
    # ─────────────────────────────────────────────

    async def _start_consultation_workflow(
        self, workflow_id: str, payload: dict
    ) -> WorkflowContext:

        ctx = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="CONSULTATION",
            patient_id=payload.get("patient_id"),
            doctor_id=payload.get("doctor_id")
        )
        self.active_workflows[workflow_id] = ctx
        ctx.status = WorkflowStatus.IN_PROGRESS

        # Step 1: Diagnosis Agent — automatic
        self._dispatch_to_agent(AgentType.DIAGNOSIS, {
            "workflow_id": workflow_id,
            "action": "DIAGNOSE",
            "patient_id": payload["patient_id"],
            "symptoms": payload["symptoms"],
            "patient_age": payload.get("patient_age"),
            "patient_gender": payload.get("patient_gender")
        })

        # If not critical → Prescription Agent auto-triggered on diagnosis.completed
        # If CRITICAL → human.approval.required → Doctor notified → PAUSES

        return ctx

    # ─────────────────────────────────────────────
    # EVENT PROCESSOR — Kafka Consumer Loop
    # Listens for agent completion events
    # Automatically triggers next agent in chain
    # ─────────────────────────────────────────────

    async def start_event_loop(self):
        """Continuously process agent completion events"""
        logger.info("Orchestrator event loop started")

        for message in self.consumer:
            event = message.value
            event_type = event.get("event_type")
            workflow_id = event.get("workflow_id")

            logger.info(f"[{workflow_id}] Event received: {event_type}")

            if event_type == "patient.kyc.completed":
                await self._on_patient_kyc_completed(workflow_id, event)

            elif event_type == "diagnosis.completed":
                await self._on_diagnosis_completed(workflow_id, event)

            elif event_type == "prescription.issued":
                await self._on_prescription_issued(workflow_id, event)

            elif event_type == "claim.approved":
                await self._on_claim_approved(workflow_id, event)

            elif event_type == "payment.released":
                await self._on_payment_released(workflow_id, event)

            elif event_type == "human.approval.required":
                await self._on_human_approval_required(workflow_id, event)

            elif event_type == "human.approval.received":
                await self._on_human_approval_received(workflow_id, event)

    # ─────────────────────────────────────────────
    # AUTOMATIC CHAIN REACTIONS
    # ─────────────────────────────────────────────

    async def _on_patient_kyc_completed(self, workflow_id: str, event: dict):
        """KYC done → automatically mint Identity NFT → notify patient"""
        logger.info(f"[{workflow_id}] KYC completed → minting Identity NFT")

        self._dispatch_to_agent(AgentType.PATIENT, {
            "workflow_id": workflow_id,
            "action": "MINT_IDENTITY_NFT",
            "patient_id": event["patient_id"],
            "zkp_proof_hash": event["zkp_proof_hash"]
        })

    async def _on_diagnosis_completed(self, workflow_id: str, event: dict):
        """Diagnosis done → check urgency → auto-trigger prescription if not critical"""
        urgency = event.get("urgency", "LOW")

        if urgency == "CRITICAL":
            # HUMAN NEEDED — pause and notify doctor
            await self._request_human_approval(
                workflow_id=workflow_id,
                reason=f"CRITICAL diagnosis detected: {event.get('top_diagnosis')}",
                data=event,
                notifyRole="DOCTOR"
            )
        else:
            # Automatic — trigger prescription agent
            logger.info(f"[{workflow_id}] Diagnosis not critical → auto-triggering prescription")
            self._dispatch_to_agent(AgentType.PRESCRIPTION, {
                "workflow_id": workflow_id,
                "action": "ISSUE_PRESCRIPTION",
                "patient_id": event["patient_id"],
                "doctor_id": event["doctor_id"],
                "diagnosis": event["top_diagnosis"],
                "recommended_medicines": event.get("recommended_medicines", [])
            })

    async def _on_prescription_issued(self, workflow_id: str, event: dict):
        """Prescription issued → notify patient and pharmacy"""
        logger.info(f"[{workflow_id}] Prescription NFT issued → notifying parties")

        self._dispatch_to_agent(AgentType.NOTIFICATION, {
            "workflow_id": workflow_id,
            "action": "NOTIFY",
            "recipients": ["patient", "pharmacy"],
            "message": f"Prescription issued. NFT: {event.get('nft_tx_hash')}",
            "patient_id": event["patient_id"]
        })

    async def _on_claim_approved(self, workflow_id: str, event: dict):
        """Claim approved → automatically release ADA payment"""
        logger.info(f"[{workflow_id}] Claim approved → releasing ADA payment")

        self._dispatch_to_agent(AgentType.PAYMENT, {
            "workflow_id": workflow_id,
            "action": "RELEASE_PAYMENT",
            "patient_wallet": event["patient_wallet"],
            "amount_ada": event["approved_amount_ada"],
            "escrow_tx_hash": event["escrow_tx_hash"]
        })

    async def _on_payment_released(self, workflow_id: str, event: dict):
        """Payment released → notify patient → mark workflow complete"""
        logger.info(f"[{workflow_id}] Payment released → workflow complete")

        # Notify patient
        self._dispatch_to_agent(AgentType.NOTIFICATION, {
            "workflow_id": workflow_id,
            "action": "NOTIFY",
            "recipients": ["patient"],
            "message": f"₳{event['amount_ada']} released to your wallet. Tx: {event['tx_hash']}",
            "patient_id": event["patient_id"]
        })

        # Mark workflow complete
        if workflow_id in self.active_workflows:
            self.active_workflows[workflow_id].status = WorkflowStatus.COMPLETED
            logger.info(f"[{workflow_id}] ✅ Workflow COMPLETED")

    # ─────────────────────────────────────────────
    # HUMAN-IN-THE-LOOP
    # ─────────────────────────────────────────────

    async def _on_human_approval_required(self, workflow_id: str, event: dict):
        """Workflow paused — waiting for human"""
        logger.warning(f"[{workflow_id}] ⏸ PAUSED — Human approval required: {event.get('reason')}")

        if workflow_id in self.active_workflows:
            self.active_workflows[workflow_id].status = WorkflowStatus.AWAITING_HUMAN

        # Send notification to the right human
        self._dispatch_to_agent(AgentType.NOTIFICATION, {
            "workflow_id": workflow_id,
            "action": "NOTIFY_HUMAN",
            "role": event.get("notifyRole", "ADMIN"),
            "reason": event.get("reason"),
            "data": event.get("data"),
            "approval_url": f"https://app.medichain.ai/approvals/{workflow_id}"
        })

    async def _on_human_approval_received(self, workflow_id: str, event: dict):
        """Human approved or rejected — resume workflow"""
        decision = event.get("decision")  # APPROVED or REJECTED

        logger.info(f"[{workflow_id}] Human decision received: {decision}")

        if decision == "APPROVED":
            # Resume the paused step
            paused_agent = event.get("paused_agent")
            paused_payload = event.get("paused_payload")
            self._dispatch_to_agent(AgentType[paused_agent], paused_payload)

        elif decision == "REJECTED":
            # Notify patient of rejection
            self._dispatch_to_agent(AgentType.NOTIFICATION, {
                "workflow_id": workflow_id,
                "action": "NOTIFY",
                "recipients": ["patient"],
                "message": f"Your request was reviewed and could not be processed. Reason: {event.get('reason')}",
                "patient_id": event.get("patient_id")
            })
            if workflow_id in self.active_workflows:
                self.active_workflows[workflow_id].status = WorkflowStatus.FAILED

    async def _request_human_approval(
        self,
        workflow_id: str,
        reason: str,
        data: dict,
        notifyRole: str
    ):
        """Publish human approval required event"""
        self.producer.send("human.approval.required", {
            "workflow_id": workflow_id,
            "event_type": "human.approval.required",
            "reason": reason,
            "data": data,
            "notifyRole": notifyRole,
            "timestamp": datetime.utcnow().isoformat()
        })

    # ─────────────────────────────────────────────
    # AGENT DISPATCHER
    # ─────────────────────────────────────────────

    def _dispatch_to_agent(self, agent_type: AgentType, payload: dict):
        """Send task to agent via Kafka"""
        topic = f"agent.{agent_type.value}.tasks"
        self.producer.send(topic, payload)
        logger.info(f"Dispatched to {agent_type.value} agent: {payload.get('action')}")
