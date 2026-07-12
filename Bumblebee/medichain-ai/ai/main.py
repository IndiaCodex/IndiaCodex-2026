"""
MediChain AI — Agent Runner
Starts all agents in parallel threads.
Each agent listens to its own Kafka topic.
"""

import threading
import logging
import os
from dotenv import load_dotenv

from orchestrator.orchestrator_agent import OrchestratorAgent
from agents.patient.patient_agent import PatientAgent
from agents.diagnosis.diagnosis_agent import DiagnosisAgent
from agents.prescription.prescription_agent import PrescriptionAgent
from agents.insurance.insurance_agent import InsuranceAgent
from agents.payment.payment_agent import PaymentAgent
from agents.notification.notification_agent import NotificationAgent
from agents.kyc.kyc_agent import KycAgent
from agents.records.records_agent import RecordsAgent
from agents.support.support_agent import SupportAgent
from human_loop.human_approval_handler import HumanApprovalHandler
from config import load_config

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# CONFIG loaded inside main() from config.py


def start_agent(agent_instance, name: str):
    """Start an agent in its own thread"""
    logger.info(f"Starting {name} in background thread")
    thread = threading.Thread(
        target=agent_instance.start,
        name=name,
        daemon=True
    )
    thread.start()
    return thread


def main():
    """
    Start all agents in parallel.
    Each agent listens to its own Kafka topic and processes tasks autonomously.
    """
    logger.info("=" * 60)
    logger.info("MediChain AI — Multi-Agent System Starting")
    logger.info("=" * 60)

    CONFIG = load_config()

    # Create all 10 agents
    orchestrator = OrchestratorAgent(CONFIG)
    patient_agent = PatientAgent(CONFIG)
    diagnosis_agent = DiagnosisAgent(CONFIG)
    prescription_agent = PrescriptionAgent(CONFIG)
    insurance_agent = InsuranceAgent(CONFIG)
    payment_agent = PaymentAgent(CONFIG)
    notification_agent = NotificationAgent(CONFIG)
    kyc_agent = KycAgent(CONFIG)
    records_agent = RecordsAgent(CONFIG)
    support_agent = SupportAgent(CONFIG)
    human_handler = HumanApprovalHandler(CONFIG)

    # Start ALL agents in parallel threads
    threads = [
        start_agent(patient_agent, "PatientAgent"),
        start_agent(diagnosis_agent, "DiagnosisAgent"),
        start_agent(prescription_agent, "PrescriptionAgent"),
        start_agent(insurance_agent, "InsuranceAgent"),
        start_agent(payment_agent, "PaymentAgent"),
        start_agent(notification_agent, "NotificationAgent"),
        start_agent(kyc_agent, "KycAgent"),
        start_agent(records_agent, "RecordsAgent"),
        start_agent(support_agent, "SupportAgent"),
        start_agent(human_handler, "HumanApprovalHandler"),
    ]

    logger.info("All 10 agents started and listening")
    logger.info("Agent System Ready:")
    logger.info("  ✅ Orchestrator Agent")
    logger.info("  ✅ Patient Agent          (topic: agent.patient.tasks)")
    logger.info("  ✅ Diagnosis Agent        (topic: agent.diagnosis.tasks)")
    logger.info("  ✅ Prescription Agent     (topic: agent.prescription.tasks)")
    logger.info("  ✅ Insurance Agent        (topic: agent.insurance.tasks)")
    logger.info("  ✅ Payment Agent          (topic: agent.payment.tasks)")
    logger.info("  ✅ Notification Agent     (topic: agent.notification.tasks)")
    logger.info("  ✅ KYC Agent              (topic: agent.kyc.tasks)")
    logger.info("  ✅ Records Agent          (topic: agent.records.tasks)")
    logger.info("  ✅ Support Agent          (topic: agent.support.tasks)")
    logger.info("  ✅ Human Approval Handler (topic: human.approval.required)")
    logger.info("")
    logger.info("Human intervention required ONLY for:")
    logger.info("  • Fraud score > 0.8")
    logger.info("  • Claim amount > ₳1,000")
    logger.info("  • CRITICAL medical urgency")
    logger.info("")
    logger.info("Everything else runs autonomously. Agents collaborate via Kafka.")

    import asyncio
    asyncio.run(orchestrator.start_event_loop())


if __name__ == "__main__":
    main()
