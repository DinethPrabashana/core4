import { useState } from 'react';
import AddTransformerModal from './AddTransformerModal';
import TransformerDetails from './TransformerDetails';

function TransformerTab({ transformers, addTransformer, addInspection }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedType, setSelectedType] = useState('All Types');

  const filteredTransformers = transformers.filter((t) => {
    const matchesSearch = t.no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'All Regions' || t.region === selectedRegion;
    const matchesType = selectedType === 'All Types' || t.type === selectedType;
    return matchesSearch && matchesRegion && matchesType;
  });

  const regions = ['All Regions', ...new Set(transformers.map(t => t.region))];
  const types = ['All Types', ...new Set(transformers.map(t => t.type))];

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRegion('All Regions');
    setSelectedType('All Types');
  };

  if (selectedTransformer) {
    return (
      <TransformerDetails
        transformer={selectedTransformer}
        onBack={() => setSelectedTransformer(null)}
        onAddInspection={(newInspection) => addInspection(selectedTransformer.id, newInspection)}
      />
    );
  }

  return (
    <div className="transformer-tab">
      <div className="actions">
        <button className="add-button" onClick={() => setIsAddModalOpen(true)}>
          Add Transformer
        </button>
      </div>
      <div className="filters">
        <input
          type="text"
          placeholder="Search Transformer No"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
          {regions.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button onClick={resetFilters}>Reset Filters</button>
      </div>
      <table className="transformer-table">
        <thead>
          <tr>
            <th></th>
            <th>Transformer No.</th>
            <th>Pole No.</th>
            <th>Region</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredTransformers.map((t) => (
            <tr key={t.id}>
              <td>{t.favorite ? '⭐' : ''}</td>
              <td>{t.no}</td>
              <td>{t.poleNo}</td>
              <td>{t.region}</td>
              <td>{t.type}</td>
              <td><button onClick={() => setSelectedTransformer(t)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">1 2 3 4 5 ... Next</div>

      {isAddModalOpen && (
        <AddTransformerModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addTransformer}
        />
      )}
    </div>
  );
}

export default TransformerTab;