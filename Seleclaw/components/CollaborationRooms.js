import { useState, useEffect } from 'react';
import { getCollaborationRooms, createCollaborationRoom } from '../lib/cardano';

export default function CollaborationRooms({ account }) {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setRooms(getCollaborationRooms());
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name || !description) return;
    const newRoom = createCollaborationRoom(name, description);
    setRooms(prev => [...prev, newRoom]);
    setName('');
    setDescription('');
    setShowCreate(false);
    alert(`Collaboration Room "${name}" created successfully on Cardano!`);
  };

  const handleJoin = (roomName) => {
    alert(`Successfully joined "${roomName}". You can now pool your datasets to this project workspace.`);
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🤝 AI Collaboration Rooms</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Pool datasets securely with hospitals, labs, and researchers. Train shared models and track contributions.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Close Form' : '➕ Create Room'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: '#161826', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Create Joint Collaboration Hub</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Room / Project Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Cancer Genomic Research Pool" 
              style={{ padding: '0.6rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Objective / Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Detail the collaborative goals, data requirements, and model targets..." 
              style={{ padding: '0.6rem', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', rows: '3' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
            Initialize Room on Cardano
          </button>
        </form>
      )}

      <div className="collaboration-grid">
        {rooms.map(room => (
          <div key={room.id} className="room-card">
            <div>
              <span style={{ fontSize: '0.7rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 'bold', background: 'rgba(6,182,212,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Active Room</span>
              <h3 style={{ fontSize: '1.25rem', marginTop: '0.5rem', fontWeight: '700' }}>{room.name}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem', minHeight: '60px' }}>{room.description}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Shared Datasets: <strong>{room.datasetsCount}</strong></span>
              <span>Joint Royalty Pool: <strong style={{ color: '#10b981' }}>{room.accADA} ADA</strong></span>
            </div>

            <div className="room-participants">
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Participants:</span>
              <div style={{ display: 'flex', marginLeft: '6px' }}>
                {room.participants.map((p, idx) => (
                  <div key={idx} className="participant-avatar" title={p} style={{ marginLeft: idx > 0 ? '-8px' : '0' }}>
                    {p.charAt(0)}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-small" onClick={() => handleJoin(room.name)} style={{ flexGrow: 1 }}>
                🤝 Connect Node (Join)
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => alert(`Contribution Log:\nHospital A: 55% data\nUniversity B: 45% data\nRevenue distribution is split automatically via Smart Contract.`)}>
                📋 Info
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
