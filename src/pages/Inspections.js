import React from 'react';
import InspectionList from '../components/InspectionList';

const Inspections = () => {
  return (
    <div className="inspections-page">
      <h2>All Inspections</h2>
      <InspectionList />
    </div>
  );
};

export default Inspections;