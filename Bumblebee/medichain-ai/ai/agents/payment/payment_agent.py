"""
MediChain AI — Payment Agent
Autonomously releases ADA via Cardano smart contract.
No human needed — triggered automatically by claim approval.
"""

import logging
import httpx
from ai.shared.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class PaymentAgent(BaseAgent):
    """
    Payment Agent — fully autonomous ADA payment releaser.
    Triggered automatically when claim is approved.
    Releases ADA from Cardano escrow smart contract.
    NEVER needs human involvement.
    """

    def __init__(self, config: dict):
        super().__init__("payment", config)
        self.blockfrost_url = config["cardano_blockfrost_url"]
        self.blockfrost_key = config["cardano_blockfrost_api_key"]
        self.backend_url = config["backend_url"]

    async def execute(self, task: dict) -> dict:
        """
        Release ADA payment:
        1. Get escrow contract details
        2. Build release transaction
        3. Submit to Cardano
        4. Confirm transaction
        5. Return tx hash
        """

        patient_wallet = task["patient_wallet"]
        amount_ada = float(task["amount_ada"])
        escrow_tx_hash = task["escrow_tx_hash"]
        workflow_id = task["workflow_id"]

        logger.info(f"[payment] Releasing ₳{amount_ada} to {patient_wallet[:20]}...")

        # Call backend to release escrow
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.backend_url}/api/v1/cardano/escrow/release",
                json={
                    "escrow_tx_hash": escrow_tx_hash,
                    "payee_wallet": patient_wallet,
                    "amount_ada": amount_ada,
                    "workflow_id": workflow_id
                },
                headers={"X-Agent-Key": self.config["agent_api_key"]},
                timeout=60.0
            )
            response.raise_for_status()
            tx_data = response.json()

        tx_hash = tx_data["tx_hash"]
        logger.info(f"[payment] ✅ ADA released — Tx: {tx_hash}")

        return {
            "patient_wallet": patient_wallet,
            "amount_ada": amount_ada,
            "tx_hash": tx_hash,
            "patient_id": task.get("patient_id"),
            "workflow_id": workflow_id,
            "status": "RELEASED"
        }
