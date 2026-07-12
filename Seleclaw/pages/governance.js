import { useState, useEffect } from 'react';
import { getProposals, voteOnProposal, submitProposal } from '../lib/cardano';
import ChatBot from '../components/ChatBot';

export default function Governance({ account }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  
  // Submit proposal state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [treasuryBalance, setTreasuryBalance] = useState(25000.00); // 25,000 ADA

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = () => {
    try {
      setLoading(true);
      setProposals(getProposals());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (proposalId, voteType) => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const updated = voteOnProposal(proposalId, voteType, account);
      setProposals(prev => prev.map(p => Number(p.id) === Number(proposalId) ? updated : p));
      alert(`Vote of 100 ADA weight submitted successfully for proposal #${proposalId}!`);
    } catch (err) {
      alert(err.message || err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) return;
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const newProp = submitProposal(title, description, account);
      setProposals(prev => [...prev, newProp]);
      setTitle('');
      setDescription('');
      setShowSubmit(false);
      alert(`Proposal #${newProp.id} published successfully on Cardano Governance ledger!`);
    } catch (err) {
      alert(err.message || err);
    }
  };

  if (loading) {
    return (
      <div className="governance-page" style={{ padding: '2rem 0' }}>
        <div className="container">
          <p>Loading Aegis Cardano Governance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="governance-page" style={{ padding: '3rem 0' }}>
      <div className="container">
        {/* Governance Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginBottom: '3rem', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', fontWeight: '850', color: 'white' }}>🏛️ Aegis Cardano Governance</h1>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginTop: '0.5rem' }}>
              Submit community proposals, audit treasury balances, and vote on pipeline upgrades using ADA delegation.
            </p>
          </div>

          {/* Treasury Card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)', padding: '1.25rem', borderRadius: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 'bold' }}>Governance Treasury</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', marginTop: '0.25rem' }}>{treasuryBalance.toLocaleString()} ADA</h2>
            <small style={{ color: '#94a3b8' }}>5% splits pooled from market licenses</small>
          </div>
        </div>

        {/* Proposals Navigation & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Active Governance Proposals</h2>
          {account && (
            <button className="btn btn-primary" onClick={() => setShowSubmit(!showSubmit)}>
              {showSubmit ? 'Close Form' : '➕ Submit Proposal'}
            </button>
          )}
        </div>

        {showSubmit && (
          <form onSubmit={handleSubmit} style={{ background: '#161826', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>Submit Proposal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Proposal Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g., Build diagnostic scanner module for breast cancer biopsy Parquet files" 
                style={{ padding: '0.65rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Proposal Description *</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Detail proposal objectives, required ADA treasury funding, and benefits to the Aegis community..." 
                rows={4}
                style={{ padding: '0.65rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'vertical' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
              Submit to Ledger
            </button>
          </form>
        )}

        {/* Proposals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {proposals.map(prop => {
            const totalVotes = prop.votesYes + prop.votesNo + prop.votesAbstain;
            const yesPercent = totalVotes > 0 ? ((prop.votesYes / totalVotes) * 100).toFixed(1) : 0;
            const noPercent = totalVotes > 0 ? ((prop.votesNo / totalVotes) * 100).toFixed(1) : 0;

            return (
              <div key={prop.id} style={{ background: '#161826', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Proposal #{prop.id}
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '0.5rem', color: '#fff' }}>{prop.title}</h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                    {prop.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.6' }}>{prop.description}</p>

                <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                  {/* Voting Progress */}
                  <div style={{ flexGrow: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                      <span>Yes: <strong>{prop.votesYes} ADA ({yesPercent}%)</strong></span>
                      <span>No: <strong>{prop.votesNo} ADA ({noPercent}%)</strong></span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${yesPercent}%`, background: '#10b981' }}></div>
                      <div style={{ width: `${noPercent}%`, background: '#ef4444' }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                      Abstain: {prop.votesAbstain} ADA | Total Delegated: {totalVotes} ADA
                    </div>
                  </div>

                  {/* Voting Toggles */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-small" onClick={() => handleVote(prop.id, 'yes')} style={{ borderColor: 'rgba(16,185,129,0.3)', color: '#10b981', background: 'rgba(16,185,129,0.02)' }}>
                      Yes 👍
                    </button>
                    <button className="btn btn-secondary btn-small" onClick={() => handleVote(prop.id, 'no')} style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', background: 'rgba(239,68,68,0.02)' }}>
                      No 👎
                    </button>
                    <button className="btn btn-secondary btn-small" onClick={() => handleVote(prop.id, 'abstain')} style={{ borderColor: 'rgba(100,116,139,0.3)', color: '#94a3b8' }}>
                      Abstain 🗳️
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                  Author: {prop.creator}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ChatBot />
    </div>
  );
}
