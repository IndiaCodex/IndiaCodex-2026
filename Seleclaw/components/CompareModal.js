import { lovelaceToAda } from '../lib/cardano';

export default function CompareModal({ datasetA, datasetB, onClose }) {
  if (!datasetA || !datasetB) return null;

  const fileSizeMB = (bytes) => (bytes ? (bytes / 1024 / 1024).toFixed(2) : '0');

  return (
    <div className="dataset-modal">
      <div className="modal-content" style={{ maxWidth: '800px', background: '#111322', color: '#f8fafc', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button className="close-btn" onClick={onClose} style={{ fontSize: '1.25rem' }}>✕</button>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>⚖️</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.5rem', background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Compare Datasets
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Compare on-chain telemetry, AI trust metrics, and license terms side-by-side
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: '#94a3b8' }}>Metric</div>
          <div style={{ fontWeight: 'bold', color: '#38bdf8', textAlign: 'center', fontSize: '1.1rem' }}>{datasetA.name}</div>
          <div style={{ fontWeight: 'bold', color: '#a78bfa', textAlign: 'center', fontSize: '1.1rem' }}>{datasetB.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem 0', maxHeight: '50vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Dataset Trust Score</span>
            <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', color: '#6366f1' }}>{datasetA.trustScore}%</div>
            <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', color: '#6366f1' }}>{datasetB.trustScore}%</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>AI Readiness</span>
            <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', color: '#06b6d4' }}>{datasetA.aiReadiness || 85}%</div>
            <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', color: '#06b6d4' }}>{datasetB.aiReadiness || 89}%</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Compliance Index</span>
            <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', color: '#10b981' }}>{datasetA.compliance || 95}%</div>
            <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', color: '#10b981' }}>{datasetB.compliance || 100}%</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Price (ADA)</span>
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>{lovelaceToAda(datasetA.priceLovelace)} ADA</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>{lovelaceToAda(datasetB.priceLovelace)} ADA</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>File Size</span>
            <div style={{ textAlign: 'center' }}>{fileSizeMB(datasetA.fileSize)} MB</div>
            <div style={{ textAlign: 'center' }}>{fileSizeMB(datasetB.fileSize)} MB</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Category type</span>
            <div style={{ textAlign: 'center', textTransform: 'capitalize' }}>{datasetA.dataType}</div>
            <div style={{ textAlign: 'center', textTransform: 'capitalize' }}>{datasetB.dataType}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Downloads (Access Count)</span>
            <div style={{ textAlign: 'center' }}>{datasetA.purchaseCount}</div>
            <div style={{ textAlign: 'center' }}>{datasetB.purchaseCount}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Compliance framework</span>
            <div style={{ textAlign: 'center', color: '#10b981', fontSize: '0.85rem' }}>GDPR & HIPAA Compliant</div>
            <div style={{ textAlign: 'center', color: '#10b981', fontSize: '0.85rem' }}>GDPR & HIPAA Compliant</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Blockchain Network</span>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', fontFamily: 'monospace' }}>Cardano Preprod</div>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', fontFamily: 'monospace' }}>Cardano Preprod</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ borderRadius: '8px' }}>
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
