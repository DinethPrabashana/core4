// src/pages/Inspections.js
import React from 'react';
import InspectionList from '../components/InspectionList'; // Default import

const Inspections = () => {
  return (
    <div className="inspections-page">
      <h2>All Inspections</h2>
      <InspectionList />
    </div>
  );
};

export default Inspections;