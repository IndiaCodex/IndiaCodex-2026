/**
 * Audit Trail Page — Scenario 9 of Demo Workflow
 * Shows every event in the patient's healthcare journey as a beautiful
 * blockchain-verified timeline. Each event has a Cardano TX hash.
 */
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, FileText, Pill, CreditCard, CheckCircle2, Clock,
  ExternalLink, Activity, UserCheck, Lock, Zap, Heart
} from 'lucide-react';
import { CARDANOSCAN_BASE } from '../../services/cardano';

const EVENT_CONFIG = {
  PATIENT_REGISTERED:    { icon: UserCheck, color: 'blue',   label: 'Patient Registered',      track: 'Midnight ZKP' },
  WALLET_CONNECTED:      { icon: Shield,    color: 'blue',   label: 'Wallet Connected',         track: 'Cardano' },
  APPOINTMENT_BOOKED:    { icon: Clock,     color: 'teal',   label: 'Appointment Booked',       track: 'Platform' },
  APPOINTMENT_COMPLETED: { icon: CheckCircle2, color: 'teal', label: 'Consultation Completed', track: 'Platform' },
  DIAGNOSIS_GENERATED:   { icon: Zap,       color: 'green',  label: 'AI Diagnosis (Masumi)',    track: 'Masumi AI' },
  RECORD_CREATED:        { icon: FileText,  color: 'purple', label: 'Medical Record Created',   track: 'Cardano NFT' },
  PRESCRIPTION_ISSUED:   { icon: Pill,      color: 'indigo', label: 'Prescription NFT Minted',  track: 'Cardano NFT' },
  CONSENT_APPROVED:      { icon: CheckCircle2, color: 'green', label: 'Consent Approved',       track: 'Cardano' },
  CONSENT_DENIED:        { icon: Lock,      color: 'red',    label: 'Consent Denied',           track: 'Cardano' },
  CLAIM_SUBMITTED:       { icon: CreditCard, color: 'orange', label: 'Insurance Claim Submitted', track: 'Masumi AI' },
  CLAIM_AI_PROCESSED:    { icon: Zap,       color: 'yellow', label: 'AI Claim Analysis',        track: 'Masumi AI' },
  CLAIM_ZKP_VERIFIED:    { icon: Shield,    color: 'purple', label: 'ZKP Eligibility Verified', track: 'Midnight' },
  CLAIM_APPROVED:        { icon: CheckCircle2, color: 'green', label: 'Claim Approved',         track: 'Cardano' },
  PAYMENT_RELEASED:      { icon: Activity,  color: 'green',  label: 'ADA Payment Released',     track: 'Cardano' },
  ESCROW_LOCKED:         { icon: Lock,      color: 'blue',   label: 'Escrow Locked',            track: 'Aiken Contract' },
  ESCROW_RELEASED:       { icon: CheckCircle2, color: 'green', label: 'Escrow Released',        track: 'Aiken Contract' },
};

const TRACK_COLORS = {
  'Cardano':        'blue',
  'Cardano NFT':    'indigo',
  'Masumi AI':      'green',
  'Midnight ZKP':   'purple',
  'Midnight':       'purple',
  'Aiken Contract': 'teal',
  'Platform':       'slate',
};

