import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Transformers</h3>
          <p className="stat-number">42</p>
        </div>
        <div className="stat-card">
          <h3>Inspections This Month</h3>
          <p className="stat-number">18</p>
        </div>
        <div className="stat-card">
          <h3>Pending Actions</h3>
          <p className="stat-number">7</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;