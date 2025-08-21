import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Transformers from './pages/Transformers';
import Inspections from './pages/Inspections';
import TransformerDetailPage from './pages/TransformerDetailPage';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="App">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="main-content">
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transformers" element={<Transformers />} />
              <Route path="/inspections" element={<Inspections />} />
              <Route path="/transformer/:id" element={<TransformerDetailPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;