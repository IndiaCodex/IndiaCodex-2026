import { useState } from 'react';

export default function FilterSidebar({ filters, onFilterChange, datasets }) {
  const [isOpen, setIsOpen] = useState(true);

  const dataTypes = [
    { value: 'all', label: 'All Types', icon: '📊' },
    { value: 'medical', label: 'Medical / Healthcare', icon: '🏥' },
    { value: 'financial', label: 'Financial', icon: '🏦' },
    { value: 'behavioral', label: 'Behavioral / Customer', icon: '🛍️' },
    { value: 'iot', label: 'IoT / Sensor Data', icon: '📡' },
    { value: 'research', label: 'Research / Academic', icon: '🔬' },
    { value: 'other', label: 'Other', icon: '📈' }
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-10', label: 'Under 10 ADA' },
    { value: '10-50', label: '10 - 50 ADA' },
    { value: '50-100', label: '50 - 100 ADA' },
    { value: '100-500', label: '100 - 500 ADA' },
    { value: '500+', label: '500+ ADA' }
  ];

  const handleFilterChange = (filterType, value) => {
    onFilterChange({
      ...filters,
      [filterType]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      dataType: 'all',
      priceRange: 'all',
      sortBy: 'newest',
      searchQuery: ''
    });
  };

  // Calculate live stats based on actual datasets
  const activeSellers = datasets ? new Set(datasets.map(d => d.owner?.toLowerCase())).size : 0;
  const avgPrice = datasets && datasets.length > 0
    ? (datasets.reduce((acc, d) => acc + parseFloat(d.priceLovelace || 0), 0) / datasets.length / 1000000).toFixed(1)
    : 0;

  return (
    <div className="filters-sidebar" style={{ minWidth: '260px' }}>
      <div className="filter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '0.6rem' }}>
        <h3 className="filter-title" style={{ margin: 0, fontSize: '1.15rem', color: '#2c3e50', fontWeight: 'bold' }}>Filters</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#7f8c8d', padding: '0 4px' }}
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {isOpen && (
        <div className="filter-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Search */}
          <div className="filter-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: '#34495e', fontSize: '0.9rem' }}>Search Datasets</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                border: '1px solid #bdc3c7',
                borderRadius: '8px',
                background: '#f8f9fa',
                fontSize: '0.85rem',
                color: '#2c3e50',
                outline: 'none'
              }}
            />
          </div>

          {/* Data Type Filter */}
          <div className="filter-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: '#34495e', fontSize: '0.9rem' }}>Data Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {dataTypes.map((type) => (
                <label key={type.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#555', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dataType"
                    value={type.value}
                    checked={filters.dataType === type.value}
                    onChange={(e) => handleFilterChange('dataType', e.target.value)}
                    style={{ cursor: 'pointer', accentColor: '#3498db' }}
                  />
                  <span>
                    {type.icon} {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: '#34495e', fontSize: '0.9rem' }}>Price Range</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {priceRanges.map((range) => (
                <label key={range.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#555', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="priceRange"
                    value={range.value}
                    checked={filters.priceRange === range.value}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    style={{ cursor: 'pointer', accentColor: '#3498db' }}
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="filter-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: '#34495e', fontSize: '0.9rem' }}>Sort By</label>
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                border: '1px solid #bdc3c7',
                borderRadius: '8px',
                background: '#f8f9fa',
                fontSize: '0.85rem',
                color: '#2c3e50',
                outline: 'none'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div style={{ marginTop: '0.2rem' }}>
            <button
              onClick={clearFilters}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Quick Stats */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '0.4rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#34495e' }}>Market Stats</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#7f8c8d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Datasets:</span>
                <span style={{ fontWeight: '600', color: '#2c3e50' }}>{datasets ? datasets.length : 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Sellers:</span>
                <span style={{ fontWeight: '600', color: '#2c3e50' }}>{activeSellers}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Avg. Price:</span>
                <span style={{ fontWeight: '600', color: '#2c3e50' }}>{avgPrice} ADA</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
