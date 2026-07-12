import { useState, useEffect } from 'react';

export default function AIWorkspace({ datasets }) {
  const [selectedDataset, setSelectedDataset] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loss, setLoss] = useState(1.2);
  const [accuracy, setAccuracy] = useState(0.35);
  const [gpuTemp, setGpuTemp] = useState(42);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsRunning(false);
            setLogs(prev => [...prev, "[SYSTEM] Training job completed successfully.", "[SYSTEM] Checkpoint saved: ipfs://QmModelweightsLatestCheckpoint"]);
            clearInterval(interval);
            return 100;
          }
          
          const step = p + Math.floor(Math.random() * 8) + 2;
          const currentLoss = Math.max(0.08, (1.2 - (step * 0.011) + (Math.random() * 0.05 - 0.025))).toFixed(4);
          const currentAcc = Math.min(0.98, (0.35 + (step * 0.006) + (Math.random() * 0.02 - 0.01))).toFixed(4);
          
          setLoss(currentLoss);
          setAccuracy(currentAcc);
          setGpuTemp(Math.floor(65 + Math.random() * 12));
          
          setLogs(prev => [
            ...prev,
            `[EPOCH ${Math.floor(step / 10)}] Step ${step}/100: Loss = ${currentLoss}, Accuracy = ${currentAcc}`
          ]);

          return Math.min(step, 100);
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    if (!selectedDataset) {
      alert("Please select a dataset to mount first.");
      return;
    }
    setLogs([
      `[SYSTEM] Initializing Aegis Secure AI Workspace sandbox VM...`,
      `[SYSTEM] Mounting locked dataset CID: ipfs://QmMountDatasetRef...`,
      `[SYSTEM] Enforcing differential privacy check... Pass.`,
      `[SYSTEM] Commencing federated training loops on GPU cluster Node #4...`
    ]);
    setProgress(0);
    setLoss(1.2);
    setAccuracy(0.35);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setLogs(prev => [...prev, "[WARNING] Training job terminated by operator."]);
  };

  const handleExport = () => {
    if (progress < 100) {
      alert("You can only export model weights after the training job completes successfully.");
      return;
    }
    setLogs(prev => [
      ...prev,
      `[SYSTEM] Exporting model weights to on-chain registry...`,
      `[SYSTEM] Minted Verification Checkpoint NFT: CIP25_MODEL_CKPT_${Math.floor(Math.random() * 1000000)}`,
      `[SYSTEM] Model successfully registered to Cardano AI Model Registry.`
    ]);
    alert("Model exported successfully! Verification Checkpoint NFT minted on Cardano Preprod.");
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>💻 Secure AI Workspace</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Mount licensed datasets securely, write model configurations, watch training logs, and export weights to the registry.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleExport}
          disabled={progress < 100}
          style={{ borderColor: progress === 100 ? '#10b981' : 'rgba(255,255,255,0.08)', color: progress === 100 ? '#10b981' : '#64748b' }}
        >
          💾 Export Model Weights
        </button>
      </div>

      <div className="workspace-container">
        {/* Notebook / Console Section */}
        <div className="notebook-editor">
          <div className="editor-header">
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>aegis_secure_sandbox_vm.ipynb</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-success btn-small" 
                onClick={handleStart}
                disabled={isRunning}
                style={{ padding: '3px 10px', fontSize: '0.75rem' }}
              >
                ▶️ Run Job
              </button>
              <button 
                className="btn btn-secondary btn-small" 
                onClick={handleStop}
                disabled={!isRunning}
                style={{ padding: '3px 10px', fontSize: '0.75rem', background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
              >
                ⏹️ Terminate
              </button>
            </div>
          </div>

          <div className="editor-body">
            <div className="code-cell">
              <span style={{ color: '#6366f1' }}>import</span> aegis_ml <span style={{ color: '#6366f1' }}>as</span> aml<br />
              <span style={{ color: '#6366f1' }}>import</span> tensorflow <span style={{ color: '#6366f1' }}>as</span> tf<br /><br />
              # Mount Cardano License UTxO and dataset<br />
              dataset = aml.mount_dataset(license_nft=<span style={{ color: '#a855f7' }}>"CIP25_LICENSE_NFT_ID"</span>)<br />
              model = tf.keras.models.Sequential([<br />
              &nbsp;&nbsp;tf.keras.layers.Dense(<span style={{ color: '#f59e0b' }}>128</span>, activation=<span style={{ color: '#a855f7' }}>'relu'</span>),<br />
              &nbsp;&nbsp;tf.keras.layers.Dense(<span style={{ color: '#f59e0b' }}>1</span>, activation=<span style={{ color: '#a855f7' }}>'sigmoid'</span>)<br />
              ])<br />
              aml.federated_train(model, dataset, epochs=<span style={{ color: '#f59e0b' }}>10</span>, aggregation_ratio=<span style={{ color: '#f59e0b' }}>0.05</span>)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {logs.map((log, index) => (
                <div key={index} className="output-cell" style={{ borderLeftColor: log.includes("WARNING") ? '#ef4444' : log.includes("SYSTEM") ? '#38bdf8' : '#10b981' }}>
                  {log}
                </div>
              ))}
              {isRunning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', paddingLeft: '8px' }}>
                  <span className="spinner"></span>
                  <span>Executing epoch logs...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Configuration Sidepanel */}
        <div className="workspace-sidebar">
          <div className="hardware-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>Mount Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Select Unlocked Dataset</label>
              <select 
                value={selectedDataset} 
                onChange={e => setSelectedDataset(e.target.value)}
                style={{ padding: '0.5rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              >
                <option value="">-- Choose Dataset --</option>
                {datasets && datasets.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="hardware-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>Telemetry & Metrics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div className="hardware-metric">
                  <span>Job Progress</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%`, background: '#10b981' }}></div>
                </div>
              </div>

              <div>
                <div className="hardware-metric">
                  <span>Loss Rate</span>
                  <strong>{loss}</strong>
                </div>
              </div>

              <div>
                <div className="hardware-metric">
                  <span>Model Accuracy</span>
                  <strong>{(accuracy * 100).toFixed(2)}%</strong>
                </div>
              </div>

              <div>
                <div className="hardware-metric">
                  <span>GPU Cluster Temp</span>
                  <strong style={{ color: gpuTemp > 72 ? '#ef4444' : '#10b981' }}>{gpuTemp}°C</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
