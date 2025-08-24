import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/InspectionViewModal.css";

export default function InspectionViewModal({ inspection, transformers, onClose, updateInspection, updateTransformer }) {
  const transformer = transformers.find(t => t.id === inspection.transformer.id);
  const uploader = "Admin";

  const [baselineImage, setBaselineImage] = useState(null);
  const [baselineWeather, setBaselineWeather] = useState(transformer?.weather || "Sunny");
  const [baselineUploadDate, setBaselineUploadDate] = useState(transformer?.baselineUploadDate || null);
  const [localBaselineChanged, setLocalBaselineChanged] = useState(false);

  const [maintenanceImage, setMaintenanceImage] = useState(null);
  const [maintenanceWeather, setMaintenanceWeather] = useState(inspection.maintenanceWeather || "Sunny");
  const [maintenanceUploadDate, setMaintenanceUploadDate] = useState(inspection.maintenanceUploadDate || null);
  const [localMaintenanceChanged, setLocalMaintenanceChanged] = useState(false);

  const [showBaselinePreview, setShowBaselinePreview] = useState(false);
  const weatherOptions = ["Sunny", "Rainy", "Cloudy"];

  const [progressStatus, setProgressStatus] = useState(
    inspection.progressStatus || {
      thermalUpload: inspection.maintenanceImagePath ? "Completed" : "Pending",
      aiAnalysis: inspection.maintenanceImagePath ? "In Progress" : "Pending",
      review: inspection.maintenanceImagePath ? "In Progress" : "Pending",
    }
  );

  const handleComplete = () => {
    setProgressStatus(prev => ({
      ...prev,
      aiAnalysis: "Completed",
      review: "Completed",
    }));
  };

  const handleBaselineUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBaselineImage(file);
      setBaselineUploadDate(new Date().toISOString());
      setLocalBaselineChanged(true);
    }
  };

  const handleDeleteBaseline = () => {
    setBaselineImage(null);
    setBaselineUploadDate(null);
    setBaselineWeather("Sunny");
    setLocalBaselineChanged(false);
    if (updateTransformer && transformer) {
      axios.put(`http://localhost:8080/api/transformers/${transformer.id}`, {
        ...transformer,
        baselineImagePath: null,
        baselineUploadDate: null,
        weather: "Sunny",
      })
        .then(() => updateTransformer({ ...transformer, baselineImagePath: null, baselineUploadDate: null, weather: "Sunny" }))
        .catch(err => console.error("Error deleting baseline image:", err));
    }
  };

  const handleMaintenanceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const form = new FormData();
      form.append("file", file);
      form.append("weather", maintenanceWeather);
      axios.post(`http://localhost:8080/api/inspections/${inspection.id}/upload-maintenance`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
        .then(() => {
          setMaintenanceImage(file);
          setMaintenanceUploadDate(new Date().toISOString());
          setLocalMaintenanceChanged(true);
          setProgressStatus({
            thermalUpload: "Completed",
            aiAnalysis: "In Progress",
            review: "In Progress",
          });
          axios.get(`http://localhost:8080/api/inspections/${inspection.id}`)
            .then(res => updateInspection(res.data));
        })
        .catch(err => console.error("Error uploading maintenance image:", err));
    }
  };

  const handleSave = () => {
    const updatedInspection = {
      ...inspection,
      date: inspection.date,
      inspector: inspection.inspector,
      notes: inspection.notes,
      maintenanceWeather,
      maintenanceUploadDate,
      progressStatus,
    };
    if (localBaselineChanged && transformer) {
      const form = new FormData();
      if (baselineImage instanceof File) {
        form.append("file", baselineImage);
        form.append("weather", baselineWeather);
        axios.post(`http://localhost:8080/api/transformers/${transformer.id}/upload-baseline`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
          .then(() => {
            axios.get(`http://localhost:8080/api/transformers/${transformer.id}`)
              .then(res => updateTransformer(res.data));
          })
          .catch(err => console.error("Error uploading baseline image:", err));
      }
    }
    updateInspection(updatedInspection);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h1 className="modal-title">Thermal Image</h1>

        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Transformer Info</h3>
            <p><strong>Number:</strong> {transformer?.number || "N/A"}</p>
            <p><strong>Pole:</strong> {transformer?.pole || "N/A"}</p>
            <p><strong>Region:</strong> {transformer?.region || "N/A"}</p>
            <p><strong>Location:</strong> {transformer?.location || "N/A"}</p>
            <p><strong>Type:</strong> {transformer?.type || "N/A"}</p>
            <p><strong>Inspector:</strong> {inspection.inspector || "N/A"}</p>
            <p><strong>Inspection Date:</strong> {inspection.date || "N/A"}</p>
          </div>

          <div className="modal-section">
            <h3>Inspection Progress</h3>
            <div className="progress-bar-container">
              {["Thermal Image Upload", "AI Analysis", "Thermal Image Review"].map((label, index) => {
                const state = Object.values(progressStatus)[index];
                const color = state === "Completed" ? "green" : state === "In Progress" ? "orange" : "grey";
                return (
                  <div className="progress-step" key={label}>
                    <div className="progress-circle" style={{ backgroundColor: color }}></div>
                    <span className="progress-label"><strong>{label}</strong></span>
                    <span className="progress-status"><strong>{state}</strong></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Baseline Image</h3>
            <div className="weather-select">
              <label>
                Weather:
                <select value={baselineWeather} onChange={e => setBaselineWeather(e.target.value)} disabled={!transformer?.baselineImagePath && !baselineImage}>
                  {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>
            {transformer?.baselineImagePath || baselineImage ? (
              <div className="image-actions">
                <span>🖼️ Baseline Image uploaded</span>
                <button onClick={() => setShowBaselinePreview(true)}>👁️</button>
                <button onClick={handleDeleteBaseline} className="danger-btn">🗑️</button>
              </div>
            ) : (
              <>
                <input type="file" id="baselineUpload" onChange={handleBaselineUpload} style={{ display: "none" }} />
                <label htmlFor="baselineUpload" className="upload-btn">📤 Upload Baseline Image</label>
              </>
            )}
          </div>

          <div className="modal-section">
            <h3>Thermal Image</h3>
            <input type="file" id="maintenanceUpload" onChange={handleMaintenanceUpload} style={{ display: "none" }} />
            <label htmlFor="maintenanceUpload" className="upload-btn">Upload Thermal Image</label>
            <label>
              Weather:
              <select value={maintenanceWeather} onChange={e => setMaintenanceWeather(e.target.value)}>
                {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
          </div>
        </div>

        {(transformer?.baselineImagePath || baselineImage) && (inspection.maintenanceImagePath || maintenanceImage) && (
          <div className="modal-section comparison">
            <h3 className="center-text">Thermal Image Comparison</h3>
            <div className="comparison-flex">
              <div className="image-card">
                <h4>Baseline Image</h4>
                <div className="image-box">
                  <img src={baselineImage instanceof File ? URL.createObjectURL(baselineImage) : `http://localhost:8080${transformer?.baselineImagePath}`} alt="Baseline" />
                </div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {baselineUploadDate || "N/A"}</p>
                  <p><strong>Weather:</strong> {baselineWeather}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> Baseline</p>
                </div>
              </div>
              <div className="image-card">
                <h4>Thermal Image</h4>
                <div className="image-box">
                  <img src={maintenanceImage instanceof File ? URL.createObjectURL(maintenanceImage) : `http://localhost:8080${inspection.maintenanceImagePath}`} alt="Thermal" />
                </div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {maintenanceUploadDate || "N/A"}</p>
                  <p><strong>Weather:</strong> {maintenanceWeather}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> Maintenance</p>
                </div>
              </div>
            </div>

            <div className="complete-button-container">
              <button className="inspection-complete-btn" onClick={handleComplete}>Complete</button>
            </div>
          </div>
        )}

        {showBaselinePreview && (transformer?.baselineImagePath || baselineImage) && (
          <div className="modal-overlay">
            <div className="modal-card preview-card">
              <h3>Baseline Image Preview</h3>
              <img src={baselineImage instanceof File ? URL.createObjectURL(baselineImage) : `http://localhost:8080${transformer?.baselineImagePath}`} alt="Baseline Preview" className="preview-image" />
              <button onClick={() => setShowBaselinePreview(false)} className="inspection-cancel-btn">Close</button>
            </div>
          </div>
        )}

        <div className="inspection-modal-buttons">
          <button onClick={handleSave} className="inspection-save-btn">Save</button>
          <button onClick={onClose} className="inspection-cancel-btn">Close</button>
        </div>
      </div>
    </div>
  );
}