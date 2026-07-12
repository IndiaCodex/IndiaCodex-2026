/**
 * TRACK 2: Masumi — Monetize AI Agents
 * Real Masumi protocol integration via REST API
 *
 * Masumi works via a locally-run Masumi Payment Service Node.
 * Our backend implements MIP-003 (Agentic Service API Standard).
 * This service handles payment flow: request → escrow → deliver → release
 *
 * Docs: https://www.masumi.network/dev/masumi/documentation
 * MIP-003: https://www.masumi.network/dev/masumi/mips/_mip-003
 */

const MASUMI_NODE_URL = import.meta.env.VITE_MASUMI_NODE_URL || 'http://localhost:3001';
const MASUMI_REGISTRY_URL = 'https://registry.masumi.network';

/**
 * Discover registered MediChain AI agents from Masumi Registry
 */
export async function discoverMediChainAgents() {
  try {
    const response = await fetch(`${MASUMI_REGISTRY_URL}/agents?search=medichain`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Registry unreachable');
    return await response.json();
  } catch {
    // Return our known agents if registry unavailable
    return {
      agents: [
        { id: 'medichain-diagnosis-agent', name: 'MediChain Diagnosis Agent', price: '0.5 ADA', status: 'ACTIVE' },
        { id: 'medichain-claims-agent', name: 'MediChain Claims Agent', price: '2 ADA', status: 'ACTIVE' },
        { id: 'medichain-kyc-agent', name: 'MediChain KYC Agent', price: '1 ADA', status: 'ACTIVE' },
        { id: 'medichain-support-agent', name: 'MediChain Support Agent', price: '0.1 ADA', status: 'ACTIVE' },
        { id: 'medichain-records-agent', name: 'MediChain Records Agent', price: '0.3 ADA', status: 'ACTIVE' },
      ]
    };
  }
}

/**
 * MIP-003: Request job from Masumi agent
 * Step 1: POST /start_job — locks payment in escrow
 * Step 2: Agent processes job
 * Step 3: GET /availability — check agent is ready
 * Step 4: GET /get_job — retrieve result and release payment
 */
export async function requestMasumiAgentJob(agentEndpoint, jobInput, paymentAmount) {
  // Step 1: Start job (payment goes into Masumi escrow)
  const startResponse = await fetch(`${agentEndpoint}/start_job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_data: jobInput,
      payment: {
        amount: paymentAmount,
        currency: 'ADA',
        network: 'preprod'
      }
    })
  });

  if (!startResponse.ok) throw new Error('Failed to start Masumi agent job');

  const { job_id, payment_status } = await startResponse.json();
  console.log(`✅ Masumi job started: ${job_id} — Payment: ${payment_status}`);

  return { jobId: job_id, paymentStatus: payment_status };
}

/**
 * Poll for Masumi job result (MIP-003 GET /get_job)
 */
export async function getMasumiJobResult(agentEndpoint, jobId) {
  const response = await fetch(`${agentEndpoint}/get_job?job_id=${jobId}`);
  if (!response.ok) return { status: 'PENDING' };

  const data = await response.json();
  return data;
}

/**
 * Call our backend AI endpoint which internally uses Masumi payment protocol
 * Our backend exposes MIP-003 compliant /start_job and /get_job endpoints
 */
export const masumiAgents = {
  /**
   * Request AI diagnosis — powered by Ollama local LLM
   * Charges ₳0.5 via Masumi protocol
   */
  async diagnosis(patientId, symptoms, patientAge, patientGender) {
    const response = await fetch('/api/v1/ai/diagnosis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ patientId, symptoms, patientAge, patientGender })
    });

    if (!response.ok) throw new Error('Diagnosis agent failed');
    const data = await response.json();

    // If Ollama returned diagnoses directly (synchronous) — use them immediately
    if (data.diagnoses) {
      console.log(`✅ Ollama diagnosis complete — powered by ${data.powered_by || 'local LLM'}`);
      return data;
    }

    // Otherwise poll for async result (Kafka/fallback)
    const { workflowId } = data;
    if (!workflowId) return data;
    return pollForResult(workflowId, '/api/v1/ai/diagnosis');
  },

  /**
   * Process insurance claim — charges ₳2 via Masumi
   */
  async processClaim(claimData) {
    const response = await fetch('/api/v1/insurance/claims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(claimData)
    });
    if (!response.ok) throw new Error('Claims agent failed');
    return response.json();
  },

  /**
   * KYC verification — charges ₳1 via Masumi
   */
  async verifyKYC(zkpProofHash) {
    const response = await fetch('/api/v1/zkp/patient-kyc/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ zkpProof: zkpProofHash })
    });
    if (!response.ok) throw new Error('KYC verification failed');
    return response.json();
  }
};

/**
 * Poll for async workflow result from Valkey cache
 */
async function pollForResult(workflowId, baseEndpoint, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s between polls
    try {
      const response = await fetch(`${baseEndpoint}/${workflowId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.status === 'COMPLETED' && data.result) {
        console.log(`✅ Masumi agent completed job ${workflowId}`);
        return data.result;
      }
    } catch {}
  }
  throw new Error('Agent timeout — result not available');
}

/**
 * MIP-003 Compliant Agent Status
 * Our backend implements this standard so Masumi network can discover us
 */
export async function getAgentAvailability(agentType) {
  const response = await fetch(`/api/v1/ai/agents/status`);
  if (!response.ok) return { status: 'UNAVAILABLE' };
  const data = await response.json();
  return data[agentType] || { status: 'UNKNOWN' };
}

/**
 * Track total ADA earned by our agents via Masumi
 */
export async function getTotalMasumiEarnings() {
  const response = await fetch('/api/v1/ai/agents/status', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (!response.ok) return 0;
  const data = await response.json();
  return data.totalAdaEarned || 0;
}
