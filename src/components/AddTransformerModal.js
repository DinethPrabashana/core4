import React, { useState } from 'react';

const AddTransformerModal = ({ isOpen, onClose, onAddTransformer }) => {
  const [formData, setFormData] = useState({
    transformerNo: '',
    poleNo: '',
    region: '',
    type: '',
    locationDetails: ''
  });

  const regions = ['Nugegoda', 'Moharogamo', 'Colombo', 'Kandy', 'Galle'];
  const types = ['Bulk', 'Distribution', 'Substation', 'Portable'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.transformerNo || !formData.poleNo || !formData.region || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }
    
    onAddTransformer(formData);
    
    // Reset form
    setFormData({
      transformerNo: '',
      poleNo: '',
      region: '',
      type: '',
      locationDetails: ''
    });
    
    onClose();
  };

  const handleCancel = () => {
    // Reset form on cancel
    setFormData({
      transformerNo: '',
      poleNo: '',
      region: '',
      type: '',
      locationDetails: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Transformer</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="transformer-form">
          <div className="form-group">
            <label htmlFor="transformerNo">Transformer Number *</label>
            <input
              type="text"
              id="transformerNo"
              name="transformerNo"
              value={formData.transformerNo}
              onChange={handleChange}
              required
              placeholder="e.g., AZ-9890"
            />
          </div>

          <div className="form-group">
            <label htmlFor="poleNo">Pole Number *</label>
            <input
              type="text"
              id="poleNo"
              name="poleNo"
              value={formData.poleNo}
              onChange={handleChange}
              required
              placeholder="e.g., EN-122-A"
            />
          </div>

          <div className="form-group">
            <label htmlFor="region">Region *</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            >
              <option value="">Select Region</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="locationDetails">Location Details</label>
            <textarea
              id="locationDetails"
              name="locationDetails"
              value={formData.locationDetails}
              onChange={handleChange}
              rows="3"
              placeholder="Additional location information..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="confirm-btn">
              Add Transformer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransformerModal;