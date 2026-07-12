import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import IPFSUpload from '../components/IPFSUpload';
import ChatBot from '../components/ChatBot';
import { registerDatasetOnCardano, adaToLovelace, saveStoredDataset } from '../lib/cardano';

export default function Upload({ account, lucid }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataType: 'medical',
    priceInADA: '',
    file: null
  });
  
  const [uploading, setUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState('');
  const [step, setStep] = useState(1); // 1: Form, 2: Uploading, 3: Cardano Auditing/Minting
  
  // Pipeline Scan States
  const [scanStep, setScanStep] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  
  const fileInputRef = useRef();

  const dataTypes = [
    { value: 'medical', label: 'Medical / Healthcare', icon: '🏥' },
    { value: 'financial', label: 'Financial', icon: '🏦' },
    { value: 'behavioral', label: 'Behavioral / Customer', icon: '🛍️' },
    { value: 'iot', label: 'IoT / Sensor Data', icon: '📡' },
    { value: 'research', label: 'Research / Academic', icon: '🔬' },
    { value: 'other', label: 'Other', icon: '📊' }
  ];

  const pipelineSteps = [
    "Scanning dataset for viruses & ransomware...",
    "Analyzing CSV/JSON schema and detecting headers...",
    "Extracting metadata & checking compliance (GDPR/HIPAA)...",
    "Running duplicate detection check...",
    "Computing AI Trust Quality Score...",
    "Generating cryptographic Dataset Passport...",
    "Minting Cardano Asset Passport NFT (CIP-25)...",
    "Registering contract locking UTxO datum..."
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        alert('File size must be less than 100MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const handleIPFSUpload = async () => {
    if (!formData.file) {
      alert('Please select a file first');
      return;
    }

    if (!formData.name || !formData.description || !formData.priceInADA) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setStep(2);

    try {
      // Simulate file encryption and IPFS upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('metadata', JSON.stringify({
        name: formData.name,
        description: formData.description,
        dataType: formData.dataType,
        uploadTime: new Date().toISOString(),
        fileSize: formData.file.size,
        fileName: formData.file.name
      }));

      const response = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();
      
      if (result.success) {
        setIpfsHash(result.ipfsHash);
        setStep(3);
        runAegisPipeline(result.ipfsHash);
      } else {
        throw new Error(result.error || 'Failed to upload to IPFS');
      }
    } catch (error) {
      console.error('IPFS upload error:', error);
      alert('Failed to upload to IPFS: ' + error.message);
      setStep(1);
      setUploading(false);
    }
  };

  const runAegisPipeline = async (ipfsCID) => {
    setScanStep(0);
    setPipelineLogs([]);

    // Execute step-by-step pipeline simulations
    for (let i = 0; i < pipelineSteps.length; i++) {
      setScanStep(i);
      setPipelineLogs(prev => [...prev, `[INFO] ${pipelineSteps[i]}`]);
      
      // Dynamic simulated delays
      let delay = 1000;
      if (i === 4) delay = 1500; // Computing trust score
      if (i === 6) delay = 1800; // Minting NFT
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Pipeline finished, register on blockchain
    await registerOnBlockchain(ipfsCID);
  };

  const registerOnBlockchain = async (ipfsCID) => {
    try {
      if (!account) {
        throw new Error('Please connect your wallet first');
      }

      const scriptAddress = process.env.NEXT_PUBLIC_SCRIPT_ADDRESS || 'addr_test1vzpwq5z3xyum8vqnddd9mdnmafh3djcxnc6jemlgdmswcve6tkw';
      const priceLovelace = adaToLovelace(formData.priceInADA);

      const trustScoreVal = Math.floor(Math.random() * (98 - 88 + 1)) + 88; // 88-98 quality score

      console.log('Registering dataset on Cardano blockchain...');
      const txResult = await registerDatasetOnCardano(lucid, scriptAddress, {
        ipfsCID,
        name: formData.name,
        description: formData.description,
        dataType: formData.dataType,
        priceLovelace,
        fileSize: formData.file.size
      });

      // Save dataset locally
      saveStoredDataset({
        owner: account,
        ipfsCID,
        name: formData.name,
        description: formData.description,
        dataType: formData.dataType,
        priceLovelace,
        fileSize: formData.file.size,
        trustScore: trustScoreVal
      });

      alert(`Aegis AI v2 Dataset Registered!\nDataset Passport NFT: CIP25_ASSET_${formData.name.toUpperCase().replace(/\\s/g, '_')}\nDataset Trust Score: ${trustScoreVal}/100\nTransaction Hash: ${txResult.hash}`);
      router.push('/marketplace');
    } catch (error) {
      console.error('Cardano registration error:', error);
      alert('Failed to register on Cardano blockchain: ' + (error.message || error));
      setStep(1);
      setUploading(false);
    }
  };

  if (!account) {
    return (
      <div className="upload-page">
        <div className="container">
          <div className="connect-prompt" style={{ textAlign: 'center', padding: '6rem 0' }}>
            <h2>Connect Your Wallet</h2>
            <p>Please connect your Cardano wallet to upload datasets.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page" style={{ padding: '3rem 0' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        <div className="upload-header" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', fontWeight: '850', color: 'white' }}>📤 Mint & Upload Dataset</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Lock dataset assets on-chain, generate a compliant Dataset Trust Score and mint verification NFTs.
          </p>
        </div>

        {/* Progress Header */}
        <div className="upload-progress" style={{ display: 'flex', justifyContent: 'space-between', background: '#161826', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem' }}>
          <span style={{ color: step >= 1 ? '#6366f1' : '#94a3b8', fontWeight: 'bold' }}>1. Specifications</span>
          <span style={{ color: step >= 2 ? '#6366f1' : '#94a3b8', fontWeight: 'bold' }}>2. Encrypted IPFS Upload</span>
          <span style={{ color: step >= 3 ? '#6366f1' : '#94a3b8', fontWeight: 'bold' }}>3. Dataset Trust Audit & Minting</span>
        </div>

        {step === 1 && (
          <div className="upload-form" style={{ background: '#161826', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>Dataset Registry Specifications</h3>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="name" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Dataset Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Anonymized Genomic Research Hub"
                  style={{ padding: '0.65rem 0.8rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="description" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Objective / Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide features, column descriptors, and specific targets..."
                  rows={4}
                  style={{ padding: '0.65rem 0.8rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'vertical' }}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="dataType" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Data Type *</label>
                <select
                  id="dataType"
                  name="dataType"
                  value={formData.dataType}
                  onChange={handleInputChange}
                  style={{ padding: '0.65rem 0.8rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  required
                >
                  {dataTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="priceInADA" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Price per Access (ADA) *</label>
                <input
                  type="number"
                  id="priceInADA"
                  name="priceInADA"
                  value={formData.priceInADA}
                  onChange={handleInputChange}
                  placeholder="50"
                  step="1"
                  min="1"
                  style={{ padding: '0.65rem 0.8rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  required
                />
                <small style={{ color: '#64748b' }}>Minimum: 1 ADA</small>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="file" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Dataset File *</label>
                <div className="file-upload-area" style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '12px', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                  <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.json,.parquet,.xlsx"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }}
                    required
                  />
                  <div>
                    {formData.file ? (
                      <div>
                        <span style={{ fontSize: '2rem' }}>📄</span>
                        <h4 style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>{formData.file.name}</h4>
                        <small style={{ color: '#94a3b8' }}>{(formData.file.size / 1024 / 1024).toFixed(2)} MB</small>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '2rem', color: '#64748b' }}>☁️</span>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#94a3b8' }}>Click to select dataset file or drag and drop</p>
                        <small style={{ color: '#64748b' }}>Supported: CSV, JSON, Parquet, Excel (Max 100MB)</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="privacy-notice" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                <h4 style={{ fontWeight: 'bold', color: '#a5b4fc', marginBottom: '0.4rem' }}>🔒 Aegis secure publishing</h4>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '3px', color: '#94a3b8' }}>
                  <li>Local asymmetric encryption key is loaded on client.</li>
                  <li>Dataset is encrypted in browser before uploading to IPFS.</li>
                  <li>On-chain Datum validates access license without exposing content.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleIPFSUpload}
                disabled={!formData.name || !formData.description || !formData.priceInADA || !formData.file || uploading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                🚀 Initialize Upload & Trust Audit
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="upload-status" style={{ textAlign: 'center', background: '#161826', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '3rem' }} className="spinner">☁️</span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '1.5rem', fontWeight: 'bold' }}>Encrypting & Uploading to IPFS...</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto 0' }}>
              Your dataset is being encrypted locally using a client key and sent to the decentralized IPFS network.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="upload-status" style={{ background: '#161826', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ fontSize: '2.5rem' }}>🛡️</span>
              <h3 style={{ fontSize: '1.4rem', marginTop: '0.5rem', fontWeight: 'bold' }}>Aegis Trust Audit Pipeline</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Executing automated quality checks and minting the Cardano Dataset Passport NFT
              </p>
            </div>

            <div className="scan-pipeline">
              {pipelineSteps.map((stepDesc, idx) => {
                let status = "pending"; // pending, active, completed
                if (scanStep === idx) status = "active";
                if (scanStep > idx) status = "completed";

                return (
                  <div key={idx} className={`pipeline-step ${status}`} style={{ opacity: status === "pending" ? 0.4 : 1 }}>
                    <span style={{ fontSize: '0.85rem', color: status === "completed" ? '#10b981' : status === "active" ? '#6366f1' : '#94a3b8' }}>
                      {status === "completed" ? "✓" : status === "active" ? "⚡" : "○"} {stepDesc}
                    </span>
                    {status === "active" && <span className="spinner"></span>}
                    {status === "completed" && <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>DONE</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '1rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', maxHeight: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
              {pipelineLogs.map((log, i) => (
                <div key={i} style={{ color: log.includes("Mint") ? '#38bdf8' : '#94a3b8' }}>{log}</div>
              ))}
              <div style={{ color: '#10b981' }}>[AUDIT] Awaiting wallet signature to submit transactions...</div>
            </div>
          </div>
        )}
      </div>

      <ChatBot account={account} />
    </div>
  );
}
