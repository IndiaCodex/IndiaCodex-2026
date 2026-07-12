"""
MediChain AI — Human-in-the-Loop Handler
Manages the human approval queue.
Sends notifications to the right human.
Resumes workflow after human decision.
"""

import logging
import httpx
import json
from datetime import datetime
from kafka import KafkaConsumer, KafkaProducer

logger = logging.getLogger(__name__)


class HumanApprovalHandler:
    """
    Manages human approval workflow.

    When an agent raises HumanApprovalRequired:
    1. Receives the event on human.approval.required topic
    2. Stores it in approval queue
    3. Sends notification to the right human (doctor/insurance officer/admin)
    4. Exposes API for human to approve/reject
    5. On decision → publishes human.approval.received
    6. Orchestrator resumes the paused workflow
    """

    def __init__(self, config: dict):
        self.config = config
        self.consumer = KafkaConsumer(
            "human.approval.required",
            bootstrap_servers=config["kafka_servers"],
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            group_id="human-approval-handler"
        )
        self.producer = KafkaProducer(
            bootstrap_servers=config["kafka_servers"],
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        # In-memory queue (use DB in production)
        self.pending_approvals: dict = {}

    def start(self):
        """Listen for approval requests and notify humans"""
        logger.info("Human Approval Handler started")
        for message in self.consumer:
            event = message.value
            workflow_id = event["workflow_id"]

            logger.warning(f"[human-loop] Approval needed for workflow: {workflow_id}")
            logger.warning(f"[human-loop] Reason: {event['reason']}")

            # Store in pending queue
            self.pending_approvals[workflow_id] = {
                "event": event,
                "received_at": datetime.utcnow().isoformat(),
                "status": "PENDING"
            }

            # Notify the right human
            self._notify_human(event)

    def _notify_human(self, event: dict):
        """Send notification to the correct human role"""
        notify_role = event.get("notifyRole", "ADMIN")
        workflow_id = event["workflow_id"]
        reason = event["reason"]
        approval_url = f"https://app.medichain.ai/approvals/{workflow_id}"

        notification_message = (
            f"🔔 ACTION REQUIRED\n\n"
            f"Workflow: {workflow_id}\n"
            f"Reason: {reason}\n\n"
            f"Click to review and approve/reject:\n{approval_url}"
        )

        logger.info(f"[human-loop] Notifying {notify_role}: {notification_message}")

        # In production: send email/SMS/Slack/Teams notification
        # For now: publish to notification topic
        self.producer.send("notifications.human", {
            "role": notify_role,
            "workflow_id": workflow_id,
            "message": notification_message,
            "approval_url": approval_url,
            "priority": "HIGH"
        })

    def process_human_decision(
        self,
        workflow_id: str,
        decision: str,  # "APPROVED" or "REJECTED"
        human_id: str,
        reason: str = ""
    ):
        """
        Called when human makes a decision via the admin portal.
        Publishes decision back to Kafka so orchestrator can resume workflow.
        """
        if workflow_id not in self.pending_approvals:
            raise ValueError(f"No pending approval for workflow {workflow_id}")

        original_event = self.pending_approvals[workflow_id]["event"]

        logger.info(f"[human-loop] Human decision for {workflow_id}: {decision} by {human_id}")

        # Update queue
        self.pending_approvals[workflow_id]["status"] = decision
        self.pending_approvals[workflow_id]["decided_by"] = human_id
        self.pending_approvals[workflow_id]["decided_at"] = datetime.utcnow().isoformat()

        # Publish decision — orchestrator will resume workflow
        self.producer.send("human.approval.received", {
            "event_type": "human.approval.received",
            "workflow_id": workflow_id,
            "decision": decision,
            "decided_by": human_id,
            "reason": reason,
            "paused_agent": original_event.get("paused_agent"),
            "paused_payload": original_event.get("paused_payload"),
            "patient_id": original_event.get("data", {}).get("patient_id"),
            "timestamp": datetime.utcnow().isoformat()
        })

        logger.info(f"[human-loop] ✅ Decision published — workflow {workflow_id} will resume")

    def get_pending_approvals(self) -> list:
        """Return all pending approvals for admin dashboard"""
        return [
            {
                "workflow_id": wf_id,
                "reason": data["event"]["reason"],
                "agent": data["event"].get("agent"),
                "received_at": data["received_at"],
                "status": data["status"]
            }
            for wf_id, data in self.pending_approvals.items()
            if data["status"] == "PENDING"
        ]
