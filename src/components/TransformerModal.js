import React from "react";
import placeholderImage from "../assets/transformer.jpg";

export default function TransformerModal({
  formData,
  ownerData,
  handleInputChange,
  handleOwnerChange,
  handleAddTransformer,
  onClose,
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflowY: "auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <h2>Add / Edit Transformer</h2>

        {/* Transformer Info */}
        <input
          name="number"
          placeholder="Transformer Number"
          value={formData.number}
          onChange={handleInputChange}
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />
        <input
          name="pole"
          placeholder="Pole Number"
          value={formData.pole}
          onChange={handleInputChange}
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />
        <input
          name="region"
          placeholder="Region"
          value={formData.region}
          onChange={handleInputChange}
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        >
          <option value="Bulk">Bulk</option>
          <option value="Distribution">Distribution</option>
        </select>

        <hr style={{ margin: "20px 0" }} />

        {/* Owner Details */}
        <h3>Owner Details</h3>
        <input
          name="name"
          placeholder="Owner Name"
          value={ownerData.name}
          onChange={handleOwnerChange}
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />
        <input
          name="phone"
          placeholder="Owner Phone Number"
          value={ownerData.phone}
          onChange={handleOwnerChange}
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />
        <input
          name="address"
          placeholder="Owner Address"
          value={ownerData.address}
          onChange={handleOwnerChange}
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />
        <input
          type="file"
          name="photo"
          onChange={handleOwnerChange}
          style={{ margin: "8px 0" }}
        />

        {/* Buttons */}
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              marginRight: "10px",
              background: "#ccc",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAddTransformer}
            style={{
              padding: "8px 16px",
              background: "#2b95dbff",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
