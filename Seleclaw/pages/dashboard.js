import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DatasetCard from '../components/DatasetCard';
import StatsCard from '../components/StatsCard';
import ChatBot from '../components/ChatBot';
import CollaborationRooms from '../components/CollaborationRooms';
import AIWorkspace from '../components/AIWorkspace';
import { getStoredDatasets, getStoredPurchases, getProviderReputation, lovelaceToAda } from '../lib/cardano';

export default function Dashboard({ account }) {
  const router = useRouter();
  const [userStats, setUserStats] = useState({
    datasetsOwned: 0,
    totalEarnings: 0,
    datasetsPurchased: 0,
    totalSpent: 0
  });
  const [ownedDatasets, setOwnedDatasets] = useState([]);
  const [purchasedDatasets, setPurchasedDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reputation, setReputation] = useState(null);

  useEffect(() => {
    if (account) {
      loadDashboardData();
    }
  }, [account]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const allDatasets = getStoredDatasets();
      
      // Load user's owned datasets
      const owned = allDatasets.filter(
        ds => ds.owner?.toLowerCase() === account?.toLowerCase()
      );
      
      // Load user's purchased datasets
      const purchasedIds = getStoredPurchases(account);
      const purchased = allDatasets
        .filter(ds => purchasedIds.includes(Number(ds.id)))
        .map(ds => ({
          ...ds,
          purchaseId: ds.id,
          purchaseTime: ds.createdAt + 3600, // Simulated purchase 1 hour later
          accessToken: `access_cardano_${ds.id}_${account?.slice(0, 12)}`
        }));
      
      // Calculate earnings (95% of total sales price)
      const totalEarningsLovelace = owned.reduce((total, dataset) => {
        const sales = BigInt(dataset.priceLovelace || '0') * BigInt(dataset.purchaseCount || 0);
        return total + (sales * 95n) / 100n;
      }, 0n);
      
      // Calculate total spent
      const totalSpentLovelace = purchased.reduce((total, dataset) => {
        return total + BigInt(dataset.priceLovelace || '0');
      }, 0n);
      
      setUserStats({
        datasetsOwned: owned.length,
        totalEarnings: parseFloat(lovelaceToAda(totalEarningsLovelace.toString())),
        datasetsPurchased: purchased.length,
        totalSpent: parseFloat(lovelaceToAda(totalSpentLovelace.toString()))
      });
      
      setOwnedDatasets(owned);
      setPurchasedDatasets(purchased);
      
      // Get reputation details
      const repDetails = getProviderReputation(account);
      setReputation(repDetails);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="connect-prompt" style={{ textAlign: 'center', padding: '6rem 0' }}>
            <h2>Connect Your Wallet</h2>
            <p>Please connect your Cardano wallet to view your dashboard.</p>
            <button className="btn btn-primary" onClick={() => router.push('/')} style={{ marginTop: '1rem' }}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ padding: '2rem 0' }}>
      <div className="container">
        <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', fontWeight: '850', color: 'white' }}>📊 Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
            Manage your credentials, training workspace, and collaborations on Cardano
          </p>
          <div className="user-info" style={{ marginTop: '0.5rem' }}>
            <span className="user-address" style={{ fontFamily: 'monospace', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: '6px' }}>
              {account}
            </span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview" style={{ marginBottom: '2.5rem' }}>
          <div className="stats-grid">
            <StatsCard
              title="Datasets Uploaded"
              value={userStats.datasetsOwned}
              icon="📊"
              loading={loading}
            />
            <StatsCard
              title="Escrow Earnings"
              value={`${userStats.totalEarnings.toFixed(2)} ADA`}
              icon="💰"
              loading={loading}
            />
            <StatsCard
              title="Active Licenses"
              value={userStats.datasetsPurchased}
              icon="🛒"
              loading={loading}
            />
            <StatsCard
              title="Accumulated Spending"
              value={`${userStats.totalSpent.toFixed(2)} ADA`}
              icon="💸"
              loading={loading}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '2rem', overflowX: 'auto' }}>
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{ background: activeTab === 'overview' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'overview' ? 'white' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            📈 Overview
          </button>
          <button
            className={`tab ${activeTab === 'owned' ? 'active' : ''}`}
            onClick={() => setActiveTab('owned')}
            style={{ background: activeTab === 'owned' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'owned' ? 'white' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            📊 My Datasets ({userStats.datasetsOwned})
          </button>
          <button
            className={`tab ${activeTab === 'purchased' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchased')}
            style={{ background: activeTab === 'purchased' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'purchased' ? 'white' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            🛒 Licensed ({userStats.datasetsPurchased})
          </button>
          <button
            className={`tab ${activeTab === 'collab' ? 'active' : ''}`}
            onClick={() => setActiveTab('collab')}
            style={{ background: activeTab === 'collab' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'collab' ? 'white' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            🤝 Collaboration Rooms
          </button>
          <button
            className={`tab ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
            style={{ background: activeTab === 'workspace' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'workspace' ? 'white' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            💻 Secure AI Workspace
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
            style={{ background: activeTab === 'activity' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'activity' ? 'white' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            📋 Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
              {/* Left Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="quick-actions">
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: '700' }}>Quick Navigation</h3>
                  <div className="action-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="action-card" onClick={() => router.push('/upload')} style={{ background: '#161826', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'var(--transition)' }}>
                      <span style={{ fontSize: '1.5rem' }}>📤</span>
                      <h4 style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Upload Dataset</h4>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Mint passports and lock Datums</p>
                    </div>
                    <div className="action-card" onClick={() => router.push('/marketplace')} style={{ background: '#161826', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'var(--transition)' }}>
                      <span style={{ fontSize: '1.5rem' }}>🛒</span>
                      <h4 style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Explore Marketplace</h4>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>View Trust Scores & license terms</p>
                    </div>
                    <div className="action-card" onClick={() => setActiveTab('workspace')} style={{ background: '#161826', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'var(--transition)' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎯</span>
                      <h4 style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Secure AI Workspace</h4>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Commence sandbox VM training loops</p>
                    </div>
                  </div>
                </div>

                <div className="recent-activity">
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: '700' }}>Recent Operations Log</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {ownedDatasets.slice(0, 2).map(dataset => (
                      <div key={dataset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.2rem' }}>📊</span>
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Dataset Uploaded: {dataset.name}</p>
                            <small style={{ color: '#94a3b8' }}>Dataset Trust Score: {dataset.trustScore}% | {dataset.purchaseCount} accesses</small>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(dataset.createdAt * 1000).toLocaleDateString()}</span>
                      </div>
                    ))}
                    
                    {purchasedDatasets.slice(0, 2).map(dataset => (
                      <div key={`purchase-${dataset.purchaseId}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.2rem' }}>🛒</span>
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>License NFT Minted: {dataset.name}</p>
                            <small style={{ color: '#94a3b8' }}>Mounted via CIP-25 contract policy</small>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(dataset.purchaseTime * 1000).toLocaleDateString()}</span>
                      </div>
                    ))}
                    
                    {ownedDatasets.length === 0 && purchasedDatasets.length === 0 && (
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No recent activities logs found.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Provider Reputation Profile */}
              <div>
                {reputation && (
                  <div style={{ background: 'linear-gradient(135deg, #161826 0%, #111322 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '2.5rem' }}>🛡️</span>
                      <h3 style={{ fontSize: '1.15rem', marginTop: '0.5rem', fontWeight: 'bold' }}>Provider Reputation</h3>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '0.25rem', fontWeight: 'bold' }}>
                        VERIFIED NODE
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Trust Score Index:</span>
                        <strong style={{ color: '#06b6d4' }}>{reputation.trustScore}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Rating Score:</span>
                        <strong style={{ color: '#f59e0b' }}>⭐ {reputation.stars}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Total Datasets:</span>
                        <strong>{reputation.datasetsCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Total Downloads:</span>
                        <strong>{reputation.downloads}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                        <span style={{ color: '#94a3b8' }}>Accumulated Royalties:</span>
                        <strong style={{ color: '#10b981' }}>{reputation.royaltiesADA} ADA</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'owned' && (
            <div className="owned-tab">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Your Datasets</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push('/upload')}
                >
                  📤 Mint New Dataset NFT
                </button>
              </div>
              
              {loading ? (
                <div className="loading-grid">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="dataset-card loading">
                      <div className="loading-placeholder"></div>
                    </div>
                  ))}
                </div>
              ) : ownedDatasets.length > 0 ? (
                <div className="datasets-grid">
                  {ownedDatasets.map(dataset => (
                    <DatasetCard
                      key={dataset.id}
                      dataset={dataset}
                      isOwner={true}
                      showAnalytics={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <span style={{ fontSize: '2rem' }}>📊</span>
                  <h4 style={{ marginTop: '1rem' }}>No datasets uploaded yet</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Mint your first dataset NFT to start compiling passports!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchased' && (
            <div className="purchased-tab">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Licensed Datasets</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push('/marketplace')}
                >
                  🛒 Browse Marketplace
                </button>
              </div>
              
              {loading ? (
                <div className="loading-grid">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="dataset-card loading">
                      <div className="loading-placeholder"></div>
                    </div>
                  ))}
                </div>
              ) : purchasedDatasets.length > 0 ? (
                <div className="datasets-grid">
                  {purchasedDatasets.map(dataset => (
                    <div key={dataset.purchaseId} className="purchased-dataset-card" style={{ background: '#161826', padding: '1rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <DatasetCard
                        dataset={dataset}
                        isPurchased={true}
                        onStartTraining={() => setActiveTab('workspace')}
                      />
                      <div className="purchase-info" style={{ marginTop: '1rem', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Access NFT:</span>
                          <span style={{ fontFamily: 'monospace', color: '#10b981' }}>CIP25_LICENSE_AEGIS_{dataset.id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Purchased:</span>
                          <span>{new Date(dataset.purchaseTime * 1000).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Session Token:</span>
                          <span style={{ fontFamily: 'monospace' }}>{dataset.accessToken.substring(0, 18)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <span style={{ fontSize: '2rem' }}>🛒</span>
                  <h4 style={{ marginTop: '1rem' }}>No licenses purchased yet</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Browse the marketplace to buy secure training access!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collab' && (
            <CollaborationRooms account={account} />
          )}

          {activeTab === 'workspace' && (
            <AIWorkspace datasets={purchasedDatasets.concat(ownedDatasets)} />
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab" style={{ maxWidth: '700px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Operations Timeline</h3>
              <div className="activity-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Upload activities */}
                {ownedDatasets.map(dataset => (
                  <div key={`upload-${dataset.id}`} style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ fontSize: '1.25rem', background: 'rgba(99,102,241,0.15)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.3)' }}>📤</div>
                    <div style={{ background: '#161826', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Dataset Passport Created</h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>"{dataset.name}" was quality-scanned and published.</p>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                        <span>Trust Score: {dataset.trustScore}%</span>
                        <span>Price: {lovelaceToAda(dataset.priceLovelace)} ADA</span>
                        <span>{new Date(dataset.createdAt * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Purchase activities */}
                {purchasedDatasets.map(dataset => (
                  <div key={`purchase-${dataset.purchaseId}`} style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ fontSize: '1.25rem', background: 'rgba(16,185,129,0.15)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.3)' }}>🛒</div>
                    <div style={{ background: '#161826', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>License NFT Acquired</h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>Unlocked secure AI training access for "{dataset.name}".</p>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                        <span>Cost: {lovelaceToAda(dataset.priceLovelace)} ADA</span>
                        <span>Session: {dataset.accessToken.substring(0, 14)}...</span>
                        <span>{new Date(dataset.purchaseTime * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {ownedDatasets.length === 0 && purchasedDatasets.length === 0 && (
                  <div className="no-activity" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <span style={{ fontSize: '2rem' }}>📋</span>
                    <h4 style={{ marginTop: '1rem' }}>No activity records found</h4>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatBot account={account} />
    </div>
  );
}
