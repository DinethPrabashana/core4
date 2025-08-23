import React, { useState, useMemo } from "react";
import '../style/InspectionViewModal.css';

export default function InspectionViewModal({ inspection, transformers, onClose, updateInspection }) {
  const transformer = transformers.find((t) => t.id === inspection.transformer);

  // Images
  const [baselineImage, setBaselineImage] = useState(inspection.baselineImage || null);
  const [maintenanceImage, setMaintenanceImage] = useState(inspection.maintenanceImage || null);

  // Weather
  const [baselineWeather, setBaselineWeather] = useState(inspection.baselineWeather ?? transformer?.weather ?? "Sunny");
  const [maintenanceWeather, setMaintenanceWeather] = useState(inspection.maintenanceWeather || "Sunny");

  // Upload dates
  const [baselineUploadDate, setBaselineUploadDate] = useState(
    inspection.baselineUploadDate || (baselineImage ? new Date().toLocaleString() : null)
  );
  const [maintenanceUploadDate, setMaintenanceUploadDate] = useState(
    inspection.maintenanceUploadDate || (maintenanceImage ? new Date().toLocaleString() : null)
  );

  const uploader = "Admin"; // Static

  // Preview modal
  const [showBaselinePreview, setShowBaselinePreview] = useState(false);

  // URLs
  const baselineImageURL = useMemo(() => {
    if (!baselineImage) return null;
    if (baselineImage instanceof File || baselineImage instanceof Blob) return URL.createObjectURL(baselineImage);
    return baselineImage; // base64 string or asset
  }, [baselineImage]);

  const maintenanceImageURL = useMemo(() => {
    if (!maintenanceImage) return null;
    if (maintenanceImage instanceof File || maintenanceImage instanceof Blob) return URL.createObjectURL(maintenanceImage);
    return maintenanceImage; // base64 string or asset
  }, [maintenanceImage]);

  // Handlers
  const handleBaselineUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaselineImage(reader.result);
        setBaselineUploadDate(new Date().toLocaleString());
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMaintenanceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMaintenanceImage(reader.result);
        setMaintenanceUploadDate(new Date().toLocaleString());
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBaselineDelete = () => {
    setBaselineImage(null);
    setBaselineUploadDate(null);
  };

  const handleSave = () => {
    if (updateInspection) {
      updateInspection({
        ...inspection,
        baselineImage,
        maintenanceImage,
        baselineWeather,
        maintenanceWeather,
        baselineUploadDate,
        maintenanceUploadDate,
      });
    }
    onClose();
  };

  const weatherOptions = ["Sunny", "Rainy", "Cloudy"];

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h1 className="modal-title">Thermal Image</h1>

        {/* Transformer Info + Workflow */}
        <div className="modal-flex">
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
            <h3>Workflow Progress (Inactive)</h3>
            {["Thermal Image Upload", "AI Analysis", "Thermal Image Review"].map(step => (
              <div key={step} className="workflow-step">
                <p>• {step}</p>
                <div className="workflow-bar" />
              </div>
            ))}
          </div>
        </div>

        {/* Baseline & Thermal Upload */}
        <div className="modal-flex">
          {/* Baseline */}
          <div className="modal-section">
            <h3>Baseline Image</h3>
            <div className="weather-select">
              <label>
                Weather:{" "}
                <select value={baselineWeather} onChange={e => setBaselineWeather(e.target.value)}>
                  {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>

            {baselineImageURL ? (
              <div className="image-actions">
                <span>🖼️ Baseline Image uploaded</span>
                <button onClick={() => setShowBaselinePreview(true)}>👁️</button>
                <button onClick={handleBaselineDelete} className="danger-btn">🗑️</button>
              </div>
            ) : (
              <>
                <input type="file" id="baselineUpload" onChange={handleBaselineUpload} className="file-input" />
                <label htmlFor="baselineUpload" className="upload-btn">📤 Upload Baseline Image</label>
              </>
            )}
          </div>

          {/* Thermal */}
          <div className="modal-section">
            <h3>Thermal Image</h3>
            <div className="upload-weather-container">
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
        </div>

        {/* Comparison */}
        {baselineImageURL && maintenanceImageURL && (
          <div className="modal-section comparison">
            <h3 className="center-text">Thermal Image Comparison</h3>
            <div className="comparison-flex">
              <div className="image-card">
                <h4>Baseline Image</h4>
                <div className="image-box">
                  <img src={baselineImageURL} alt="Baseline" />
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
                  <img src={maintenanceImageURL} alt="Thermal" />
                </div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {maintenanceUploadDate || "N/A"}</p>
                  <p><strong>Weather:</strong> {maintenanceWeather}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> Maintenance</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Baseline Preview */}
        {showBaselinePreview && baselineImageURL && (
          <div className="modal-overlay">
            <div className="modal-card preview-card">
              <h3>Baseline Image Preview</h3>
              <img src={baselineImageURL} alt="Baseline Preview" className="preview-image" />
              <button onClick={() => setShowBaselinePreview(false)} className="inspection-cancel-btn">Close</button>
            </div>
          </div>
        )}

        {/* Save / Close */}
        <div className="inspection-modal-buttons">
          <button onClick={handleSave} className="inspection-save-btn">Save</button>
          <button onClick={onClose} className="inspection-cancel-btn">Close</button>
        </div>
      </div>
    </div>
  );
}
