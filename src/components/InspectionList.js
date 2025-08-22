import React from "react";
import "../App.css";

export default function InspectionList({
  filteredInspections = [],
  setFilteredInspections,
  setInspections,
  transformers = [],
  searchFieldInspection,
  setSearchFieldInspection,
  searchQueryInspection,
  setSearchQueryInspection,
  openAddInspectionModal,
  openViewInspectionModal,
}) {

    const handleDeleteInspection = (inspectionId) => {
      // Remove from main inspections state
      setInspections(prev => prev.filter(i => i.id !== inspectionId));

      // Also update filteredInspections to keep table in sync
      setFilteredInspections(prev => prev.filter(i => i.id !== inspectionId));
    };

  return (
    <div style={{ flexGrow: 1, padding: "20px" }}>
      <h1>Inspection Page</h1>

      <button className="schedule-btn" onClick={openAddInspectionModal}>
        + Schedule Inspection
      </button>

      <div style={{ marginBottom: "20px" }}>
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
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Date</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Inspector</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Notes</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Status</th> {/* New Column */}
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Actions</th>
            
          </tr>
        </thead>
        <tbody>
          {filteredInspections.map((inspection, index) => {
            const transformer = transformers.find(t => t.id === inspection.transformer);
            return (
              <tr key={index}>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  {transformer ? transformer.number : "N/A"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{inspection.date}</td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{inspection.inspector}</td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{inspection.notes}</td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  <span className={"status-pending"}>
                    {inspection.status || "Pending"}
                  </span>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  <button
                    className="inspection-btn view-btn"
                    onClick={() => openViewInspectionModal(inspection)}
                  >
                    View
                  </button>
                  <button
                    className="inspection-btn delete-btn"
                    onClick={() => handleDeleteInspection(inspection.id)}
                  >
                  Delete
                  </button>
                </td>
              </tr>
            );
          })}
      </tbody>
      </table>
    </div>
  );
}
