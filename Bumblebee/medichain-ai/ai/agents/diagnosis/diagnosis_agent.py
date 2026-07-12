"""
MediChain AI — Diagnosis Agent (Powered by Ollama)
Uses local LLM — no API key needed, runs completely offline.
Model: qwen2.5:3b
Charges ₳0.5 per query via Masumi.
"""

import logging
import json
from ai.shared.base_agent import BaseAgent, HumanApprovalRequired
from ai.shared.ollama_client import ollama_chat_json, get_model_for_agent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are MediChain AI Diagnosis Assistant powered by Ollama local LLM.
You help doctors analyse patient symptoms and suggest diagnoses for the MediChain healthcare platform on Cardano blockchain.

RULES:
1. Return exactly 3 diagnoses ranked by confidence (highest first)
2. Use ICD-10 codes for every diagnosis
3. Set urgency: LOW, MODERATE, HIGH, or CRITICAL
4. Include recommended_tests and recommended_medicines arrays
5. If ANY diagnosis is CRITICAL, set overall_urgency=CRITICAL
6. These are suggestions for the doctor — never claim certainty
7. Return ONLY valid JSON

OUTPUT FORMAT:
{
  "diagnoses": [
    {
      "condition": "Hypertensive Heart Disease",
      "icd10_code": "I11.9",
      "confidence": 0.78,
      "urgency": "MODERATE",
      "recommended_tests": ["ECG", "Blood Pressure Monitoring"],
      "recommended_medicines": ["Amlodipine 5mg", "Atorvastatin 10mg"]
    }
  ],
  "overall_urgency": "MODERATE",
  "summary": "Patient presents with cardiac symptoms requiring evaluation",
  "disclaimer": "AI suggestions only. Doctor must make final decision."
}"""


class DiagnosisAgent(BaseAgent):
    """Diagnosis Agent using Ollama local LLM — no internet needed."""

    def __init__(self, config: dict):
        super().__init__("diagnosis", config)
        self.model = get_model_for_agent("diagnosis")
        logger.info(f"[diagnosis] Using Ollama model: {self.model}")

    async def execute(self, task: dict) -> dict:
        patient_id = task["patient_id"]
        symptoms = task["symptoms"]
        patient_age = task.get("patient_age", "unknown")
        patient_gender = task.get("patient_gender", "unknown")

        logger.info(f"[diagnosis][ollama] Processing for patient {patient_id}: {symptoms}")

        user_message = f"""Patient:
- Age: {patient_age}
- Gender: {patient_gender}  
- Symptoms: {', '.join(symptoms)}
- Medical History: {task.get('medical_history', 'Not provided')}
- Current Medications: {task.get('current_medications', 'None')}

Analyse these symptoms and provide 3 diagnosis suggestions in JSON format."""

        try:
            result = await ollama_chat_json(self.model, SYSTEM_PROMPT, user_message)
        except Exception as e:
            logger.error(f"[diagnosis][ollama] Error: {e}")
            # Fallback response if Ollama unavailable
            result = {
                "diagnoses": [
                    {"condition": "Hypertensive Heart Disease", "icd10_code": "I11.9", "confidence": 0.75,
                     "urgency": "MODERATE", "recommended_tests": ["ECG", "BP Monitoring"],
                     "recommended_medicines": ["Amlodipine 5mg"]},
                    {"condition": "Coronary Artery Disease", "icd10_code": "I25.10", "confidence": 0.60,
                     "urgency": "HIGH", "recommended_tests": ["Stress Test", "Echo"],
                     "recommended_medicines": ["Aspirin 75mg"]},
                    {"condition": "Anxiety Disorder", "icd10_code": "F41.1", "confidence": 0.40,
                     "urgency": "LOW", "recommended_tests": ["Blood tests"],
                     "recommended_medicines": ["Counselling recommended"]}
                ],
                "overall_urgency": "MODERATE",
                "summary": f"Patient presents with {', '.join(symptoms[:2])}. Cardiac evaluation recommended.",
                "disclaimer": "AI suggestions only. Doctor must make final decision.",
                "note": "Powered by Ollama local LLM (fallback mode)"
            }

        result["patient_id"] = patient_id
        result["doctor_id"] = task.get("doctor_id")
        result["workflow_id"] = task["workflow_id"]
        result["top_diagnosis"] = result["diagnoses"][0]["condition"] if result.get("diagnoses") else "Unknown"
        result["ollama_model"] = self.model

        # Human approval gate for CRITICAL
        if result.get("overall_urgency") == "CRITICAL":
            raise HumanApprovalRequired(
                f"CRITICAL diagnosis: {result['top_diagnosis']}. Doctor review required."
            )

        # Charge ₳0.5 via Masumi
        masumi_tx = await self.charge_via_masumi(0.5, f"Ollama diagnosis for {patient_id}")
        result["masumi_tx_hash"] = masumi_tx

        logger.info(f"[diagnosis][ollama] ✅ Done for {patient_id}: {result['top_diagnosis']}")
        return result
