import React from "react";
import "../style/ErrorRuleSet.css";

export default function ErrorRuleset({ threshold, setThreshold }) {
  const handleChange = (e) => {
    setThreshold(parseFloat(e.target.value));
  };

  return (
    <div className="ruleset-container">
      <h3>Error Ruleset Configuration</h3>

      <div className="ruleset-row">
        <label>Detection Threshold:</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={threshold}
          onChange={handleChange}
        />
      </div>

      <button className="save-button" onClick={() => alert("Ruleset saved!")}>
        Save Ruleset
      </button>
    </div>
  );
}
