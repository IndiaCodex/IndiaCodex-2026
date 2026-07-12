import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AIChatWidget from './components/common/AIChatWidget';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientRecords from './pages/patient/PatientRecords';
import PatientClaims from './pages/patient/PatientClaims';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import BlockchainVerifyPage from './pages/patient/BlockchainVerifyPage';
import PatientConsentPage from './pages/patient/PatientConsentPage';
import AuditTrailPage from './pages/patient/AuditTrailPage';
import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import DemoWorkflowPage from './pages/DemoWorkflowPage';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import PatientDetail from './pages/doctor/PatientDetail';
import DiagnosisPage from './pages/doctor/DiagnosisPage';
import IssuePrescription from './pages/doctor/IssuePrescription';
import PrescriptionEscrowPage from './pages/doctor/PrescriptionEscrowPage';
import DoctorCredentialPage from './pages/doctor/DoctorCredentialPage';

// Pharmacy
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffManagement from './pages/admin/StaffManagement';
import AuditLogs from './pages/admin/AuditLogs';
import Analytics from './pages/admin/Analytics';

// Insurance
import InsuranceDashboard from './pages/insurance/InsuranceDashboard';
import ClaimsQueue from './pages/insurance/ClaimsQueue';
import ManualReview from './pages/insurance/ManualReview';

// Agent Dashboard
import AgentDashboard from './pages/agent/AgentDashboard';

import Layout from './components/common/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
});

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  // Wait for token check to complete before redirecting
  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

function RoleBasedHome() {
  const { user } = useAuth();
  const roleRoutes = {
    PATIENT: '/patient/dashboard',
    DOCTOR: '/doctor/dashboard',
    HOSPITAL_ADMIN: '/admin/dashboard',
    INSURANCE_OFFICER: '/insurance/dashboard',
    PHARMACIST: '/pharmacy/dashboard',
    SUPER_ADMIN: '/admin/dashboard',
  };
  return <Navigate to={roleRoutes[user?.role] || '/login'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" />
          <AIChatWidget />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><RoleBasedHome /></ProtectedRoute>} />

            {/* Patient Routes */}
            <Route path="/patient" element={<ProtectedRoute allowedRoles={['PATIENT']}><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="records" element={<PatientRecords />} />
              <Route path="claims" element={<PatientClaims />} />
              <Route path="prescriptions" element={<PatientPrescriptions />} />
              <Route path="verify" element={<BlockchainVerifyPage />} />
              <Route path="consent" element={<PatientConsentPage />} />
              <Route path="audit-trail" element={<AuditTrailPage />} />
              <Route path="appointments" element={<BookAppointmentPage />} />
            </Route>

            {/* Shared demo workflow — accessible by all roles */}
            <Route path="/demo" element={<ProtectedRoute><DemoWorkflowPage /></ProtectedRoute>} />

            {/* Doctor Routes */}
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR']}><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="patients/:patientId" element={<PatientDetail />} />
              <Route path="diagnosis/:patientId" element={<DiagnosisPage />} />
              <Route path="prescribe/:patientId" element={<IssuePrescription />} />
              <Route path="escrow" element={<PrescriptionEscrowPage />} />
              <Route path="credentials" element={<DoctorCredentialPage />} />
            </Route>

            {/* Pharmacy Routes */}
            <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['PHARMACIST', 'SUPER_ADMIN']}><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<PharmacyDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="audit" element={<AuditLogs />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="agents" element={<AgentDashboard />} />
            </Route>

            {/* Insurance Routes */}
            <Route path="/insurance" element={<ProtectedRoute allowedRoles={['INSURANCE_OFFICER', 'SUPER_ADMIN']}><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<InsuranceDashboard />} />
              <Route path="claims" element={<ClaimsQueue />} />
              <Route path="review/:claimId" element={<ManualReview />} />
            </Route>

            <Route path="/unauthorized" element={
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                  <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
