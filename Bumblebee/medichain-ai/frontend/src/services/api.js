import axios from 'axios';

// Use relative URL so Vite proxy handles CORS (proxies /api → http://localhost:8080)
const BASE_URL = '/api/v1';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('token', data.token);
          err.config.headers.Authorization = `Bearer ${data.token}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────
export const authApi = {
  connectWallet: data => api.post('/auth/wallet/connect', data).then(r => r.data),
  refresh: data => api.post('/auth/refresh', data).then(r => r.data),
};

// ── PATIENTS ──────────────────────────────────────────────
export const patientApi = {
  register: data => api.post('/patients/register', data).then(r => r.data),
  getProfile: () => api.get('/patients/me').then(r => r.data),
  getById: id => api.get(`/patients/${id}`).then(r => r.data),
};

// ── MEDICAL RECORDS ───────────────────────────────────────
const RECORDS_BASE = '/doctors/patients';
export const recordsApi = {
  getAll: patientId => api.get(`${RECORDS_BASE}/${patientId}/records`).then(r => r.data),
  create: data => api.post('/doctors/records', data).then(r => r.data),
};

// ── PRESCRIPTIONS ─────────────────────────────────────────
export const prescriptionApi = {
  issue: data => api.post('/doctors/prescriptions', data).then(r => r.data),
  getByPatient: patientId => api.get(`/prescriptions/patient/${patientId}`).then(r => r.data),
  verify: assetId => api.get(`/prescriptions/verify/${assetId}`).then(r => r.data),
};

// ── INSURANCE CLAIMS ──────────────────────────────────────
export const claimsApi = {
  submit: data => api.post('/insurance/claims', data).then(r => r.data),
  getStatus: id => api.get(`/insurance/claims/${id}`).then(r => r.data),
  getByPatient: patientId => api.get(`/insurance/claims/patient/${patientId}`).then(r => r.data),
  getManualReview: () => api.get('/insurance/claims/manual-review').then(r => r.data),
  approve: (id, data) => api.post(`/insurance/claims/${id}/approve`, data || {}).then(r => r.data),
  reject: (id) => api.post(`/insurance/claims/${id}/reject`, {}).then(r => r.data),
};

// ── AI AGENTS ─────────────────────────────────────────────
export const aiApi = {
  getDiagnosis: data => api.post('/ai/diagnosis', data).then(r => r.data),
  getDiagnosisResult: workflowId => api.get(`/ai/diagnosis/${workflowId}`).then(r => r.data),
  getAgentStatus: () => api.get('/ai/agents/status').then(r => r.data),
  getAgentLogs: params => api.get('/ai/agents/logs', { params }).then(r => r.data),
};

// ── ZKP / MIDNIGHT ────────────────────────────────────────
export const zkpApi = {
  verifyPatientKyc: data => api.post('/zkp/patient-kyc/verify', data).then(r => r.data),
  verifyInsuranceClaim: data => api.post('/zkp/claim-eligibility/verify', data).then(r => r.data),
};

// ── CARDANO ───────────────────────────────────────────────
export const cardanoApi = {
  createEscrow: data => api.post('/cardano/escrow/create', data).then(r => r.data),
  getTransaction: txHash => api.get(`/cardano/tx/${txHash}`).then(r => r.data),
};

// ── CONSENT ───────────────────────────────────────────────
export const consentApi = {
  getMyConsents: () => api.get('/consent/my').then(r => r.data),
  create: data => api.post('/consent', data).then(r => r.data),
  respond: (consentId, data) => api.put(`/consent/${consentId}/respond`, data).then(r => r.data),
  getPendingCount: () => api.get('/consent/pending/count').then(r => r.data),
};

// ── AUDIT TRAIL ───────────────────────────────────────────
export const auditApi = {
  getAll: params => api.get('/admin/audit-logs', { params }).then(r => r.data),
  getPatientTrail: userId => api.get(`/admin/audit-trail/user/${userId}`).then(r => r.data),
};

// ── APPOINTMENTS ──────────────────────────────────────────
export const appointmentApi = {
  book: data => api.post('/appointments', data).then(r => r.data),
  getMyAppointments: patientId => api.get(`/appointments/patient/${patientId}`).then(r => r.data),
  getDoctors: () => api.get('/doctors').then(r => r.data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, null, { params: { status } }).then(r => r.data),
};

// ── ADMIN ─────────────────────────────────────────────────
export const adminApi = {
  getStaff: () => api.get('/admin/staff').then(r => r.data),
  addStaff: data => api.post('/admin/staff', data).then(r => r.data),
  getAuditLogs: params => api.get('/admin/audit-logs', { params }).then(r => r.data),
  getAnalytics: () => api.get('/admin/analytics').then(r => r.data),
};

export default api;
