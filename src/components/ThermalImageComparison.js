import React, { useState } from "react";
import MaintenanceImageModal from "./MaintenanceImageModal";
import '../style/InspectionViewModal.css';

export default function ThermalImageComparison({
  baselineImageURL,
  maintenanceImageURL,
  baselineUploadDate,
  baselineWeather,
  maintenanceWeather,
  uploader = "Admin",
  inspectionDate,
  onComplete,
  anomalies = [] // Array of bounding boxes: [{x, y, width, height}]
}) {
  const [showModal, setShowModal] = useState(false);

  if (!baselineImageURL || !maintenanceImageURL) return null;

  return (
    <div className="modal-section comparison">
      <h3 className="center-text">Thermal Image Comparison</h3>
      <div className="comparison-flex">
        {/* Baseline Image */}
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

        {/* Thermal Image */}
        <div className="image-card">
          <h4>Thermal Image</h4>
          <div className="image-box" style={{ position: "relative" }}>
            <img src={maintenanceImageURL} alt="Thermal" style={{ width: "100%" }} />
            
            {/* Overlay anomalies */}
            {anomalies.map((box, idx) => (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  border: "2px solid red",
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                  pointerEvents: "none"
                }}
              />
            ))}

            {/* Zoom button at bottom-right */}
            <button 
              onClick={() => setShowModal(true)}
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                padding: "6px 12px",
                fontSize: "0.9rem",
                borderRadius: "4px",
                backgroundColor: "#715fbdff",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              🔍
            </button>
          </div>

          {/* Image info below the image */}
          <div className="image-info" style={{ marginTop: "5px" }}>
            <p><strong>Date & Time:</strong> {inspectionDate || "N/A"}</p>
            <p><strong>Weather:</strong> {maintenanceWeather}</p>
            <p><strong>Uploader:</strong> {uploader}</p>
            <p><strong>Image Type:</strong> Maintenance</p>
          </div>
        </div>
      </div>

      {onComplete && (
        <div className="complete-button-container" style={{ marginTop: "10px" }}>
          <button className="inspection-complete-btn" onClick={onComplete}>Start Analysis</button>
        </div>
      )}

      {showModal && (
        <MaintenanceImageModal
          imageURL={maintenanceImageURL}
          anomalies={anomalies}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
