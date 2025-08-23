import React from "react";
import "../style/Tabs.css"

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="tabs-container">
      <button
        onClick={() => setActiveTab("details")}
        className={`tab-button ${activeTab === "details" ? "active" : ""}`}
      >
        Transformers
      </button>
      <button
        onClick={() => setActiveTab("inspection")}
        className={`tab-button inspection ${activeTab === "inspection" ? "active inspection" : ""}`}
      >
        Inspection
      </button>
    </div>
  );
}
