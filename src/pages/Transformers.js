import React, { useState } from 'react';
import TransformerList from '../components/TransformerList';
import AddTransformerModal from '../components/AddTransformerModal';

const Transformers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transformers, setTransformers] = useState([
    { id: 'AZ-9890', transformerNo: 'AZ-9890', poleNo: 'EN-122-A', region: 'Nugegoda', type: 'Bulk', locationDetails: '' },
    // ... other transformers
  ]);

  const handleAddTransformer = (newTransformer) => {
    const transformerWithId = {
      ...newTransformer,
      id: newTransformer.transformerNo
    };
    
    setTransformers(prev => [...prev, transformerWithId]);
  };

  return (
    <div className="transformers-page">
      <div className="page-header">
        <h2>Transformers</h2>
        <button 
          className="add-transformer-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Transformer
        </button>
      </div>
      
      <TransformerList transformers={transformers} />
      
      {/* Modal should be at the end to ensure it's on top */}
      <AddTransformerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransformer={handleAddTransformer}
      />
    </div>
  );
};

export default Transformers;