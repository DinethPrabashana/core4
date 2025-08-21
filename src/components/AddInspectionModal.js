import { useState } from 'react';

function AddInspectionModal({ transformer, onClose, onAdd }) {
  const [branch, setBranch] = useState(transformer.region);
  const [transformerNo, setTransformerNo] = useState(transformer.no);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleConfirm = () => {
    if (date && time) {
      const inspectedDate = new Date(`${date}T${time}`).toLocaleString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).replace(/(\d+),/, '($1),');

      const newInspection = {
        no: '000' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        inspectedDate,
        maintenanceDate: '-',
        status: 'In Progress'
      };

      onAdd(newInspection);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>New Inspection</h2>
        <button className="close-button" onClick={onClose}>×</button>
        <label>Branch</label>
        <input value={branch} onChange={(e) => setBranch(e.target.value)} />
        <label>Transformer No</label>
        <input value={transformerNo} onChange={(e) => setTransformerNo(e.target.value)} />
        <label>Date of Inspection</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label>Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <div className="modal-buttons">
          <button className="confirm" onClick={handleConfirm}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddInspectionModal;