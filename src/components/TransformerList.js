import React from "react";

function TransformerList({ transformers, onDelete, onEdit }) {
  return (
    <div className="list">
      <h2>Transformer Records</h2>
      {transformers.length === 0 ? (
        <p>No transformers added yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Capacity (kVA)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transformers.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.location}</td>
                <td>{t.capacity}</td>
                <td>
                  <button className="btn-edit" onClick={() => onEdit(t)}>Edit</button>
                  <button className="btn-delete" onClick={() => onDelete(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TransformerList;
