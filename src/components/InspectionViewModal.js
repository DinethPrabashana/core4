import React, { useState } from "react";

export default function InspectionViewModal({ inspection, transformers, onClose, updateInspection }) {
  const transformer = transformers.find((t) => t.id === inspection.transformer);

  // Local state for baseline and maintenance images
  const [baselineImage, setBaselineImage] = useState(inspection.baselineImage || null);
  const [maintenanceImage, setMaintenanceImage] = useState(inspection.maintenanceImage || null);
  const [weather, setWeather] = useState(inspection.weather || "");

  // Convert baseline image to URL for preview
  const baselineImageURL = baselineImage
    ? typeof baselineImage === "string"
      ? baselineImage
      : URL.createObjectURL(baselineImage)
    : null;

  // Convert maintenance image to URL for preview
  const maintenanceImageURL = maintenanceImage
    ? typeof maintenanceImage === "string"
      ? maintenanceImage
      : URL.createObjectURL(maintenanceImage)
    : null;

  // Handlers
  const handleBaselineUpload = (e) => {
    const file = e.target.files[0];
    if (file) setBaselineImage(file);
  };

  const handleMaintenanceUpload = (e) => {
    const file = e.target.files[0];
    if (file) setMaintenanceImage(file);
  };

  const handleWeatherChange = (e) => {
    setWeather(e.target.value);
  };

  const handleSave = () => {
    if (updateInspection) {
      updateInspection({
        ...inspection,
        baselineImage,
        maintenanceImage,
        weather,
      });
    }
    onClose();
  };

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
        width: "80%",
        maxHeight: "90%",
        overflowY: "auto"
      }}>
        <h2>Inspection Details</h2>
        <p><strong>Transformer:</strong> {transformer?.number || "N/A"}</p>
        <p><strong>Date:</strong> {inspection.date}</p>
        <p><strong>Inspector:</strong> {inspection.inspector}</p>
        <p><strong>Notes:</strong> {inspection.notes}</p>

        {/* Weather dropdown */}
        <label>
          Weather:
          <select value={weather} onChange={handleWeatherChange} style={{ marginLeft: "10px" }}>
            <option value="">Select</option>
            <option value="Sunny">Sunny</option>
            <option value="Rainy">Rainy</option>
            <option value="Cloudy">Cloudy</option>
          </select>
        </label>

        <hr />

        {/* Images side by side */}
        <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
          {/* Baseline Image */}
          <div style={{
            flex: 1,
            border: "2px dashed #ccc",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            padding: "10px",
            maxWidth: "100%",
          }}>
            <strong>Baseline Image</strong>

            {/* Hidden input */}
            <input
              type="file"
              onChange={handleBaselineUpload}
              style={{ display: "none" }}
              id="baselineUpload"
            />

            {/* Custom upload button */}
            <label
              htmlFor="baselineUpload"
              style={{
                marginTop: "10px",
                padding: "5px 10px",
                backgroundColor: "#28a745",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Upload
            </label>

            {/* Image preview */}
            {baselineImageURL ? (
              <img
                src={baselineImageURL}
                alt="Baseline"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  marginTop: "10px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <span style={{ marginTop: "10px" }}>No Image</span>
            )}
          </div>

          {/* Maintenance Image */}
          <div style={{
            flex: 1,
            border: "2px dashed #ccc",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            padding: "10px",
            maxWidth: "100%",
          }}>
            <strong>Maintenance Image</strong>

            {/* Hidden input */}
            <input
              type="file"
              onChange={handleMaintenanceUpload}
              style={{ display: "none" }}
              id="maintenanceUpload"
            />

            {/* Custom upload button */}
            <label
              htmlFor="maintenanceUpload"
              style={{
                marginTop: "10px",
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Upload
            </label>

            {/* Image preview */}
            {maintenanceImageURL && (
              <img
                src={maintenanceImageURL}
                alt="Maintenance"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  marginTop: "10px",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button onClick={handleSave} style={{ marginRight: "10px" }}>Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
