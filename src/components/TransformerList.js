import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TransformerList = ({ transformers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const filteredTransformers = transformers.filter(transformer => {
    const matchesSearch = transformer.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'All Regions' || transformer.region === regionFilter;
    const matchesType = typeFilter === 'All Types' || transformer.type === typeFilter;
    
    return matchesSearch && matchesRegion && matchesType;
  });

  const regions = ['All Regions', ...new Set(transformers.map(t => t.region))];
  const types = ['All Types', ...new Set(transformers.map(t => t.type))];

  return (
    <div className="transformer-list">
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search Transformer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <button 
            className="reset-btn"
            onClick={() => {
              setRegionFilter('All Regions');
              setTypeFilter('All Types');
            }}
          >
            Reset filters
          </button>
        </div>
      </div>
      
      <table className="transformers-table">
        <thead>
          <tr>
            <th>Transformer No.</th>
            <th>Region</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransformers.map(transformer => (
            <tr key={transformer.id}>
              <td>{transformer.id}</td>
              <td>{transformer.region}</td>
              <td>{transformer.type}</td>
              <td>
                <Link to={`/transformer/${transformer.id}`} className="view-btn">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransformerList;