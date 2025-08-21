import { useState } from 'react';
import AddInspectionModal from './AddInspectionModal';

function TransformerDetails({ transformer, onBack, onAddInspection }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = (newInspection) => {
    onAddInspection(newInspection);
    setIsModalOpen(false);
  };

  return (
    <div className="transformer-details-view">
      <button className="back-button" onClick={onBack}>Back to List</button>
      <div className="transformer-info">
        <div className="top-row">
          <h2>{transformer.no}</h2>
          <span className="last-inspected">Last Inspected Date: Mon(21), May, 2023 12:55pm</span>
        </div>
        <div className="details-row">
          <span>{transformer.region} <span className="red-dot">•</span> Levels: Embuldeniya</span>
        </div>
        <div className="stats">
          <span>Pole No {transformer.poleNo}</span>
          <span>Capacity {transformer.capacity}</span>
          <span>Type {transformer.type}</span>
          <span>No. of Feeders {transformer.feeders}</span>
        </div>
        <div className="baseline-image">
          <img src="placeholder-icon.png" alt="Baseline" /> Baseline Image
          <span>👁️</span>
          <span>🗑️</span>
        </div>
      </div>
      <div className="inspections-section">
        <div className="inspections-header">
          <h3>Transformer Inspections</h3>
          <button className="add-inspection" onClick={() => setIsModalOpen(true)}>Add Inspection</button>
        </div>
        <table className="inspection-table">
          <thead>
            <tr>
              <th></th> {/* Favorite */}
              <th>Inspection No.</th>
              <th>Inspected Date</th>
              <th>Maintenance Date</th>
              <th>Status</th>
              <th></th> {/* View */}
              <th></th> {/* Ellipsis */}
            </tr>
          </thead>
          <tbody>
            {transformer.inspections.map((i) => (
              <tr key={i.id}>
                <td>{i.favorite ? '⭐' : ''}</td>
                <td>{i.no}</td>
                <td>{i.inspectedDate}</td>
                <td>{i.maintenanceDate}</td>
                <td>
                  <span className={`status ${i.status.toLowerCase().replace(' ', '-')}`}>
                    {i.status}
                  </span>
                </td>
                <td><button>View</button></td>
                <td>...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddInspectionModal
          transformer={transformer}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

export default TransformerDetails;