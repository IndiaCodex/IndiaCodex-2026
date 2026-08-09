import httpx

from app.blockchain.ports import CardanoChainPort, ChainTx
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_BASE = "https://cardano-preprod.blockfrost.io/api/v0"


class BlockfrostChainClient(CardanoChainPort):
    """Reads the real Cardano preprod chain through Blockfrost's API."""

    async def get_transaction(self, tx_hash: str) -> ChainTx:
        settings = get_settings()
        headers = {"project_id": settings.blockfrost_project_id}
        async with httpx.AsyncClient(timeout=15) as client:
            tx = await client.get(f"{_BASE}/txs/{tx_hash}", headers=headers)
            if tx.status_code == 404:
                return ChainTx(exists=False)
            tx.raise_for_status()

            utxos = await client.get(f"{_BASE}/txs/{tx_hash}/utxos", headers=headers)
            utxos.raise_for_status()

            latest = await client.get(f"{_BASE}/blocks/latest", headers=headers)
            latest.raise_for_status()

        tx_data, utxo_data = tx.json(), utxos.json()
        confirmations = max(0, latest.json()["height"] - tx_data["block_height"] + 1)

        def lovelace(amounts: list[dict]) -> int:
            return sum(int(a["quantity"]) for a in amounts if a["unit"] == "lovelace")

        return ChainTx(
            exists=True,
            confirmations=confirmations,
            outputs=[(o["address"], lovelace(o["amount"])) for o in utxo_data["outputs"]],
            input_addresses=[i["address"] for i in utxo_data["inputs"]],
        )
