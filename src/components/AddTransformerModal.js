import { useState } from 'react';

function AddTransformerModal({ onClose, onAdd }) {
  const [no, setNo] = useState('');
  const [poleNo, setPoleNo] = useState('');
  const [type, setType] = useState('Bulk'); // Default
  const [locationDetails, setLocationDetails] = useState('');

  const handleAdd = () => {
    if (no && poleNo && type) {
      onAdd({ no, poleNo, type, region: 'Nugegoda' }); // Region hardcoded for simplicity; adjust as needed
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Transformer</h2>
        <label>Transformer No</label>
        <input value={no} onChange={(e) => setNo(e.target.value)} />
        <label>Pole No</label>
        <input value={poleNo} onChange={(e) => setPoleNo(e.target.value)} />
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Bulk</option>
          <option>Distribution</option>
        </select>
        <label>Location Details</label>
        <textarea value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} />
        <div className="modal-buttons">
          <button className="confirm" onClick={handleAdd}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddTransformerModal;