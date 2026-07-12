import { useState } from 'react';
import { lovelaceToAda } from '../lib/cardano';

export default function DatasetCard({ 
  dataset, 
  onPurchase, 
  onStartTraining,
  onViewPassport,
  onCompareToggle,
  isCompared = false,
  isPurchased = false,
  isOwner = false,
  purchasing = false,
  showPreview = false 
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!dataset) return null;

  const priceInADA = lovelaceToAda(dataset.priceLovelace || dataset.priceInAVAX || '0');
  const fileSizeMB = dataset.fileSize ? (dataset.fileSize / 1024 / 1024).toFixed(2) : '0';
  const createdDate = dataset.createdAt ? new Date(dataset.createdAt * 1000).toLocaleDateString() : 'Unknown';

  const getDataTypeInfo = (dataType) => {
    const types = {
      medical: { icon: '🏥', color: '#e74c3c', label: 'Medical' },
      financial: { icon: '🏦', color: '#f39c12', label: 'Financial' },
      behavioral: { icon: '🛍️', color: '#9b59b6', label: 'Behavioral' },
      iot: { icon: '📡', color: '#3498db', label: 'IoT/Sensors' },
      research: { icon: '🔬', color: '#2ecc71', label: 'Research' },
      other: { icon: '📊', color: '#95a5a6', label: 'Other' }
    };
    return types[dataType] || types.other;
  };

  const typeInfo = getDataTypeInfo(dataset.dataType);

  const handlePurchase = () => {
    if (onPurchase && !isPurchased && !isOwner) {
      onPurchase(dataset);
    }
  };

  const handleStartTraining = () => {
    if (onStartTraining && (isPurchased || isOwner)) {
      onStartTraining(dataset);
    }
  };

  return (
    <div className={`dataset-card ${isPurchased ? 'purchased' : ''} ${isOwner ? 'owned' : ''} ${isCompared ? 'compared' : ''}`} style={{ border: isCompared ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)' }}>
      {/* Card Header */}
      <div className="card-header">
        <div className="dataset-type" style={{ backgroundColor: typeInfo.color }}>
          <span className="type-icon">{typeInfo.icon}</span>
          <span className="type-label">{typeInfo.label}</span>
        </div>
        
        {isOwner && <span className="owner-badge">Your Asset</span>}
        {isPurchased && !isOwner && <span className="purchased-badge">✅ Licensed</span>}
      </div>

      {/* Card Content */}
      <div className="card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className="dataset-title" style={{ fontSize: '1.1rem' }}>{dataset.name}</h3>
          {onCompareToggle && (
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input 
                type="checkbox" 
                checked={isCompared}
                onChange={() => onCompareToggle(dataset)}
                style={{ accentColor: '#38bdf8' }}
              />
              Compare
            </label>
          )}
        </div>
        
        <p className="dataset-description" style={{ minHeight: '65px', fontSize: '0.8rem' }}>
          {showDetails || showPreview 
            ? dataset.description 
            : `${dataset.description?.substring(0, 85)}${dataset.description?.length > 85 ? '...' : ''}`
          }
        </p>

        {/* Dynamic Trust, AI Readiness & Compliance Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '0.5rem 0', textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>TRUST SCORE</span>
            <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '800' }}>{dataset.trustScore || 88}%</span>
          </div>
          <div>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>AI READINESS</span>
            <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: '800' }}>{dataset.aiReadiness || 85}%</span>
          </div>
          <div>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>COMPLIANCE</span>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '800' }}>{dataset.compliance || 95}%</span>
          </div>
        </div>

        {showDetails && (
          <div className="dataset-details" style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>IPFS CID:</span>
              <span style={{ fontFamily: 'monospace' }}>{dataset.ipfsCID?.substring(0, 14)}...</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>File Size:</span>
              <span>{fileSizeMB} MB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Registered:</span>
              <span>{createdDate}</span>
            </div>
          </div>
        )}

        {/* Dataset Stats */}
        <div className="dataset-stats">
          <div className="stat">
            <span className="stat-icon">💰</span>
            <span className="stat-value">{priceInADA} ADA</span>
            <span className="stat-label">Price</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📈</span>
            <span className="stat-value">{dataset.purchaseCount?.toString() || '0'}</span>
            <span className="stat-label">Accesses</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📁</span>
            <span className="stat-value">{fileSizeMB}</span>
            <span className="stat-label">MB</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="card-actions">
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setShowDetails(!showDetails)}
          style={{ padding: '0.4rem' }}
        >
          {showDetails ? 'Hide Info' : 'Show Info'}
        </button>

        {onViewPassport && (
          <button
            className="btn btn-secondary btn-small"
            onClick={() => onViewPassport(dataset)}
            style={{ padding: '0.4rem', borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
          >
            🎫 Passport
          </button>
        )}

        {!showPreview && (
          <>
            {isOwner ? (
              <button 
                className="btn btn-success btn-small"
                onClick={handleStartTraining}
                style={{ background: '#10b981', color: 'white' }}
              >
                🎯 Run VM
              </button>
            ) : isPurchased ? (
              <button 
                className="btn btn-success btn-small"
                onClick={handleStartTraining}
                style={{ background: '#10b981', color: 'white' }}
              >
                🚀 Run VM
              </button>
            ) : (
              <button
                className="btn btn-primary btn-small"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? 'Buying...' : `🛒 License: ${priceInADA} ADA`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
