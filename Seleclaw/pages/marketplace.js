import { useState, useEffect } from 'react';
import { 
  getStoredDatasets, 
  getStoredPurchases, 
  purchaseStoredDataset, 
  purchaseDatasetOnCardano, 
  lovelaceToAda 
} from '../lib/cardano';
import DatasetCard from '../components/DatasetCard';
import FilterSidebar from '../components/FilterSidebar';
import ChatBot from '../components/ChatBot';
import TrainingSimulation from '../components/TrainingSimulation';
import DatasetPassportModal from '../components/DatasetPassportModal';
import CompareModal from '../components/CompareModal';

export default function Marketplace({ account, lucid }) {
  const [datasets, setDatasets] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dataType: 'all',
    priceRange: 'all',
    sortBy: 'newest',
    searchQuery: ''
  });
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [purchasedDatasets, setPurchasedDatasets] = useState([]);

  // Aegis AI v2 New State Modals
  const [selectedPassportDataset, setSelectedPassportDataset] = useState(null);
  const [comparedDatasets, setComparedDatasets] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    loadDatasets();
    loadUserPurchases();
  }, [account]);

  useEffect(() => {
    applyFilters();
  }, [datasets, filters]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const datasetsData = getStoredDatasets();
      setDatasets(datasetsData);
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPurchases = async () => {
    if (!account) return;
    try {
      const userPurchases = getStoredPurchases(account);
      setPurchasedDatasets(userPurchases.map(id => Number(id)));
    } catch (error) {
      console.error('Error loading user purchases:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...datasets];

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(dataset => 
        dataset.name.toLowerCase().includes(query) || 
        dataset.description.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filters.dataType !== 'all') {
      filtered = filtered.filter(dataset => dataset.dataType === filters.dataType);
    }

    // Filter by price range
    filtered = filtered.filter(dataset => {
      const priceInADA = parseFloat(lovelaceToAda(dataset.priceLovelace || '0'));
      let minPrice = 0;
      let maxPrice = Infinity;
      
      if (filters.priceRange && filters.priceRange !== 'all') {
        if (typeof filters.priceRange === 'string') {
          if (filters.priceRange.endsWith('+')) {
            minPrice = parseFloat(filters.priceRange.replace('+', ''));
          } else {
            const parts = filters.priceRange.split('-');
            minPrice = parseFloat(parts[0] || '0');
            maxPrice = parseFloat(parts[1] || 'Infinity');
          }
        } else if (Array.isArray(filters.priceRange)) {
          minPrice = filters.priceRange[0];
          maxPrice = filters.priceRange[1];
        }
      }
      return priceInADA >= minPrice && priceInADA <= maxPrice;
    });

    // Sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'price-low':
        filtered.sort((a, b) => Number(a.priceLovelace || 0) - Number(b.priceLovelace || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => Number(b.priceLovelace || 0) - Number(a.priceLovelace || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
        break;
      default:
        break;
    }

    setFilteredDatasets(filtered);
  };

  const handlePurchase = async (dataset) => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    if (dataset.owner.toLowerCase() === account.toLowerCase()) {
      alert('You cannot purchase your own dataset');
      return;
    }

    if (purchasedDatasets.includes(Number(dataset.id))) {
      alert('You already have access to this dataset');
      return;
    }

    try {
      setPurchasing(true);
      
      const platformOwnerAddress = process.env.NEXT_PUBLIC_SCRIPT_ADDRESS || 'addr_test1vzpwq5z3xyum8vqnddd9mdnmafh3djcxnc6jemlgdmswcve6tkw';
      
      console.log('Initiating transaction via Lucid...');
      const txResult = await purchaseDatasetOnCardano(
        lucid, 
        dataset.owner, 
        dataset.priceLovelace, 
        platformOwnerAddress
      );

      console.log('Purchase tx result:', txResult);

      // Perform local database purchase record update
      purchaseStoredDataset(dataset.id, account);

      alert(`Dataset purchased successfully! Mined License NFT: CIP25_LICENSE_AEGIS_${dataset.id}\nTx Hash: ${txResult.hash}`);
      loadUserPurchases();
      loadDatasets();
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase dataset: ' + (error.message || error));
    } finally {
      setPurchasing(false);
    }
  };

  const handleCompareToggle = (dataset) => {
    setComparedDatasets(prev => {
      const isAlreadyAdded = prev.some(d => d.id === dataset.id);
      if (isAlreadyAdded) {
        return prev.filter(d => d.id !== dataset.id);
      } else {
        if (prev.length >= 2) {
          alert("You can compare up to 2 datasets at a time. Please deselect one first.");
          return prev;
        }
        const updated = [...prev, dataset];
        if (updated.length === 2) {
          setShowCompareModal(true);
        }
        return updated;
      }
    });
  };

  const handleDatasetSelect = (dataset) => setSelectedDataset(dataset);
  const handleCloseDataset = () => setSelectedDataset(null);
  const handleShowTraining = () => setShowTraining(true);
  const handleCloseTraining = () => setShowTraining(false);

  const handleViewPassport = (dataset) => setSelectedPassportDataset(dataset);
  const handleClosePassport = () => setSelectedPassportDataset(null);

  if (loading) {
    return (
      <div className="marketplace-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading marketplace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page" style={{ padding: '2rem 0' }}>
      <div className="container">
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', fontWeight: '850', color: 'white' }}>🛒 AI Training Dataset Marketplace</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
            Verify provenance on-chain, check trust validation scores, and mount licensed datasets.
          </p>

          {comparedDatasets.length > 0 && (
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '0.8rem 1.2rem', borderRadius: '12px', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#e0f2fe' }}>
                Selected <strong>{comparedDatasets.length}</strong> dataset(s) for comparison. {comparedDatasets.length === 1 && "Select 1 more to compare."}
              </span>
              {comparedDatasets.length === 2 && (
                <button className="btn btn-primary btn-small" onClick={() => setShowCompareModal(true)} style={{ background: '#38bdf8', color: '#0f172a' }}>
                  ⚖️ Compare Side-by-Side
                </button>
              )}
            </div>
          )}
        </div>

        <div className="marketplace-content">
          <FilterSidebar 
            filters={filters} 
            onFilterChange={setFilters}
            datasets={datasets}
          />

          <div className="datasets-grid">
            {filteredDatasets.length === 0 ? (
              <div className="no-datasets" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem 0' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#94a3b8' }}>No datasets found</h3>
                <p style={{ color: '#64748b' }}>Try adjusting your filters or search query.</p>
              </div>
            ) : (
              filteredDatasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id.toString()}
                  dataset={dataset}
                  onSelect={handleDatasetSelect}
                  onPurchase={handlePurchase}
                  onViewPassport={handleViewPassport}
                  onCompareToggle={handleCompareToggle}
                  isCompared={comparedDatasets.some(d => d.id === dataset.id)}
                  isPurchased={purchasedDatasets.includes(Number(dataset.id))}
                  purchasing={purchasing}
                  account={account}
                />
              ))
            )}
          </div>
        </div>

        {selectedDataset && (
          <div className="dataset-modal">
            <div className="modal-content">
              <button className="close-btn" onClick={handleCloseDataset}>×</button>
              <h2>{selectedDataset.name}</h2>
              <p className="description">{selectedDataset.description}</p>

              <div className="dataset-details">
                <div className="detail">
                  <span className="label">Data Type:</span>
                  <span className="value" style={{textTransform: 'capitalize'}}>{selectedDataset.dataType}</span>
                </div>
                <div className="detail">
                  <span className="label">Price:</span>
                  <span className="value">{lovelaceToAda(selectedDataset.priceLovelace)} ADA</span>
                </div>
                <div className="detail">
                  <span className="label">File Size:</span>
                  <span className="value">{(selectedDataset.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="detail">
                  <span className="label">Purchase Count:</span>
                  <span className="value">{selectedDataset.purchaseCount?.toString() || '0'}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePurchase(selectedDataset)}
                  disabled={purchasing || selectedDataset.owner.toLowerCase() === account?.toLowerCase()}
                >
                  {purchasing ? 'Processing...' : `Purchase License NFT`}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleShowTraining}
                >
                  🚀 Try AI Training
                </button>
              </div>
            </div>
          </div>
        )}

        {showTraining && (
          <TrainingSimulation 
            dataset={selectedDataset}
            onClose={handleCloseTraining}
          />
        )}

        {/* Dataset Passport Modal */}
        {selectedPassportDataset && (
          <DatasetPassportModal
            dataset={selectedPassportDataset}
            onClose={handleClosePassport}
          />
        )}

        {/* Compare Modal */}
        {showCompareModal && (
          <CompareModal
            datasetA={comparedDatasets[0]}
            datasetB={comparedDatasets[1]}
            onClose={() => {
              setShowCompareModal(false);
              setComparedDatasets([]);
            }}
          />
        )}

        <ChatBot />
      </div>
    </div>
  );
}
