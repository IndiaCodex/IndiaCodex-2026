"""
MediChain AI — Ollama Integration
Replaces Azure AI / OpenAI with local Ollama models.
No API key needed. Runs completely locally.

Available models (from your Ollama install):
- qwen2.5:3b    — Fast, good for diagnosis and claims
- deepseek-r1:8b — Powerful, best for complex medical reasoning
- qwen2.5-coder:14b — For technical analysis

Ollama API endpoint: http://localhost:11434
"""

import json
import httpx
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"

# Model selection per agent type
AGENT_MODELS = {
    "diagnosis": "qwen2.5:3b",        # Fast medical diagnosis
    "claims": "qwen2.5:3b",           # Quick claim processing
    "kyc": "qwen2.5:3b",              # Identity verification
    "support": "qwen2.5:3b",          # Patient support chat
    "records": "qwen2.5:3b",          # Medical record summary
    "default": "qwen2.5:3b"
}


async def ollama_chat(model: str, system_prompt: str, user_message: str) -> str:
    """
    Call Ollama local model.
    Returns the response text.
    """
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 1024
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"]


async def ollama_chat_json(model: str, system_prompt: str, user_message: str) -> dict:
    """
    Call Ollama and parse JSON response.
    Adds JSON instruction to prompt automatically.
    """
    json_instruction = "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation, just JSON."
    raw = await ollama_chat(model, system_prompt + json_instruction, user_message)

    # Extract JSON from response
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    return json.loads(raw)


def get_model_for_agent(agent_type: str) -> str:
    return AGENT_MODELS.get(agent_type, AGENT_MODELS["default"])


async def check_ollama_health() -> bool:
    """Check if Ollama is running and accessible."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False
