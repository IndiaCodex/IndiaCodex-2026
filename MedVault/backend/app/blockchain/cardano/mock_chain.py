from app.blockchain.ports import CardanoChainPort, ChainTx
from app.core.config import get_settings


class MockChainAdapter(CardanoChainPort):
    """Development-only chain, so the flow is testable without real ADA.

    Fabricate a deposit with a tx_hash of the form:

        mocktx:<from_address>:<lovelace>

    e.g. mocktx:addr_test1qz2f...:45000000
    """

    async def get_transaction(self, tx_hash: str) -> ChainTx:
        if not tx_hash.startswith("mocktx:"):
            return ChainTx(exists=False)
        try:
            _, from_address, amount = tx_hash.split(":", 2)
            lovelace = int(amount)
        except ValueError:
            return ChainTx(exists=False)
        settings = get_settings()
        return ChainTx(
            exists=True,
            confirmations=100,
            outputs=[(settings.pool_wallet_address, lovelace)],
            input_addresses=[from_address],
        )
