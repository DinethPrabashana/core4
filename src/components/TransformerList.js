import React, { useEffect, useState } from "react";
import placeholderImage from "../assets/transformer.jpg";

export default function TransformerList({
  filteredTransformers = [],
  selectedTransformer,
  setSelectedTransformer,
  searchFieldDetails,
  setSearchFieldDetails,
  searchQueryDetails,
  setSearchQueryDetails,
  setShowModal,
  transformers,
  setTransformers,
}) {
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    if (selectedTransformer?.baselineImage) {
      const file = selectedTransformer.baselineImage;
      if (typeof file === "string") {
        setImageURL(file);
      } else {
        const url = URL.createObjectURL(file);
        setImageURL(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setImageURL(null);
    }
  }, [selectedTransformer]);

  const handleEdit = (t) => {
    setSelectedTransformer(t);
    setShowModal(t);
  };

  const handleDelete = (t) => {
    if (window.confirm("Are you sure you want to delete this transformer?")) {
      setTransformers(transformers.filter((item) => item.id !== t.id));
      if (selectedTransformer?.id === t.id) setSelectedTransformer(null);
    }
  };

  return (
    <div className="transformer-container">
      <button className="add-transformer-btn" onClick={() => setShowModal()}>
        + Add Transformer
      </button>

      {/* Search */}
      <div className="search-bar">
        <select
          value={searchFieldDetails}
          onChange={(e) => setSearchFieldDetails(e.target.value)}
          className="search-select"
        >
          <option value="number">Transformer #</option>
          <option value="pole">Pole #</option>
          <option value="region">Region</option>
          <option value="type">Type</option>
        </select>
        <input
          type="text"
          placeholder="Enter search value..."
          value={searchQueryDetails}
          onChange={(e) => setSearchQueryDetails(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Selected Transformer */}
      {selectedTransformer && (
        <div className="selected-transformer">
          <div className="selected-info">
            {["number", "pole", "region", "type"].map((field) => (
              <div key={field} className="info-card">
                <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>
                <div>{selectedTransformer[field]}</div>
              </div>
            ))}
          </div>
          <img
            src={imageURL || placeholderImage} // ✅ show baselineImage if uploaded
            alt="Transformer"
            className="image-preview"
          />
          <button className="danger-btn" onClick={() => setSelectedTransformer(null)}>
            Close
          </button>
        </div>
      )}

      {/* Transformer Table */}
      <table className="transformer-table">
        <thead>
          <tr>
            <th>Transformer #</th>
            <th>Pole #</th>
            <th>Region</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransformers.map((t) => (
            <tr key={t.id}>
              <td>{t.number}</td>
              <td>{t.pole}</td>
              <td>{t.region}</td>
              <td>{t.type}</td>
              <td className="transformer-actions">
                <button onClick={() => setSelectedTransformer(t)}>View</button>
                <button onClick={() => handleEdit(t)}>Edit</button>
                <button className="danger-btn" onClick={() => handleDelete(t)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
