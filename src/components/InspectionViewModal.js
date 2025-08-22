import React, { useState } from "react";

export default function InspectionViewModal({ inspection, transformers, onClose, updateInspection }) {
  const transformer = transformers.find((t) => t.id === inspection.transformer);

  // State for images
  const [baselineImage, setBaselineImage] = useState(inspection.baselineImage || null);
  const [maintenanceImage, setMaintenanceImage] = useState(inspection.maintenanceImage || null);

  // Weather states
  const [baselineWeather, setBaselineWeather] = useState(
    inspection.baselineWeather ?? transformer?.weather ?? "Sunny"
  );
  const [maintenanceWeather, setMaintenanceWeather] = useState(
    inspection.maintenanceWeather || "Sunny"
  );

  // Upload dates
  const [baselineUploadDate, setBaselineUploadDate] = useState(
    inspection.baselineUploadDate || (baselineImage ? new Date().toLocaleString() : null)
  );
  const [maintenanceUploadDate, setMaintenanceUploadDate] = useState(
    inspection.maintenanceUploadDate || (maintenanceImage ? new Date().toLocaleString() : null)
  );

  // Preview states
  const [showBaselinePreview, setShowBaselinePreview] = useState(false);

  // URLs
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

  // Handlers
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

  const handleBaselineDelete = () => {
    setBaselineImage(null);
    setBaselineUploadDate(null);
    setShowBaselinePreview(false);
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          width: "85%",
          maxHeight: "90%",
          overflowY: "auto",
          boxShadow: "0px 0px 20px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Thermal Image</h1>

        {/* Transformer Info + Workflow */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div
            style={{
              flex: 1,
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3>Transformer Info</h3>
            <p><strong>Number:</strong> {transformer?.number || "N/A"}</p>
            <p><strong>Pole:</strong> {transformer?.pole || "N/A"}</p>
            <p><strong>Region:</strong> {transformer?.region || "N/A"}</p>
            <p><strong>Location:</strong> {transformer?.location || "N/A"}</p> 
            <p><strong>Type:</strong> {transformer?.type || "N/A"}</p>
            <p><strong>Inspector:</strong> {inspection.inspector || "N/A"}</p>
            <p><strong>Inspection Date:</strong> {inspection.date || "N/A"}</p>

          </div>

          <div
            style={{
              flex: 1,
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f5f5f5",
            }}
          >
            <h3>Workflow Progress (Inactive)</h3>
            {["Thermal Image Upload", "AI Analysis", "Thermal Image Review"].map(
              (step) => (
                <div key={step} style={{ marginBottom: "5px" }}>
                  <p>• {step}</p>
                  <div
                    style={{
                      width: "100%",
                      height: "10px",
                      background: "#e0e0e0",
                      borderRadius: "5px",
                    }}
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* Baseline & Thermal Sections Side by Side */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {/* Baseline Section */}
          <div
            style={{
              flex: "1 1 300px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: "300px",
            }}
          >
            <h3>Baseline Image</h3>
            {/* Weather Dropdown */}
            <div>
              <label>
                Weather:{" "}
                <select
                  value={baselineWeather}
                  onChange={(e) => setBaselineWeather(e.target.value)}
                  style={{ padding: "3px 6px" }}
                >
                  {weatherOptions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Image Status / Controls */}
            {baselineImageURL ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🖼️ Baseline Image uploaded</span>
                <button
                  onClick={() => setShowBaselinePreview(true)}
                  style={{ cursor: "pointer", border: "none", background: "transparent", fontSize: "18px" }}
                >
                  👁️
                </button>
                <button
                  onClick={handleBaselineDelete}
                  style={{ cursor: "pointer", border: "none", background: "transparent", fontSize: "18px", color: "red" }}
                >
                  🗑️
                </button>
              </div>
            ) : (
              <>
                <p>No baseline image uploaded.</p>
                <input type="file" id="baselineUpload" onChange={handleBaselineUpload} style={{ display: "none" }} />
                <label
                  htmlFor="baselineUpload"
                  style={{ padding: "5px 10px", backgroundColor: "#28a745", color: "white", borderRadius: "5px", cursor: "pointer" }}
                >
                  📤 Upload Baseline Image
                </label>
              </>
            )}
          </div>

          {/* Thermal Section */}
          <div
            style={{
              flex: "1 1 300px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: "300px",
            }}
          >
            <h3>Thermal Image</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <input type="file" id="maintenanceUpload" onChange={handleMaintenanceUpload} style={{ display: "none" }} />
                <label
                  htmlFor="maintenanceUpload"
                  style={{ padding: "5px 10px", backgroundColor: "#007bff", color: "white", borderRadius: "5px", cursor: "pointer" }}
                >
                  Upload Thermal Image
                </label>
              </div>

              <div>
                <label>
                  Weather:{" "}
                  <select
                    value={maintenanceWeather}
                    onChange={(e) => setMaintenanceWeather(e.target.value)}
                    style={{ padding: "3px 6px" }}
                  >
                    {weatherOptions.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Baseline Preview Modal */}
        {showBaselinePreview && baselineImageURL && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                maxWidth: "80%",
                maxHeight: "80%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <h3>Baseline Image Preview</h3>
              <img
                src={baselineImageURL}
                alt="Baseline Preview"
                style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
              />
              <button
                onClick={() => setShowBaselinePreview(false)}
                style={{
                  marginTop: "15px",
                  padding: "5px 10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Thermal Image Comparison */}
        {baselineImageURL && maintenanceImageURL && (
          <div
            style={{
              marginTop: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: "15px" }}>Thermal Image Comparison</h3>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              {/* Baseline */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <h4>Baseline Image</h4>
                <div
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "420px",
                    height: "400px",
                    margin: "0 auto",
                  }}
                >
                  <img src={baselineImageURL} alt="Baseline" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <p style={{ marginTop: "8px", fontSize: "14px", color: "#555" }}>
                  Date & Time: {baselineUploadDate || "N/A"} | Weather: {baselineWeather}
                </p>
              </div>

              {/* Thermal */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <h4>Thermal Image</h4>
                <div
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "420px",
                    height: "400px",
                    margin: "0 auto",
                  }}
                >
                  <img src={maintenanceImageURL} alt="Thermal" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <p style={{ marginTop: "8px", fontSize: "14px", color: "#555" }}>
                  Date & Time: {maintenanceUploadDate || "N/A"} | Weather: {maintenanceWeather}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save / Close */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button className="inspector-save-btn" onClick={handleSave}>Save</button>
          <button className="inspector-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
