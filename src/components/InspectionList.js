import React from "react";
import axios from "axios";
import "../App.css";

export default function InspectionList({
  transformers = [],
  inspections = [],
  setInspections,
  filteredInspections,
  setFilteredInspections,
  searchFieldInspection,
  setSearchFieldInspection,
  searchQueryInspection,
  setSearchQueryInspection,
  openAddInspectionModal,
  onViewInspections,
}) {
  const handleDeleteInspection = (inspectionId) => {
    axios.delete(`http://localhost:8080/api/inspections/${inspectionId}`)
      .then(() => {
        setInspections(prev => prev.filter(i => i.id !== inspectionId));
        setFilteredInspections(prev => prev.filter(i => i.id !== inspectionId));
      })
      .catch(err => console.error("Error deleting inspection:", err));
  };

  const handleViewTransformerInspections = (transformer) => {
    if (typeof onViewInspections === "function") {
      onViewInspections(transformer);
    }
  };

  const transformerRows = transformers.map((t) => ({
    ...t,
    inspections: inspections.filter(i => i.transformer.id === t.id),
  }));

  return (
    <div style={{ flexGrow: 1, padding: "20px" }}>
      <h1>All Inspections</h1>

      <button className="schedule-btn" onClick={openAddInspectionModal}>
        + Schedule Inspection
      </button>

      <div style={{ marginBottom: "20px", marginTop: "10px" }}>
        <select
          value={searchFieldInspection}
          onChange={(e) => setSearchFieldInspection(e.target.value)}
          style={{ padding: "8px", marginRight: "10px" }}
        >
          <option value="">Select Field</option>
          <option value="transformer">Transformer Number</option>
          <option value="date">Inspection Date</option>
          <option value="inspector">Inspector Name</option>
          <option value="notes">Notes</option>
        </select>
        <input
          type="text"
          placeholder="Search"
          value={searchQueryInspection}
          onChange={(e) => setSearchQueryInspection(e.target.value)}
          style={{ padding: "8px", width: "200px" }}
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
        <thead>
          <tr style={{ backgroundColor: "#02090fff", color: "white" }}>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Transformer</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Region</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Pole</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Type</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Total Inspections</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transformerRows.map((t, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.number}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.region}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.pole}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.type}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.inspections.length}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                <button
                  className="inspection-btn view-btn"
                  onClick={() => handleViewTransformerInspections(t)}
                >
                  View
                </button>
                <button
                  className="inspection-btn delete-btn"
                  style={{ marginLeft: "5px" }}
                  onClick={() => t.inspections.forEach(i => handleDeleteInspection(i.id))}
                >
                  Delete All
                </button>
              </td>
            </tr>
          ))}
          {transformerRows.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "10px" }}>
                No transformers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}