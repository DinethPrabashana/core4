import { useState } from 'react';

function TransformerDetailsModal({ transformer, onClose }) {
  const [inspections] = useState([
    { id: 1, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: '-', status: 'In Progress' },
    { id: 2, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: '-', status: 'In Progress' },
    { id: 3, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: '-', status: 'Pending' },
    { id: 4, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: 'Mon(21), May, 2023 12:55pm', status: 'Completed' },
    { id: 5, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: 'Mon(21), May, 2023 12:55pm', status: 'Completed' },
    { id: 6, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: 'Mon(21), May, 2023 12:55pm', status: 'Completed' },
    { id: 7, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: 'Mon(21), May, 2023 12:55pm', status: 'Completed' },
    { id: 8, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: 'Mon(21), May, 2023 12:55pm', status: 'Completed' },
    { id: 9, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: 'Mon(21), May, 2023 12:55pm', status: 'Completed' },
    { id: 10, no: '000123589', inspectedDate: 'Mon(21), May, 2023 12:55pm', maintenanceDate: 'Mon(21), May, 2023 12:55pm', status: 'Completed' },
  ]);

  return (
    <div className="modal-overlay">
      <div className="modal details-modal">
        <div className="transformer-header">
          <h2>{transformer.no}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="transformer-details">
          <span>{transformer.region}</span>
          <span>Levels: Embuldeniya</span>
          <span>Pole No: {transformer.poleNo}</span>
          <span>Capacity: {transformer.capacity}</span>
          <span>Type: {transformer.type}</span>
          <span>No. of Feeders: {transformer.feeders}</span>
          <span>Last Inspected Date: Mon(21), May, 2023 12:55pm</span>
        </div>
        <div className="baseline-image">
          <span>Baseline Image</span>
          <span>👁️</span> {/* View icon placeholder */}
          <span>🗑️</span> {/* Delete icon placeholder */}
        </div>
        <h3>Transformer Inspections</h3>
        <table className="inspection-table">
          <thead>
            <tr>
              <th>Inspection No.</th>
              <th>Inspected Date</th>
              <th>Maintenance Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((i) => (
              <tr key={i.id}>
                <td>{i.no}</td>
                <td>{i.inspectedDate}</td>
                <td>{i.maintenanceDate}</td>
                <td>
                  <span className={`status ${i.status.toLowerCase().replace(' ', '-')}`}>
                    {i.status}
                  </span>
                </td>
                <td><button>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="actions">
          <button className="add-inspection">Add Inspection</button>
        </div>
      </div>
    </div>
  );
}

export default TransformerDetailsModal;