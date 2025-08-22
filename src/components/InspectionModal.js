import React from "react";

export default function InspectionModal({
  transformers,
  inspectionForm,
  handleInspectionChange,
  handleScheduleInspection,
  onClose
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
        }}
      >
        <h2>Schedule Inspection</h2>

        <select
          name="transformer"
          value={inspectionForm.transformer}
          onChange={handleInspectionChange}
          style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
        >
          <option value="">Select Transformer</option>
          {transformers.map((transformer) => (
            <option key={transformer.id} value={transformer.id}>
              {transformer.number}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={inspectionForm.date}
          onChange={handleInspectionChange}
          placeholder="Date"
          style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
        />
        <input
          name="inspector"
          value={inspectionForm.inspector}
          onChange={handleInspectionChange}
          placeholder="Inspector Name"
          style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
        />
        <textarea
          name="notes"
          value={inspectionForm.notes}
          onChange={handleInspectionChange}
          placeholder="Notes"
          style={{ padding: "8px", marginBottom: "10px", width: "100%", height: "60px" }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleScheduleInspection}
            style={{
              padding: "8px 12px",
              backgroundColor: "#02090fff",
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
