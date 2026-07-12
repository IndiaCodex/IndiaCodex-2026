import { useState, useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { getAvailableWallets, connectCardanoWallet, getProviderReputation } from '../lib/cardano';

function MyApp({ Component, pageProps }) {
  const [account, setAccount] = useState('');
  const [walletName, setWalletName] = useState('');
  const [balanceADA, setBalanceADA] = useState(0);
  const [lucid, setLucid] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [network, setNetwork] = useState('Preprod');
  const [reputation, setReputation] = useState(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const wallets = getAvailableWallets();
      setAvailableWallets(wallets);

      const savedWallet = localStorage.getItem('connected_cardano_wallet');
      if (savedWallet) {
        if (savedWallet === 'mock') {
          connectMockWallet();
        } else if (window.cardano && window.cardano[savedWallet]) {
          handleWalletConnect(savedWallet);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (account) {
      const repData = getProviderReputation(account);
      setReputation(repData);
    } else {
      setReputation(null);
    }
  }, [account]);

  const handleWalletConnect = async (walletId) => {
    try {
      console.log(`🔌 Connecting to Cardano wallet: ${walletId}...`);
      const blockfrostProjectId = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || '';
      const net = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'Preprod';
      
      setNetwork(net);

      const walletInfo = await connectCardanoWallet(walletId, blockfrostProjectId, net);
      
      setAccount(walletInfo.address);
      setWalletName(walletInfo.walletName);
      setBalanceADA(walletInfo.balanceADA);
      setLucid(walletInfo.lucid);
      
      localStorage.setItem('connected_cardano_wallet', walletId);
      setShowSelector(false);
    } catch (error) {
      console.error('❌ Failed to connect Cardano wallet:', error);
      alert(`Connection failed: ${error.message || error}`);
    }
  };

  const connectMockWallet = () => {
    console.log('🔌 Connecting to Mock Cardano wallet...');
    const mockAddress = 'addr_test1qph8ulm66hnfre35wqvy6p0tun40zuu57qxfzklhf6r5srv';
    setAccount(mockAddress);
    setWalletName('simulation');
    setBalanceADA(750.50);
    setLucid(null);
    localStorage.setItem('connected_cardano_wallet', 'mock');
    setShowSelector(false);
  };

  const disconnectWallet = () => {
    setAccount('');
    setWalletName('');
    setBalanceADA(0);
    setLucid(null);
    localStorage.removeItem('connected_cardano_wallet');
  };

  return (
    <>
      <Head>
        <title>Aegis AI v2 - Decentralized AI Trust Platform on Cardano</title>
        <meta
          name="description"
          content="Decentralized marketplace & training workspace for AI training data powered by Cardano"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app">
        {/* -------------------- HEADER -------------------- */}
        <header className="app-header">
          <div className="container">
            <div className="header-left">
              <h1>🛡️ Aegis AI <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '6px' }}>v2.0</span></h1>
              {account && (
                <nav className="main-nav">
                  <a href="/">Home</a>
                  <a href="/marketplace">Marketplace</a>
                  <a href="/models">Models</a>
                  <a href="/governance">Governance</a>
                  <a href="/upload">Upload</a>
                  <a href="/dashboard">Dashboard</a>
                </nav>
              )}
            </div>

            {/* Wallet Info */}
            <div className="wallet-info">
              {account ? (
                <div className="connected">
                  <span className="balance">{balanceADA.toFixed(2)} ADA</span>
                  <span className="account">
                    {account.slice(0, 8)}...{account.slice(-6)}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {walletName}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px' }}>
                    {network}
                  </span>
                  {reputation && (
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }} title={`Trust Score: ${reputation.trustScore}/100`}>
                      ⭐ {reputation.stars}
                    </span>
                  )}
                  <button onClick={disconnectWallet} className="disconnect-btn" style={{ marginLeft: '12px' }}>
                    🔌 Disconnect
                  </button>
                </div>
              ) : (
                <div className="wallet-actions">
                  {!isClient ? (
                    <div className="loading">
                      <p>Loading...</p>
                    </div>
                  ) : (
                    <div className="wallet-connector-container">
                      <button
                        onClick={() => setShowSelector(!showSelector)}
                        className="connect-btn"
                      >
                        Connect Cardano Wallet
                      </button>

                      {showSelector && (
                        <div className="wallet-selector-dropdown">
                          {availableWallets.length > 0 ? (
                            availableWallets.map(wallet => (
                              <button
                                key={wallet.id}
                                onClick={() => handleWalletConnect(wallet.id)}
                                className="wallet-option"
                              >
                                {wallet.icon && <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />}
                                <span>{wallet.name}</span>
                              </button>
                            ))
                          ) : (
                            <div className="no-wallets">
                              <p>No Cardano wallets detected.</p>
                              <small>Install Nami, Eternl, or Lace extension.</small>
                            </div>
                          )}
                          <div className="dropdown-divider"></div>
                          <button
                            onClick={connectMockWallet}
                            className="wallet-option simulation-option"
                          >
                            <span>🛠️ Simulation Mode (Mock Wallet)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* -------------------- MAIN CONTENT -------------------- */}
        <main className="main-content">
          <Component
            {...pageProps}
            account={account}
            walletName={walletName}
            balanceADA={balanceADA}
            lucid={lucid}
            connectMockWallet={connectMockWallet}
            network={network}
            reputation={reputation}
          />
        </main>

        {/* -------------------- FOOTER -------------------- */}
        <footer className="app-footer">
          <div className="container">
            <p>
              &copy; {new Date().getFullYear()} Aegis AI - Trust & Governance Infrastructure for AI Datasets on Cardano
            </p>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .wallet-connector-container {
          position: relative;
        }
        .wallet-selector-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: #111322;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px;
          z-index: 100;
          min-width: 240px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }
        .wallet-option {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #161826;
          border: none;
          color: white;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          text-align: left;
          transition: all 0.2s;
        }
        .wallet-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .wallet-icon {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        .simulation-option {
          background: #0f1c14;
          border: 1px dashed #10b981;
        }
        .simulation-option:hover {
          background: #142e20;
        }
        .no-wallets {
          padding: 10px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }
        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 4px 0;
        }
        .disconnect-btn {
          background: transparent;
          border: 1px solid #ef4444;
          color: #ef4444;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
        }
        .disconnect-btn:hover {
          background: #ef4444;
          color: white;
        }
        .balance {
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
        }
      `}</style>
    </>
  );
}

export default MyApp;
