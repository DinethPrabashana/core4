import React from 'react';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <h1>Transformers Management System</h1>
      </div>
      <div className="header-right">
        <span>Welcome, Admin</span>
      </div>
    </header>
  );
};

export default Header;