export default function AuditTrailPage() {
  const { user } = useAuth();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['audit-trail', user?.id],
    queryFn: () => auditApi.getPatientTrail(user?.id),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  // Enrich events with config
  const enriched = events.map(e => ({
    ...e,
    config: EVENT_CONFIG[e.action] || {
      icon: Activity, color: 'slate', label: e.action?.replace(/_/g, ' '), track: 'Platform',
    },
  }));

  const trackStats = enriched.reduce((acc, e) => {
    const t = e.config.track;
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-900/50 rounded-xl">
          <Activity className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Blockchain Audit Trail</h1>
          <p className="text-slate-400 mt-1">
            Every important event in your healthcare journey, permanently recorded on Cardano.
          </p>
        </div>
      </div>

      {/* Track coverage summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(trackStats).map(([track, count]) => {
          const color = TRACK_COLORS[track] || 'slate';
          return (
            <div key={track} className={`bg-${color}-900/20 border border-${color}-800/50 rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold text-${color}-400`}>{count}</div>
              <div className="text-slate-400 text-xs mt-0.5">{track}</div>
            </div>
          );
        })}
        {Object.keys(trackStats).length === 0 && !isLoading && (
          <>
            {[
              { track: 'Cardano', color: 'blue' },
              { track: 'Masumi AI', color: 'green' },
              { track: 'Midnight ZKP', color: 'purple' },
              { track: 'Aiken Contract', color: 'teal' },
            ].map(({ track, color }) => (
              <div key={track} className={`bg-${color}-900/20 border border-${color}-800/50 rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold text-${color}-400`}>—</div>
                <div className="text-slate-400 text-xs mt-0.5">{track}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : enriched.length === 0 ? (
        /* Demo timeline when no real events */
        <DemoTimeline />
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />

          <div className="space-y-1">
            {enriched.map((event, i) => {
              const { icon: Icon, color, label, track } = event.config;
              const trackColor = TRACK_COLORS[track] || 'slate';
              const hasTx = event.txHash || event.cardanoTxHash || event.resourceId;

              return (
                <div key={event.id || i} className="relative flex gap-4 pl-4 pb-6">
                  {/* Circle on line */}
                  <div className={`relative z-10 flex-shrink-0 w-5 h-5 mt-1 rounded-full border-2 border-${color}-500 bg-slate-900 flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full bg-${color}-400`} />
                  </div>

                  {/* Event card */}
                  <div className="flex-1 bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 bg-${color}-900/50 rounded-lg flex-shrink-0`}>
                          <Icon className={`w-4 h-4 text-${color}-400`} />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{label}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 bg-${trackColor}-900/30 text-${trackColor}-400 border border-${trackColor}-800 rounded-full`}>
                        {track}
                      </span>
                    </div>

                    {hasTx && (
                      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-700/50">
                        <Shield className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="text-slate-500 text-xs">Cardano TX:</span>
                        <span className="text-blue-300 font-mono text-xs truncate flex-1">
                          {event.txHash || event.cardanoTxHash || event.resourceId}
                        </span>
                        <a
                          href={`${CARDANOSCAN_BASE}/transaction/${event.txHash || event.cardanoTxHash || event.resourceId}`}
                          target="_blank" rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Show a realistic demo timeline when no events exist yet
function DemoTimeline() {
  const DEMO_EVENTS = [
    { label: 'Patient Registered', track: 'Midnight ZKP', color: 'blue', icon: UserCheck,
      time: '2 days ago', tx: 'demo7a3f...c841' },
    { label: 'Wallet Connected (Lace)', track: 'Cardano', color: 'blue', icon: Shield,
      time: '2 days ago', tx: 'demo9b2e...f102' },
    { label: 'Appointment Booked — Dr. Rajesh', track: 'Platform', color: 'teal', icon: Clock,
      time: '1 day ago', tx: null },
    { label: 'AI Diagnosis — Cardiology (₳0.5)', track: 'Masumi AI', color: 'green', icon: Zap,
      time: '1 day ago', tx: 'demob14c...8e37' },
    { label: 'Medical Record NFT Minted (CIP-25)', track: 'Cardano NFT', color: 'purple', icon: FileText,
      time: '1 day ago', tx: 'demo71e0...5a29' },
    { label: 'Prescription NFT Issued', track: 'Cardano NFT', color: 'indigo', icon: Pill,
      time: '1 day ago', tx: 'demo3d8c...1b4f' },
    { label: 'Consent Approved — Share with Insurance', track: 'Cardano', color: 'green', icon: CheckCircle2,
      time: '10 hours ago', tx: 'democ5f2...a9e1' },
    { label: 'Insurance Claim Submitted (₳2 ADA)', track: 'Masumi AI', color: 'orange', icon: CreditCard,
      time: '8 hours ago', tx: 'demo4a7d...2c6b' },
    { label: 'ZKP Eligibility Verified (Midnight)', track: 'Midnight', color: 'purple', icon: Shield,
      time: '8 hours ago', tx: 'demo8b3e...d174' },
    { label: 'Claim Approved — AI Confidence 94%', track: 'Masumi AI', color: 'yellow', icon: CheckCircle2,
      time: '6 hours ago', tx: 'demof6a1...8c3d' },
    { label: 'ADA Payment Released from Escrow', track: 'Aiken Contract', color: 'green', icon: Heart,
      time: 'Just now', tx: 'demo2e9b...7f42' },
  ];

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
        <Clock className="w-4 h-4 text-yellow-400" />
        <span className="text-yellow-300 text-sm">Demo mode — complete the workflow to see real events</span>
      </div>

      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-700" />
      <div className="space-y-1 mt-2">
        {DEMO_EVENTS.map((event, i) => {
          const Icon = event.icon;
          return (
            <div key={i} className="relative flex gap-4 pl-4 pb-5">
              <div className={`relative z-10 flex-shrink-0 w-5 h-5 mt-1 rounded-full border-2 border-${event.color}-500 bg-slate-900 flex items-center justify-center`}>
                <div className={`w-2 h-2 rounded-full bg-${event.color}-400`} />
              </div>
              <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 text-${event.color}-400 flex-shrink-0`} />
                    <span className="text-white text-sm font-medium">{event.label}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 bg-${TRACK_COLORS[event.track] || 'slate'}-900/30 text-${TRACK_COLORS[event.track] || 'slate'}-400 border border-${TRACK_COLORS[event.track] || 'slate'}-800 rounded-full flex-shrink-0`}>
                    {event.track}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500 text-xs">{event.time}</span>
                  {event.tx && (
                    <span className="text-blue-300 font-mono text-xs flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-400" />
                      {event.tx}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
