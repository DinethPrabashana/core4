import React, { useState } from "react";

export default function InspectionViewModal({ inspection, transformers, onClose, updateInspection }) {
  const transformer = transformers.find((t) => t.id === inspection.transformer);

  // State for images
  const [baselineImage, setBaselineImage] = useState(inspection.baselineImage || null);
  const [maintenanceImage, setMaintenanceImage] = useState(inspection.maintenanceImage || null);

  // Independent weather for each image
  const [baselineWeather, setBaselineWeather] = useState(
    inspection.baselineWeather ?? transformer?.weather ?? ""
  );
  const [maintenanceWeather, setMaintenanceWeather] = useState(inspection.maintenanceWeather || "");

  // Independent upload dates for each image
  const [baselineUploadDate, setBaselineUploadDate] = useState(
    inspection.baselineUploadDate || (baselineImage ? new Date().toLocaleString() : null)
  );
  const [maintenanceUploadDate, setMaintenanceUploadDate] = useState(
    inspection.maintenanceUploadDate || (maintenanceImage ? new Date().toLocaleString() : null)
  );

  // URLs for preview
  const baselineImageURL = baselineImage
    ? typeof baselineImage === "string"
      ? baselineImage
      : URL.createObjectURL(baselineImage)
    : null;

  const maintenanceImageURL = maintenanceImage
    ? typeof maintenanceImage === "string"
      ? maintenanceImage
      : URL.createObjectURL(maintenanceImage)
    : null;

  // File upload handlers
  const handleBaselineUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBaselineImage(file);
      setBaselineUploadDate(new Date().toLocaleString());
    }
  };

  const handleMaintenanceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMaintenanceImage(file);
      setMaintenanceUploadDate(new Date().toLocaleString());
    }
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

  const getMetadata = (image, type) => ({
    type,
    uploader: "Admin",
  });

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "10px",
        width: "85%",
        maxHeight: "90%",
        overflowY: "auto",
        boxShadow: "0px 0px 20px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Thermal Image</h1>

        {/* Transformer Info + Workflow Progress Side by Side */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {/* Transformer Info */}
          <div
            style={{
              flex: 1,
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              display: "flex",
              flexDirection: "column",
              gap: "5px"
            }}
          >
            <h3>Transformer Info</h3>
            <p><strong>Number:</strong> {transformer?.number || "N/A"}</p>
            <p><strong>Pole:</strong> {transformer?.pole || "N/A"}</p>
            <p><strong>Region:</strong> {transformer?.region || "N/A"}</p>
            <p><strong>Type:</strong> {transformer?.type || "N/A"}</p>
            <p><strong>Inspector:</strong> {inspection.inspector || "N/A"}</p>
            <p><strong>Inspection Date:</strong> {inspection.date || "N/A"}</p>
          </div>

          {/* Workflow Progress */}
          <div
            style={{
              flex: 1,
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f5f5f5",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>Workflow Progress (Inactive)</h3>
            {["Thermal Image Upload", "AI Analysis", "Thermal Image Review"].map((step) => (
              <div key={step}>
                <p style={{ margin: "2px 0" }}>• {step}</p>
                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    background: "#e0e0e0",
                    borderRadius: "5px"
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Thermal Image Comparison Title */}
        <h2 style={{ textAlign: "center", marginTop: "20px", marginBottom: "10px" }}>
        Thermal Image Comparison
        </h2>

        {/* Images Side by Side */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "10px" }}>
          {/* Baseline Image */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              border: "2px dashed #ccc",
              padding: "10px",
              minHeight: "300px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px"
            }}>
              <strong>Baseline Image</strong>
              <input type="file" id="baselineUpload" onChange={handleBaselineUpload} style={{ display: "none" }} />
              <label htmlFor="baselineUpload" style={{
                padding: "5px 10px",
                backgroundColor: "#28a745",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer"
              }}>Upload</label>
              {baselineImageURL && (
                <img src={baselineImageURL} alt="Baseline" style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }} />
              )}
            </div>
            {/* Metadata box below image */}
            <div style={{
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#f0f0f0",
              padding: "10px",
              marginTop: "5px"
            }}>
              <label>
                <strong>Weather:</strong>
                <select value={baselineWeather} onChange={(e) => setBaselineWeather(e.target.value)} style={{ marginLeft: "10px", padding: "3px" }}>
                  <option value="">Select</option>
                  <option value="Sunny">Sunny</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Cloudy">Cloudy</option>
                </select>
              </label>
              <p><strong>Upload Date/Time:</strong> {baselineUploadDate || "N/A"}</p>
              <p><strong>Image Type:</strong> Baseline</p>
              <p><strong>Uploader:</strong> {getMetadata(baselineImage, "Baseline").uploader}</p>
            </div>
          </div>

          {/* Maintenance Image */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              border: "2px dashed #ccc",
              padding: "10px",
              minHeight: "300px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px"
            }}>
              <strong>Maintenance Image</strong>
              <input type="file" id="maintenanceUpload" onChange={handleMaintenanceUpload} style={{ display: "none" }} />
              <label htmlFor="maintenanceUpload" style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer"
              }}>Upload</label>
              {maintenanceImageURL && (
                <img src={maintenanceImageURL} alt="Maintenance" style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }} />
              )}
            </div>
            {/* Metadata box below image */}
            <div style={{
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#f0f0f0",
              padding: "10px",
              marginTop: "5px"
            }}>
              <label>
                <strong>Weather:</strong>
                <select value={maintenanceWeather} onChange={(e) => setMaintenanceWeather(e.target.value)} style={{ marginLeft: "10px", padding: "3px" }}>
                  <option value="">Select</option>
                  <option value="Sunny">Sunny</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Cloudy">Cloudy</option>
                </select>
              </label>
              <p><strong>Upload Date/Time:</strong> {maintenanceUploadDate || "N/A"}</p>
              <p><strong>Image Type:</strong> Maintenance</p>
              <p><strong>Uploader:</strong> {getMetadata(maintenanceImage, "Maintenance").uploader}</p>
            </div>
          </div>
        </div>

        {/* Save / Close Buttons */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button className="inspector-save-btn" onClick={handleSave}>Save</button>
            <button className="inspector-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
