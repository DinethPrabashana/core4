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
  setShowModal, // this should be the function to open modal
  transformers,
  setTransformers,
}) {
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    if (selectedTransformer?.owner?.photo) {
      // Use URL if File object, else keep as string
      const file = selectedTransformer.owner.photo;
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
    setShowModal(t); // pass the transformer to open modal with pre-filled data
  };

  const handleDelete = (t) => {
    if (window.confirm("Are you sure you want to delete this transformer?")) {
      setTransformers(transformers.filter((item) => item.id !== t.id));
      if (selectedTransformer?.id === t.id) setSelectedTransformer(null);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowModal()} // open modal for adding new
        style={{
          padding: "10px 20px",
          marginBottom: "20px",
          backgroundColor: "#2b95dbff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        + Add Transformer
      </button>

      {/* Search */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <select
          value={searchFieldDetails}
          onChange={(e) => setSearchFieldDetails(e.target.value)}
          style={{ padding: "8px" }}
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
          style={{ padding: "8px", flex: "1" }}
        />
      </div>

      {/* Selected Transformer */}
      {selectedTransformer && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            background: "#e8f4fc",
            border: "1px solid #2b95dbff",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "15px" }}>
            {["number", "pole", "region", "type"].map((field) => (
              <div
                key={field}
                style={{
                  padding: "10px",
                  border: "1px solid #2b95dbff",
                  borderRadius: "6px",
                  background: "#fff",
                }}
              >
                <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>
                <div>{selectedTransformer[field]}</div>
              </div>
            ))}
          </div>

          <img
            src={
              imageURL || placeholderImage
            }
            alt="Owner"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "8px",
              objectFit: "cover",
              marginLeft: "20px",
            }}
          />

          <button
            onClick={() => setSelectedTransformer(null)}
            style={{
              alignSelf: "flex-start",
              padding: "5px 12px",
              background: "#ff4d4d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginLeft: "15px",
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Transformer Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Transformer #</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Pole #</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Region</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Type</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransformers.map((t) => (
            <tr key={t.id}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.number}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.pole}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.region}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.type}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                <button
                  onClick={() => setSelectedTransformer(t)}
                  style={{ marginRight: "5px", padding: "5px 10px" }}
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(t)}
                  style={{ marginRight: "5px", padding: "5px 10px" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  style={{
                    padding: "5px 10px",
                    background: "#ff4d4d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
