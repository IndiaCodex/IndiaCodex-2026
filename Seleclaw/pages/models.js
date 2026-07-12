import { useState, useEffect } from 'react';
import { getStoredModels, registerModel, getStoredDatasets } from '../lib/cardano';
import ChatBot from '../components/ChatBot';

export default function Models({ account }) {
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  
  // Register form state
  const [name, setName] = useState('');
  const [selectedDatasetIds, setSelectedDatasetIds] = useState([]);
  const [accuracy, setAccuracy] = useState('');
  const [license, setLicense] = useState('Open ML Community License');
  const [inferenceTask, setInferenceTask] = useState('Classification');
  const [framework, setFramework] = useState('TensorFlow');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = () => {
    try {
      setLoading(true);
      setModels(getStoredModels());
      setDatasets(getStoredDatasets());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || selectedDatasetIds.length === 0 || !accuracy) {
      alert("Please fill in all required fields.");
      return;
    }
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const newModel = registerModel(name, selectedDatasetIds, accuracy, license, account, inferenceTask, framework);
      setModels(prev => [...prev, newModel]);
      setName('');
      setSelectedDatasetIds([]);
      setAccuracy('');
      setShowRegister(false);
      alert(`AI Model "${name}" registered successfully on Cardano Model Registry!`);
    } catch (err) {
      alert(err.message || err);
    }
  };

  const handleDatasetCheckbox = (id) => {
    setSelectedDatasetIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  if (loading) {
    return (
      <div className="models-page" style={{ padding: '2rem 0' }}>
        <div className="container">
          <p>Loading AI Model Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="models-page" style={{ padding: '3rem 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', fontWeight: '850', color: 'white' }}>🧠 Decentralized AI Model Registry</h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
              Verify model credentials, examine training dataset dependencies, and audit accuracy logs on Cardano.
            </p>
          </div>
          {account && (
            <button className="btn btn-primary" onClick={() => setShowRegister(!showRegister)}>
              {showRegister ? 'Close Form' : '➕ Register Model'}
            </button>
          )}
        </div>

        {showRegister && (
          <form onSubmit={handleRegister} style={{ background: '#161826', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>Register Model on Ledger</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Model Name *</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g., Clinical ResNet Prognosis v2" 
                style={{ padding: '0.65rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Select Training Dataset Dependencies *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0a0b10', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {datasets.map(d => (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedDatasetIds.includes(d.id)}
                      onChange={() => handleDatasetCheckbox(d.id)}
                      style={{ accentColor: '#6366f1' }}
                    />
                    <span>{d.name} (AEGIS-DS-{d.id})</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Model Accuracy (%) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={accuracy} 
                  onChange={e => setAccuracy(e.target.value)} 
                  placeholder="e.g., 93.45" 
                  style={{ padding: '0.65rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Inference Task *</label>
                <select 
                  value={inferenceTask} 
                  onChange={e => setInferenceTask(e.target.value)}
                  style={{ padding: '0.65rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                  <option value="Classification">Classification</option>
                  <option value="Segmentation">Segmentation</option>
                  <option value="Detection">Detection</option>
                  <option value="Regression">Regression</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>ML Framework *</label>
                <select 
                  value={framework} 
                  onChange={e => setFramework(e.target.value)}
                  style={{ padding: '0.65rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                  <option value="TensorFlow">TensorFlow</option>
                  <option value="PyTorch">PyTorch</option>
                  <option value="Scikit-learn">Scikit-learn</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>License Type *</label>
                <select 
                  value={license} 
                  onChange={e => setLicense(e.target.value)}
                  style={{ padding: '0.65rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                  <option value="Open ML Community License">Open ML Community License</option>
                  <option value="Aegis Commercial License v1.0">Aegis Commercial License v1.0</option>
                  <option value="Research Exclusive License">Research Exclusive License</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
              Register Model
            </button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {models.map(model => (
            <div key={model.id} style={{ background: '#161826', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'var(--transition)' }} className="room-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    AEGIS-MD-{model.id}
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {model.framework}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.5rem', color: '#fff' }}>{model.name}</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.25rem' }}>
                  Owner Node: {model.owner ? `${model.owner.slice(0, 15)}...${model.owner.slice(-6)}` : 'Unknown Node'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Inference Task:</span>
                  <strong style={{ color: '#06b6d4' }}>{model.inferenceTask}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Accuracy Rate:</span>
                  <strong style={{ color: '#10b981' }}>{model.accuracy}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>License:</span>
                  <strong>{model.license}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Version:</span>
                  <strong>{model.version}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Registered:</span>
                  <span>{new Date(model.createdAt * 1000).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Dataset Dependencies:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {model.datasetIds.map(dId => {
                    const ds = datasets.find(d => Number(d.id) === Number(dId));
                    return (
                      <span key={dId} style={{ fontSize: '0.7rem', color: '#06b6d4', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', padding: '2px 6px', borderRadius: '4px' }} title={ds ? ds.name : 'Unknown Data Source'}>
                        📂 AEGIS-DS-{dId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChatBot />
    </div>
  );
}
