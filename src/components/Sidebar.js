import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Menu</h2>
        <button className="close-btn" onClick={toggleSidebar}>×</button>
      </div>
      <ul className="sidebar-menu">
        <li><Link to="/" onClick={toggleSidebar}>Dashboard</Link></li>
        <li><Link to="/transformers" onClick={toggleSidebar}>Transformers</Link></li>
        <li><Link to="/inspections" onClick={toggleSidebar}>Inspections</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;