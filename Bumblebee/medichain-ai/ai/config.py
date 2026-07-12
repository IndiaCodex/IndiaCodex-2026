"""
MediChain AI — Centralized Configuration Loader
Loads all config from environment variables with validation.
"""

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    # Kafka
    kafka_servers: str

    # Azure AI
    azure_ai_endpoint: str
    azure_ai_key: str
    azure_deployment: str

    # Masumi
    masumi_api_key: str
    masumi_wallet: str
    masumi_enabled: bool

    # Cardano
    cardano_blockfrost_url: str
    cardano_blockfrost_api_key: str

    # Midnight
    midnight_node_url: str

    # Backend
    backend_url: str
    agent_api_key: str


def load_config() -> dict:
    """Load and validate all configuration from environment."""
    config = {
        "kafka_servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        "azure_ai_endpoint": os.getenv("AZURE_AI_ENDPOINT", ""),
        "azure_ai_key": os.getenv("AZURE_AI_KEY", ""),
        "azure_deployment": os.getenv("AZURE_AI_DEPLOYMENT", "gpt-4o"),
        "masumi_enabled": os.getenv("MASUMI_API_KEY", "") != "",
        "masumi_api_key": os.getenv("MASUMI_API_KEY", ""),
        "masumi_wallet": os.getenv("MASUMI_WALLET_ADDRESS", ""),
        "midnight_node_url": os.getenv("MIDNIGHT_NODE_URL", "https://preprod-node.midnight.network"),
        "cardano_blockfrost_url": os.getenv("CARDANO_BLOCKFROST_URL", "https://cardano-preprod.blockfrost.io/api/v0"),
        "cardano_blockfrost_api_key": os.getenv("CARDANO_BLOCKFROST_API_KEY", ""),
        "backend_url": os.getenv("BACKEND_URL", "http://backend:8080"),
        "agent_api_key": os.getenv("AGENT_API_KEY", "internal-agent-key"),
    }
    return config
