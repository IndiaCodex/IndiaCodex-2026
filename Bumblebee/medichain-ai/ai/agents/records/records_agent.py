"""
MediChain AI — Records Summary Agent
Summarizes patient medical history for doctors.
Charges ₳0.3 per summary via Masumi.
"""
import logging
import json
from openai import AzureOpenAI
from ai.shared.base_agent import BaseAgent

logger = logging.getLogger(__name__)

RECORDS_SYSTEM_PROMPT = """
You are MediChain AI Medical Records Summarizer — an AI agent on the Masumi network.
Your job: Summarize a patient's medical history into a clear, brief report for doctors.

RULES:
1. Summary must be under 200 words
2. Highlight: key diagnoses, current medications, allergies, recent visits
3. Flag any critical ongoing conditions
4. Mention last visit date
5. Identify patterns (chronic conditions, recurring issues)
6. Return valid JSON only

OUTPUT:
{
  "summary": "string",
  "keyFindings": ["string"],
  "chronicConditions": ["string"],
  "currentMedications": ["string"],
  "lastVisit": "date string",
  "activePrescriptions": number,
  "criticalFlags": ["string"]
}
"""


class RecordsAgent(BaseAgent):
    """Medical Records Summary Agent — summarizes patient history for doctors."""

    def __init__(self, config: dict):
        super().__init__("records", config)
        self.ai_client = AzureOpenAI(
            azure_endpoint=config["azure_ai_endpoint"],
            api_key=config["azure_ai_key"],
            api_version="2024-02-01"
        )
        self.deployment = config.get("azure_deployment", "gpt-4o")

    async def execute(self, task: dict) -> dict:
        patient_id = task["patient_id"]
        records = task.get("records", [])
        focus_area = task.get("focus_area", "GENERAL")

        logger.info(f"[records] Summarizing history for patient {patient_id}")

        user_message = f"""
Patient ID: {patient_id}
Focus Area: {focus_area}
Medical Records ({len(records)} records):
{json.dumps(records, indent=2)[:3000]}

Please provide a concise medical summary.
"""

        response = self.ai_client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": RECORDS_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        result = json.loads(response.choices[0].message.content)
        result["patient_id"] = patient_id
        result["workflow_id"] = task.get("workflow_id")

        masumi_tx = await self.charge_via_masumi(0.3, f"Records summary for {patient_id}")
        result["masumi_tx_hash"] = masumi_tx

        logger.info(f"[records] ✅ Summary generated for {patient_id}")
        return result
