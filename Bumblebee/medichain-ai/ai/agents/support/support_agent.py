"""
MediChain AI — Support Agent
24/7 patient support chatbot.
Answers questions about appointments, claims, prescriptions.
Charges ₳0.1 per conversation via Masumi.
"""
import logging
import json
from openai import AzureOpenAI
from ai.shared.base_agent import BaseAgent

logger = logging.getLogger(__name__)

SUPPORT_SYSTEM_PROMPT = """
You are MediChain AI Support Assistant — a 24/7 healthcare support agent on the Masumi network.

You help patients with:
- Insurance claim status
- Prescription queries
- Appointment scheduling
- Medical record questions
- Platform navigation
- General health queries (NOT medical advice)

RULES:
1. Always be empathetic and professional
2. Never give specific medical advice — recommend consulting a doctor
3. Provide clear, actionable information
4. If claim status is asked, include the claim ID in your response
5. Keep responses under 150 words
6. Return valid JSON only

OUTPUT:
{
  "response": "string",
  "actionRequired": boolean,
  "suggestedActions": ["string"],
  "escalateToHuman": boolean,
  "escalationReason": "string or null"
}
"""


class SupportAgent(BaseAgent):
    """Support Agent — 24/7 patient chatbot."""

    def __init__(self, config: dict):
        super().__init__("support", config)
        self.ai_client = AzureOpenAI(
            azure_endpoint=config["azure_ai_endpoint"],
            api_key=config["azure_ai_key"],
            api_version="2024-02-01"
        )
        self.deployment = config.get("azure_deployment", "gpt-4o")

    async def execute(self, task: dict) -> dict:
        patient_id = task["patient_id"]
        message = task["message"]
        context = task.get("context", {})

        logger.info(f"[support] Handling support query for patient {patient_id}")

        user_message = f"""
Patient Question: {message}

Patient Context:
- Recent claims: {context.get('recent_claims', 'None')}
- Active prescriptions: {context.get('active_prescriptions', 0)}
- Last appointment: {context.get('last_appointment', 'Unknown')}
"""

        response = self.ai_client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": SUPPORT_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)
        result["patient_id"] = patient_id
        result["workflow_id"] = task.get("workflow_id")

        masumi_tx = await self.charge_via_masumi(0.1, f"Support chat for {patient_id}")
        result["masumi_tx_hash"] = masumi_tx

        logger.info(f"[support] ✅ Response generated for {patient_id}")
        return result
