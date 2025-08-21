import { useState } from 'react';
import './App.css';
import TransformerTab from './components/TransformerTab';
import InspectionsTab from './components/InspectionsTab';

function App() {
  const [activeTab, setActiveTab] = useState('transformer');
  const [activeSubTab, setActiveSubTab] = useState('transformers');
  const [transformers, setTransformers] = useState([
    { id: 1, favorite: true, no: 'AZ-8880', poleNo: 'EN-122-A', region: 'Nugegoda', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 2, favorite: true, no: 'AZ-1649', poleNo: 'EN-122-A', region: 'Nugegoda', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 3, favorite: true, no: 'AZ-7316', poleNo: 'EN-122-B', region: 'Nugegoda', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 4, favorite: true, no: 'AZ-4813', poleNo: 'EN-122-B', region: 'Nugegoda', type: 'Distribution', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 5, favorite: true, no: 'AX-6983', poleNo: 'EN-122-A', region: 'Nugegoda', type: 'Distribution', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 6, favorite: true, no: 'AY-8730', poleNo: 'EN-122-B', region: 'Nugegoda', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 7, favorite: true, no: 'AZ-4563', poleNo: 'EN-123-A', region: 'Maharagama', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 8, favorite: true, no: 'AZ-8623', poleNo: 'EN-123-A', region: 'Maharagama', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 9, favorite: true, no: 'AZ-8466', poleNo: 'EN-123-B', region: 'Maharagama', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 10, favorite: true, no: 'AZ-7806', poleNo: 'EN-123-A', region: 'Maharagama', type: 'Bulk', capacity: '102.9', feeders: 2, inspections: [] },
    { id: 11, favorite: true, no: 'AX-8960', poleNo: 'EN-123-A', region: 'Maharagama', type: 'Distribution', capacity: '102.9', feeders: 2, inspections: [] },
  ]);

  const addTransformer = (newTransformer) => {
    setTransformers([...transformers, { id: transformers.length + 1, favorite: false, ...newTransformer, capacity: '102.9', feeders: 2, inspections: [] }]);
  };

  const addInspection = (transformerId, newInspection) => {
    setTransformers(transformers.map(t => 
      t.id === transformerId 
        ? { ...t, inspections: [...t.inspections, { id: t.inspections.length + 1, favorite: false, ...newInspection }] } 
        : t
    ));
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">Oversight</div>
        <button
          className={`sidebar-button ${activeTab === 'transformer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transformer')}
        >
          Transformer
        </button>
        <button
          className={`sidebar-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="main">
        <div className="header">
          <span className="header-title">
            {activeTab === 'transformer' ? 'Transformers' : 'Settings'}
          </span>
          {activeTab === 'transformer' && (
            <div className="sub-tabs">
              <button
                className={`sub-tab-button ${activeSubTab === 'transformers' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('transformers')}
              >
                Transformers
              </button>
              <button
                className={`sub-tab-button ${activeSubTab === 'inspections' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('inspections')}
              >
                Inspections
              </button>
            </div>
          )}
          <div className="user-profile">
            <span>🔔</span>
            <span>Olivia Queen (olivia@email.com)</span>
            <span>👤</span>
          </div>
        </div>

        <div className="content">
          {activeTab === 'transformer' && activeSubTab === 'transformers' && (
            <TransformerTab transformers={transformers} addTransformer={addTransformer} addInspection={addInspection} />
          )}
          {activeTab === 'transformer' && activeSubTab === 'inspections' && <InspectionsTab />}
          {activeTab === 'settings' && <div>Settings UI coming soon</div>}
        </div>
      </div>
    </div>
  );
}

export default App;