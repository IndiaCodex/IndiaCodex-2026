"""
MediChain AI — Notification Agent
Sends notifications via SMS, email, and in-app.
Fully autonomous — handles all notification routing.
"""

import logging
import httpx
from ai.shared.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class NotificationAgent(BaseAgent):
    """
    Notification Agent — multi-channel notification dispatcher.
    Routes notifications to: patients, doctors, admins, insurance officers.
    No human needed — completely autonomous.
    """

    def __init__(self, config: dict):
        super().__init__("notification", config)

    async def execute(self, task: dict) -> dict:
        action = task.get("action")
        message = task.get("message", "")
        recipients = task.get("recipients", [])
        patient_id = task.get("patient_id")
        role = task.get("role")

        logger.info(f"[notification] Sending notification: {action} to {recipients or role}")

        if action == "NOTIFY_HUMAN":
            await self._notify_human(task)
        elif action == "NOTIFY":
            await self._notify_recipients(recipients, message, patient_id)

        return {
            "sent": True,
            "recipients": recipients or [role],
            "message": message[:100] + "..." if len(message) > 100 else message
        }

    async def _notify_human(self, task: dict):
        """Notify specific human role about pending approval"""
        role = task.get("role", "ADMIN")
        workflow_id = task.get("workflow_id")
        reason = task.get("reason")
        approval_url = task.get("approval_url")

        logger.warning(
            f"[notification] 🔔 HUMAN NOTIFICATION → {role}\n"
            f"  Workflow: {workflow_id}\n"
            f"  Reason: {reason}\n"
            f"  URL: {approval_url}"
        )
        # In production: send email/SMS/Slack to on-call human
        # For demo: log the notification

    async def _notify_recipients(self, recipients: list, message: str, patient_id: str):
        """Send notifications to list of recipient types"""
        for recipient in recipients:
            logger.info(f"[notification] Sending to {recipient}: {message[:80]}...")
            # In production: look up contact details and send via SMS/email provider
