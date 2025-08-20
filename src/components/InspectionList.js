import React from "react";

function InspectionList({ inspections, transformers, onSelect, onDelete, onStatus }) {
  const tMap = Object.fromEntries(transformers.map(t => [t.id, t]));

  return (
    <div className="list">
      <h2>Inspections</h2>
      {inspections.length === 0 ? (
        <p>No inspections yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Transformer</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Status</th>
              <th>Condition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((ins) => (
              <tr key={ins.id}>
                <td>{ins.id}</td>
                <td>
                  {tMap[ins.transformerId]
                    ? `${tMap[ins.transformerId].location} (${tMap[ins.transformerId].capacity} kVA)`
                    : ins.transformerId}
                </td>
                <td>{ins.date}</td>
                <td>{ins.inspector}</td>
                <td>
                  <select
                    value={ins.status}
                    onChange={(e) => onStatus(ins.id, e.target.value)}
                  >
                    <option>Pending</option>
                    <option>In Review</option>
                    <option>Completed</option>
                  </select>
                </td>
                <td>{ins.condition}</td>
                <td>
                  <button onClick={() => onSelect(ins.id)}>Open</button>
                  <button className="btn-delete" onClick={() => onDelete(ins.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InspectionList;
