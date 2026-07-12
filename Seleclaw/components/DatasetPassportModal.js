import { generateDatasetPassport, getTrustScoreLabel } from '../lib/cardano';
import ProvenanceGraph from './ProvenanceGraph';

export default function DatasetPassportModal({ dataset, onClose }) {
  if (!dataset) return null;

  const passport = generateDatasetPassport(dataset);

  return (
    <div className="dataset-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '850px', background: '#111322', color: '#f8fafc', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="close-btn" onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✕</button>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🎫</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.5rem', background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cardano Dataset Passport
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.25rem' }}>
            REGISTRY TX: {passport.txHash}
          </p>
        </div>

        {/* Cardano Dataset Certificate (NFT) Badge */}
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.08) 100%)', border: '1.5px solid rgba(16,185,129,0.3)', padding: '1rem 1.25rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2.2rem' }}>🏅</div>
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.95rem' }}>
              Cardano Dataset Certificate (NFT) Verified
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
              <div><strong>Policy ID:</strong> <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{passport.certificateNFT.policyId.substring(0, 16)}...</span></div>
              <div><strong>Asset Name:</strong> <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{passport.certificateNFT.assetName}</span></div>
              <div><strong>Audit Hash:</strong> <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{passport.certificateNFT.auditHash}</span></div>
              <div><strong>Certification Status:</strong> <span style={{ color: '#10b981', fontWeight: '600' }}>{passport.certificateNFT.status}</span></div>
            </div>
          </div>
        </div>

        {/* Audited Trust & AI Readiness Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.7rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 'bold' }}>Dataset Trust Score</span>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#6366f1' }}>{passport.qualityScore}%</p>
            <small style={{ fontSize: '0.65rem', color: '#a5f3fc' }}>{getTrustScoreLabel(passport.qualityScore)}</small>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.7rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 'bold' }}>AI Readiness</span>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#06b6d4' }}>{passport.aiReadiness}%</p>
            <small style={{ fontSize: '0.65rem', color: '#a5f3fc' }}>Model compatibility rate</small>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 'bold' }}>Compliance Index</span>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>{passport.compliance}%</p>
            <small style={{ fontSize: '0.65rem', color: '#a7f3d0' }}>De-identification audit passed</small>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Dataset ID</span>
            <strong style={{ color: '#fff' }}>AEGIS-DS-{passport.id}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Owner Node</span>
            <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{passport.owner.slice(0, 8)}...{passport.owner.slice(-6)}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>IPFS Storage CID</span>
            <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{passport.storageCID.slice(0, 14)}...</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>License Model</span>
            <strong style={{ color: '#fff' }}>{passport.license.substring(0, 24)}...</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Accumulated Revenue</span>
            <strong style={{ color: '#10b981' }}>{passport.revenue} ADA</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Downloads</span>
            <strong style={{ color: '#fff' }}>{passport.downloads} times</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Training Jobs Run</span>
            <strong style={{ color: '#fff' }}>{passport.trainingJobsCount} jobs</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>AI Models Built</span>
            <strong style={{ color: '#fff' }}>{passport.modelsBuiltCount} models</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Last Updated</span>
            <strong style={{ color: '#fff' }}>{passport.lastUpdated}</strong>
          </div>
        </div>

        {/* Provenance Graph */}
        <ProvenanceGraph datasetName={dataset.name} providerName={dataset.owner} />

        {/* Dataset Evolution Timeline */}
        <div style={{ background: '#161826', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' }}>
            📈 Dataset Evolution Version Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '8px', borderLeft: '2px solid rgba(99,102,241,0.2)' }}>
            {passport.evolution.map((evo, i) => (
              <div key={i} style={{ position: 'relative', paddingLeft: '14px' }}>
                <span style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: i === passport.evolution.length - 1 ? '#10b981' : '#6366f1', boxShadow: i === passport.evolution.length - 1 ? '0 0 6px #10b981' : 'none' }}></span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: i === passport.evolution.length - 1 ? '#10b981' : '#a5b4fc' }}>{evo.version}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{evo.date}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>{evo.logs}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ borderRadius: '8px', padding: '0.5rem 1.25rem' }}>
            Close Passport Registry
          </button>
        </div>
      </div>
    </div>
  );
}
