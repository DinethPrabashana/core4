import React from "react";

export default function InspectionViewModal({ inspection, transformers, onClose }) {
  const transformer = transformers.find((t) => t.id === inspection.transformer);

  const baselineImageURL = inspection.baselineImage
    ? typeof inspection.baselineImage === "string"
      ? inspection.baselineImage
      : URL.createObjectURL(inspection.baselineImage)
    : null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "10px",
        width: "80%",
        maxHeight: "90%",
        overflowY: "auto"
      }}>
        <h2>Inspection Details</h2>
        <p><strong>Transformer:</strong> {transformer?.number || "N/A"}</p>
        <p><strong>Date:</strong> {inspection.date}</p>
        <p><strong>Inspector:</strong> {inspection.inspector}</p>
        <p><strong>Notes:</strong> {inspection.notes}</p>

        {baselineImageURL && (
          <div>
            <p><strong>Baseline Image:</strong></p>
            <img src={baselineImageURL} alt="Baseline" style={{ maxWidth: "100%" }} />
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: "20px" }}>Close</button>
      </div>
    </div>
  );
}
