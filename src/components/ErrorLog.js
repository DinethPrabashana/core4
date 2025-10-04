import React, { useState } from "react";
import '../style/ErrorLog.css';

export default function ErrorLog({ anomalies = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [notes, setNotes] = useState(anomalies.map(() => ""));

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleNoteChange = (idx, value) => {
    const newNotes = [...notes];
    newNotes[idx] = value;
    setNotes(newNotes);
  };

  const handleConfirm = (idx) => {
    console.log(`Note for Error ${idx + 1}:`, notes[idx]);
  };

  const handleCancel = (idx) => {
    const newNotes = [...notes];
    newNotes[idx] = ""; // clear input on cancel
    setNotes(newNotes);
  };

  return (
    <div className="error-log">
      <h3>Error Log</h3>
      {anomalies.length === 0 && <p>No errors detected.</p>}
      {anomalies.map((box, idx) => (
        <div 
          key={idx} 
          className={`error-row ${expandedIndex === idx ? "expanded" : ""}`}
        >
          <div className="error-summary" onClick={() => toggleExpand(idx)}>
            <span className="error-title">{`Error ${idx + 1}`}</span>
            <span className="error-date"><strong>Date:</strong> {box.date || "N/A"}</span>
            <span className="error-name"><strong>Name/AI:</strong> {box.name || "AI"}</span>
            <span className="dropdown-arrow">{expandedIndex === idx ? "🔽" : "▶️"}</span>
          </div>

          {expandedIndex === idx && (
            <div className="error-details">
              <p><strong>Bounding Box:</strong> x: {box.x}, y: {box.y}, w: {box.width}, h: {box.height}</p>
              {box.additionalInfo && <p>{box.additionalInfo}</p>}

              {/* Note Section */}
              <div className="note-section">
                <textarea
                  placeholder="Type here to add notes..."
                  value={notes[idx]}
                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                />
                <div className="note-buttons">
                  <button onClick={() => handleConfirm(idx)}>Confirm</button>
                  <button onClick={() => handleCancel(idx)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
