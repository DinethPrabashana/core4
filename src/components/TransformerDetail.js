import React, { useState } from 'react';

const TransformerDetail = ({ transformerId }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [weatherCondition, setWeatherCondition] = useState('Sunny');
  
  // Simulate upload progress
  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="transformer-detail">
      <div className="detail-header">
        <h2>Transformer Inspection</h2>
        <p>Mon(21), May, 2023 12:55pm</p>
      </div>
      
      <div className="transformer-info">
        <div className="info-item">
          <label>Transformer No:</label>
          <span>A2-8370</span>
        </div>
        <div className="info-item">
          <label>Pole No:</label>
          <span>EN-122-A</span>
        </div>
        <div className="info-item">
          <label>Branch:</label>
          <span>Nugegoda</span>
        </div>
        <div className="info-item">
          <label>Inspected By:</label>
          <span>A-110</span>
        </div>
      </div>
      
      <div className="thermal-image-section">
        <h3>Thermal Image</h3>
        <p>Upload a thermal image of the transformer to identify potential issues.</p>
        
        <div className="weather-condition">
          <label>Weather Condition:</label>
          <select 
            value={weatherCondition} 
            onChange={(e) => setWeatherCondition(e.target.value)}
          >
            <option value="Sunny">Sunny</option>
            <option value="Cloudy">Cloudy</option>
            <option value="Rainy">Rainy</option>
          </select>
        </div>
        
        <div className="upload-section">
          <input type="file" id="thermal-upload" accept="image/*" />
          <button onClick={simulateUpload}>Upload Thermal Image</button>
        </div>
        
        {uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span>{uploadProgress}%</span>
          </div>
        )}
        
        <div className="progress-steps">
          <div className={`step ${uploadProgress > 0 ? 'active' : ''}`}>
            Thermal image upload
          </div>
          <div className={`step ${uploadProgress > 30 ? 'active' : ''}`}>
            AI Analysis
          </div>
          <div className={`step ${uploadProgress > 60 ? 'active' : ''}`}>
            Thermal image Review
          </div>
        </div>
      </div>
      
      <div className="other-questions">
        <h3>Other Questions</h3>
        <input type="text" placeholder="Search sites" />
        <div className="contact">
          <a href="mailto:olivero@gmail.com">olivero@gmail.com</a>
        </div>
      </div>
      
      <div className="status-bar">
        <p>Last updated: Mon(21), May, 2023 12:55pm</p>
        <span className="status in-progress">In Progress</span>
      </div>
    </div>
  );
};

export default TransformerDetail;