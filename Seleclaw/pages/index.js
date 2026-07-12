import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatBot from '../components/ChatBot';
import DatasetCard from '../components/DatasetCard';
import StatsCard from '../components/StatsCard';
import { getStoredDatasets } from '../lib/cardano';

/**
 * Home Page Component for Aegis AI v2 on Cardano
 */
export default function Home({ account }) {
  const [datasets, setDatasets] = useState([]);
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalPurchases: 0,
    totalActiveDatasets: 0,
    avgTrustScore: 94
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const datasetsData = getStoredDatasets();
      
      setDatasets(datasetsData.slice(0, 3) || []);
      const totalTrust = datasetsData.reduce((acc, d) => acc + (d.trustScore || 85), 0);
      setStats({
        totalDatasets: datasetsData.length,
        totalPurchases: datasetsData.reduce((acc, ds) => acc + (ds.purchaseCount || 0), 0),
        totalActiveDatasets: datasetsData.filter(ds => ds.isActive).length,
        avgTrustScore: datasetsData.length > 0 ? Math.floor(totalTrust / datasetsData.length) : 94
      });
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* ======================== HERO SECTION ======================== */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '6px 14px', borderRadius: '9999px', fontWeight: 'bold', border: '1px solid rgba(99,102,241,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Aegis AI v2 – Cardano General Track
            </span>
            <h1 style={{ marginTop: '1.25rem' }}>AI Dataset Governance, Trust & Provenance</h1>
            <p className="hero-subtitle">
              Verify compliance, audit dataset passports, and compute in privacy-preserving workspaces.
              Establish true reputational trust for high-value AI models.
            </p>

            <div className="hero-actions">
              <Link href="/upload" className="btn btn-primary">
                📤 Mint & Upload Dataset
              </Link>
              <Link href="/marketplace" className="btn btn-secondary">
                🛒 Browse Trust Marketplace
              </Link>
            </div>

            <div className="hero-features">
              <div className="feature">
                <span className="feature-icon">🔒</span>
                <span>Differential Privacy & Encryption</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🎫</span>
                <span>Dataset Passports & NFTs</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⭐</span>
                <span>Dataset Trust Score Validation</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🤝</span>
                <span>Multi-party Collab Rooms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== STATS SECTION ======================== */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <StatsCard
              title="Global Repositories"
              value={stats.totalDatasets}
              icon="📊"
              loading={loading}
            />
            <StatsCard
              title="Verified Transactions"
              value={stats.totalPurchases}
              icon="🛒"
              loading={loading}
            />
            <StatsCard
              title="Dataset Trust Score Avg"
              value={`${stats.avgTrustScore}%`}
              icon="🎯"
              loading={loading}
            />
            <StatsCard
              title="Royalty Split Pool"
              value="5% split"
              icon="💰"
              loading={false}
            />
          </div>
        </div>
      </section>

      {/* ======================== FEATURED DATASETS ======================== */}
      <section className="featured-datasets" style={{ padding: '3rem 0' }}>
        <div className="container">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Featured Trust Repositories</h2>
            <Link href="/marketplace" className="view-all-link" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
              View All Repositories →
            </Link>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="dataset-card loading">
                  <div className="loading-placeholder"></div>
                </div>
              ))}
            </div>
          ) : datasets.length > 0 ? (
            <div className="datasets-grid">
              {datasets.map((dataset, i) => (
                <DatasetCard
                  key={dataset.id?.toString() || i}
                  dataset={dataset}
                  showPreview={true}
                />
              ))}
            </div>
          ) : (
            <p className="no-datasets-msg">No active datasets available.</p>
          )}
        </div>
      </section>

      {/* ======================== HOW IT WORKS ======================== */}
      <section className="how-it-works" style={{ background: 'rgba(255,255,255,0.01)', padding: '5rem 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem' }}>Dataset Lifecycle & Governance</h2>
          <div className="steps-grid">
            <div className="step" style={{ background: '#161826', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="step-number" style={{ background: '#6366f1', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '1rem' }}>1</div>
              <h3>Automatic Quality Scanning</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Every dataset undergoes schema auditing, missing value evaluation, and duplicate detection to compute its Dataset Trust Score.
              </p>
            </div>
            <div className="step" style={{ background: '#161826', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="step-number" style={{ background: '#6366f1', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '1rem' }}>2</div>
              <h3>NFT Minting & Passports</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                The engine generates a secure Dataset Passport tracking origin, licenses, compliance, and mints an on-chain verification NFT.
              </p>
            </div>
            <div className="step" style={{ background: '#161826', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="step-number" style={{ background: '#6366f1', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '1rem' }}>3</div>
              <h3>Escrow Purchases & Licenses</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Payments in ADA are locked in escrow contracts, verifying compliance terms before minting CIP-25 License NFTs for buyers.
              </p>
            </div>
            <div className="step" style={{ background: '#161826', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="step-number" style={{ background: '#6366f1', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '1rem' }}>4</div>
              <h3>Federated ML Sandboxes</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Train models in GPU-backed workspace sandboxes without raw data leaving original nodes, protecting privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== CHATBOT ======================== */}
      <ChatBot account={account} />
    </div>
  );
}
