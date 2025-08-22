import React from "react";

export default function TransformerModal({
  formData,
  handleInputChange,
  handleAddTransformer,
  onClose,
}) {
  if (!formData) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add / Edit Transformer</h2>

        <label>Transformer Number</label>
        <input
          name="number"
          placeholder="Transformer Number"
          value={formData.number}
          onChange={handleInputChange}
        />

        <label>Pole Number</label>
        <input
          name="pole"
          placeholder="Pole Number"
          value={formData.pole}
          onChange={handleInputChange}
        />

        <label>Region</label>
        <input
          name="region"
          placeholder="Region"
          value={formData.region}
          onChange={handleInputChange}
        />

        <label>Type</label>
        <select name="type" value={formData.type} onChange={handleInputChange}>
          <option value="Bulk">Bulk</option>
          <option value="Distribution">Distribution</option>
        </select>

        <label>Baseline Image</label>
        <input type="file" name="baselineImage" onChange={handleInputChange} />

        {/* Weather Dropdown */}
        <label>Weather</label>
        <select
          name="weather"
          value={formData.weather || ""}
          onChange={handleInputChange}
        >
          <option value="">Select Weather</option>
          <option value="Sunny">Sunny</option>
          <option value="Rainy">Rainy</option>
          <option value="Cloudy">Cloudy</option>
        </select>

        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleAddTransformer}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
