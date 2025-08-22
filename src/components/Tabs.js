import React from "react";

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
      <button
        onClick={() => setActiveTab("details")}
        style={{
          padding: "10px 20px",
          background: activeTab === "details" ? "#010007ff" : "#ddd",
          color: activeTab === "details" ? "white" : "black",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Transformers
      </button>
      <button
        onClick={() => setActiveTab("inspection")}
        style={{
          padding: "10px 20px",
          background: activeTab === "inspection" ? "#010c01ff" : "#ddd",
          color: activeTab === "inspection" ? "white" : "black",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Inspection
      </button>
    </div>
  );
}
