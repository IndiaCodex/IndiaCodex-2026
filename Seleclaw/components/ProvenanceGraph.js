import { useState } from 'react';

export default function ProvenanceGraph({ datasetName, providerName }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const nodes = [
    {
      id: 'provider',
      label: '🏥 Hospital (Provider)',
      title: providerName ? `${providerName.slice(0, 8)}...${providerName.slice(-6)}` : 'Hospital Node #7',
      x: 100,
      y: 50,
      description: 'The hospital node collecting patient records and asserting data ownership on Cardano.'
    },
    {
      id: 'dataset',
      label: '📂 Dataset v1',
      title: datasetName || 'Clinical Outcome Dataset',
      x: 280,
      y: 50,
      description: 'Initial registry schema. Hashed, encrypted, and uploaded to IPFS.'
    },
    {
      id: 'certificate',
      label: '🏅 Certificate NFT',
      title: 'AegisCert NFT',
      x: 460,
      y: 50,
      description: 'On-chain Cardano certificate verification badge proving data integrity.'
    },
    {
      id: 'license',
      label: '📜 License NFT',
      title: 'Aegis Smart License',
      x: 460,
      y: 140,
      description: 'CIP-25 license access token acquired by the training node via escrow payment.'
    },
    {
      id: 'training',
      label: '⚙️ Training Job',
      title: 'Secure Workspace VM',
      x: 280,
      y: 140,
      description: 'Simulated sandbox computation loops. Computes model weights with zero data leakage.'
    },
    {
      id: 'model',
      label: '🧠 AI Model',
      title: 'Trained Weights',
      x: 100,
      y: 140,
      description: 'The resulting neural network weights compiled in the Secure AI Workspace.'
    },
    {
      id: 'research',
      label: '🔬 Research Paper',
      title: 'Validation Studies',
      x: 100,
      y: 230,
      description: 'Academic studies and peer reviews validating model accuracy stats.'
    },
    {
      id: 'product',
      label: '🏦 Commercial Product',
      title: 'Clinical Risk Advisor',
      x: 280,
      y: 230,
      description: 'Deployed diagnostic app leveraging trained weights in clinical production.'
    },
    {
      id: 'royalties',
      label: '💰 Royalties Pool',
      title: '5% Treasury splits',
      x: 460,
      y: 230,
      description: 'Automatic splits routed on-chain back to the original hospital wallet address.'
    }
  ];

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div style={{ background: '#161826', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#fff' }}>
        🔗 AI Data Provenance Graph
      </h3>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
        Audit trail tracking data from hospital origin to validation, licensing, training, model weight outcomes, research, and royalties.
      </p>

      {/* Snake Visual Flow SVG */}
      <div style={{ display: 'flex', justifyContent: 'center', background: '#0a0b10', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.03)' }}>
        <svg width="560" height="280">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
            </marker>
          </defs>

          {/* Connection Lines */}
          {/* Node 1 -> 2 */}
          <line x1="165" y1="50" x2="210" y2="50" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />
          {/* Node 2 -> 3 */}
          <line x1="345" y1="50" x2="390" y2="50" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />
          {/* Node 3 -> 4 */}
          <line x1="460" y1="80" x2="460" y2="105" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />
          {/* Node 4 -> 5 */}
          <line x1="395" y1="140" x2="350" y2="140" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />
          {/* Node 5 -> 6 */}
          <line x1="215" y1="140" x2="170" y2="140" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />
          {/* Node 6 -> 7 */}
          <line x1="100" y1="170" x2="100" y2="195" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />
          {/* Node 7 -> 8 */}
          <line x1="165" y1="230" x2="210" y2="230" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />
          {/* Node 8 -> 9 */}
          <line x1="345" y1="230" x2="390" y2="230" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="3 2" />

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <g 
                key={node.id} 
                onClick={() => handleNodeClick(node)} 
                style={{ cursor: 'pointer' }}
              >
                {/* Node Outer Glow Ring if selected */}
                {isSelected && (
                  <rect
                    x={node.x - 65}
                    y={node.y - 32}
                    width="130"
                    height="64"
                    rx="12"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                  />
                )}

                {/* Node Box */}
                <rect
                  x={node.x - 60}
                  y={node.y - 28}
                  width="120"
                  height="56"
                  rx="10"
                  fill="#161826"
                  stroke={isSelected ? '#06b6d4' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.3s' }}
                />

                {/* Node Content Texts */}
                <text
                  x={node.x}
                  y={node.y - 8}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {node.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Audit Panel */}
      {selectedNode ? (
        <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem 1.25rem', borderRadius: '16px', marginTop: '1.25rem' }}>
          <h4 style={{ color: '#a5b4fc', fontSize: '0.95rem', fontWeight: 'bold' }}>
            🔍 Audit Trail: {selectedNode.label} ({selectedNode.title})
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.4rem', lineHeight: '1.5' }}>
            {selectedNode.description}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: '1rem', border: '1px dashed rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
          👆 Click on any node above to verify complete lifecycle audits.
        </div>
      )}
    </div>
  );
}
