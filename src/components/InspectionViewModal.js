import React, { useState, useEffect } from "react";
import '../style/InspectionViewModal.css';

export default function InspectionViewModal({ inspection, transformers, onClose, updateInspection, updateTransformer }) {
  const transformer = transformers.find(t => t.id === inspection.transformer);
  const uploader = "Admin";

  // --- Local state for Baseline Image ---
  const [baselineImage, setBaselineImage] = useState(inspection.baselineImage || transformer?.baselineImage || null);
  const [baselineWeather, setBaselineWeather] = useState(inspection.baselineWeather || transformer?.weather || "Sunny");
  const [baselineUploadDate, setBaselineUploadDate] = useState(inspection.baselineUploadDate || transformer?.baselineUploadDate || null);
  const [localBaselineChanged, setLocalBaselineChanged] = useState(false);

  useEffect(() => {
    if (!localBaselineChanged) {
      setBaselineImage(transformer?.baselineImage || null);
      setBaselineWeather(transformer?.weather || "Sunny");
      setBaselineUploadDate(transformer?.baselineUploadDate || null);
    }
  }, [transformer, localBaselineChanged]);

  const [baselineImageURL, setBaselineImageURL] = useState(null);
  useEffect(() => {
    if (!baselineImage) { setBaselineImageURL(null); return; }
    if (baselineImage instanceof File || baselineImage instanceof Blob) {
      const url = URL.createObjectURL(baselineImage);
      setBaselineImageURL(url);
      return () => URL.revokeObjectURL(url);
    } else { setBaselineImageURL(baselineImage); }
  }, [baselineImage]);

  // --- Maintenance Image ---
  const [maintenanceImage, setMaintenanceImage] = useState(inspection.maintenanceImage || null);
  const [maintenanceWeather, setMaintenanceWeather] = useState(inspection.maintenanceWeather || "Sunny");
  const [maintenanceUploadDate, setMaintenanceUploadDate] = useState(inspection.maintenanceUploadDate || null);
  const [localMaintenanceChanged, setLocalMaintenanceChanged] = useState(false);

  useEffect(() => {
    if (!localMaintenanceChanged && transformer?.maintenanceImage) {
      setMaintenanceImage(transformer.maintenanceImage);
      setMaintenanceWeather(transformer?.maintenanceWeather || "Sunny");
      setMaintenanceUploadDate(transformer?.maintenanceUploadDate || null);
    }
  }, [transformer, localMaintenanceChanged]);

  const [maintenanceImageURL, setMaintenanceImageURL] = useState(null);
  useEffect(() => {
    if (!maintenanceImage) { setMaintenanceImageURL(null); return; }
    if (maintenanceImage instanceof File || maintenanceImage instanceof Blob) {
      const url = URL.createObjectURL(maintenanceImage);
      setMaintenanceImageURL(url);
      return () => URL.revokeObjectURL(url);
    } else { setMaintenanceImageURL(maintenanceImage); }
  }, [maintenanceImage]);

  const [showBaselinePreview, setShowBaselinePreview] = useState(false);
  const weatherOptions = ["Sunny", "Rainy", "Cloudy"];

  // --- Progress status ---
  const [progressStatus, setProgressStatus] = useState(
    inspection.progressStatus || {
      thermalUpload: inspection.maintenanceImage ? "Completed" : "Pending",
      aiAnalysis: inspection.maintenanceImage ? "In Progress" : "Pending",
      review: inspection.maintenanceImage ? "In Progress" : "Pending"
    }
  );

  // --- Complete button handler ---
  const handleComplete = () => {
    setProgressStatus(prev => ({
      ...prev,
      aiAnalysis: "Completed",
      review: "Completed"
    }));
  };

  const renderStep = (label, state) => {
    const color = state === "Completed" ? "green" : state === "In Progress" ? "orange" : "grey";
    return (
      <div className="progress-step">
        <div className="progress-circle" style={{ backgroundColor: color }}></div>
        <span className="progress-label"><strong>{label}</strong></span>
        <span className="progress-status"><strong>{state}</strong></span>
      </div>
    );
  };

  // --- Handlers ---
  const handleBaselineUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const now = new Date().toLocaleString();
        setBaselineImage(reader.result);
        setBaselineUploadDate(now);
        setLocalBaselineChanged(true);
        if (updateTransformer && transformer) {
          updateTransformer({
            ...transformer,
            baselineImage: reader.result,
            baselineUploadDate: now,
            weather: baselineWeather
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteBaseline = () => {
    setBaselineImage(null);
    setBaselineUploadDate(null);
    setBaselineWeather("Sunny");
    setLocalBaselineChanged(false);
    if (updateTransformer && transformer) {
      updateTransformer({
        ...transformer,
        baselineImage: null,
        baselineUploadDate: null,
        weather: "Sunny",
      });
    }
  };

  const handleMaintenanceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMaintenanceImage(reader.result);
        setMaintenanceUploadDate(new Date().toLocaleString());
        setLocalMaintenanceChanged(true);

        // Update progress immediately
        setProgressStatus({
          thermalUpload: "Completed",
          aiAnalysis: "In Progress",
          review: "In Progress"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (updateInspection) {
      updateInspection({
        ...inspection,
        baselineImage,
        baselineWeather,
        baselineUploadDate,
        maintenanceImage,
        maintenanceWeather,
        maintenanceUploadDate,
        progressStatus
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h1 className="modal-title">Thermal Image</h1>

        {/* Transformer Info + Progress side by side */}
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
              {renderStep("Thermal Image Upload", progressStatus.thermalUpload)}
              {renderStep("AI Analysis", progressStatus.aiAnalysis)}
              {renderStep("Thermal Image Review", progressStatus.review)}
            </div>
          </div>
        </div>

        {/* Baseline + Thermal side by side */}
        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Baseline Image</h3>
            <div className="weather-select">
              <label>
                Weather:
                <select value={baselineWeather} onChange={e => setBaselineWeather(e.target.value)} disabled={!baselineImage}>
                  {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>
            {baselineImageURL ? (
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

        {baselineImageURL && maintenanceImageURL && (
          <div className="modal-section comparison">
            <h3 className="center-text">Thermal Image Comparison</h3>
            <div className="comparison-flex">
              <div className="image-card">
                <h4>Baseline Image</h4>
                <div className="image-box"><img src={baselineImageURL} alt="Baseline" /></div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {baselineUploadDate || "N/A"}</p>
                  <p><strong>Weather:</strong> {baselineWeather}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> Baseline</p>
                </div>
              </div>
              <div className="image-card">
                <h4>Thermal Image</h4>
                <div className="image-box"><img src={maintenanceImageURL} alt="Thermal" /></div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {maintenanceUploadDate || "N/A"}</p>
                  <p><strong>Weather:</strong> {maintenanceWeather}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> Maintenance</p>
                </div>
              </div>
            </div>

            {/* Complete button */}
            <div className="complete-button-container">
              <button className="inspection-complete-btn" onClick={handleComplete}>Complete</button>
            </div>
          </div>
        )}

        {showBaselinePreview && baselineImageURL && (
          <div className="modal-overlay">
            <div className="modal-card preview-card">
              <h3>Baseline Image Preview</h3>
              <img src={baselineImageURL} alt="Baseline Preview" className="preview-image" />
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
