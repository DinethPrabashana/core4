import React, { useState } from "react";
import axios from "axios";
import InspectionModal from "./InspectionModal";
import "../style/TransformerInspectionsPage.css";

export default function TransformerInspectionsPage({
  transformer,
  inspections = [],
  transformers = [],
  setInspections,
  setFilteredInspections,
  onBack,
  onViewInspection,
}) {
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [newInspectionForm, setNewInspectionForm] = useState({
    transformer: transformer.id,
    date: "",
    inspector: "",
    notes: "",
  });

  const getInspectionStatus = (inspection) => {
    const progress = inspection.progressStatus;
    if (typeof progress === "object" && progress) {
      const { thermalUpload, aiAnalysis, review } = progress;
      if (aiAnalysis === "Completed" && review === "Completed") return "Completed";
      if (thermalUpload === "Completed") return "In Progress";
    } else if (typeof progress === "string") {
      return progress;
    }
    return "Pending";
  };

  const handleDeleteInspection = (id) => {
    axios.delete(`http://localhost:8080/api/inspections/${id}`)
      .then(() => {
        setInspections(prev => prev.filter(i => i.id !== id));
        setFilteredInspections(prev => prev.filter(i => i.id !== id));
      })
      .catch(err => console.error("Error deleting inspection:", err));
  };

  const handleAddInspection = () => {
    const transformerId = parseInt(newInspectionForm.transformer, 10);
    const newInspection = {
      transformer: { id: transformerId },
      date: newInspectionForm.date,
      inspector: newInspectionForm.inspector,
      notes: newInspectionForm.notes,
      progressStatus: "Pending",
    };
    axios.post("http://localhost:8080/api/inspections", newInspection)
      .then(() => {
        axios.get(`http://localhost:8080/api/inspections/transformer/${transformerId}`)
          .then(res => {
            setInspections(prev => [...prev.filter(i => i.transformer.id !== transformerId), ...res.data]);
            setFilteredInspections(prev => [...prev.filter(i => i.transformer.id !== transformerId), ...res.data]);
          });
      })
      .catch(err => console.error("Error creating inspection:", err));
    setShowAddInspectionModal(false);
    setNewInspectionForm({
      transformer: transformer.id,
      date: "",
      inspector: "",
      notes: "",
    });
  };

  const generateInspectionNumber = (transformerNumber, index) => {
    return `${transformerNumber}-INSP${index + 1}`;
  };

  const handleUpdateInspection = (updatedInspection) => {
    axios.put(`http://localhost:8080/api/inspections/${updatedInspection.id}`, updatedInspection)
      .then(() => {
        axios.get(`http://localhost:8080/api/inspections/transformer/${transformer.id}`)
          .then(res => {
            setInspections(prev => [...prev.filter(i => i.transformer.id !== transformer.id), ...res.data]);
            setFilteredInspections(prev => [...prev.filter(i => i.transformer.id !== transformer.id), ...res.data]);
          });
      })
      .catch(err => console.error("Error updating inspection:", err));
  };

  return (
    <div style={{ padding: "20px" }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Inspections for {transformer.number}</h2>

      <button
        className="add-inspection-btn"
        onClick={() => setShowAddInspectionModal(true)}
      >
        + Add Inspection
      </button>

      <table className="inspection-table">
        <thead>
          <tr>
            <th>Inspection No</th>
            <th>Inspection Date</th>
            <th>Maintenance Data</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inspections.length > 0 ? (
            inspections.map((i, index) => (
              <tr key={i.id}>
                <td>{generateInspectionNumber(transformer.number, index)}</td>
                <td>{i.date}</td>
                <td>{i.notes}</td>
                <td>
                  <span className={`status-label ${getInspectionStatus(i).toLowerCase().replace(" ", "-")}`}>
                    {getInspectionStatus(i)}
                  </span>
                </td>
                <td>
                  <button
                    className="inspection-btn view-btn"
                    onClick={() => onViewInspection && onViewInspection(i, handleUpdateInspection)}
                  >
                    View
                  </button>
                  <button
                    className="inspection-btn delete-btn"
                    onClick={() => handleDeleteInspection(i.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center" }}>
                No inspections found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showAddInspectionModal && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={newInspectionForm}
          handleInspectionChange={(e) =>
            setNewInspectionForm({ ...newInspectionForm, [e.target.name]: e.target.value })
          }
          handleScheduleInspection={handleAddInspection}
          onClose={() => setShowAddInspectionModal(false)}
          disableTransformerSelect={true}
        />
      )}
    </div>
  );
}