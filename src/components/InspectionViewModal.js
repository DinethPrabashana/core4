import React, { useState, useEffect } from "react";
import '../style/InspectionViewModal.css';
import ThermalImageComparison from "./ThermalImageComparison";
import ErrorLog from "./ErrorLog";
import ErrorRuleset from "./ErrorRuleSet";

export default function InspectionViewModal({ inspection, transformers, onClose, updateInspection, updateTransformer }) {
  const transformer = transformers.find(t => t.id === inspection.transformer);
  const uploader = "Admin";

  // --- Lift threshold state from ErrorRuleSet ---
  const [threshold, setThreshold] = useState(0.5);

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

  // --- Track completion ---
  const [isCompleted, setIsCompleted] = useState(inspection.status === "Completed");

  // --- Local anomalies for immediate rendering ---
  const [localAnomalies, setLocalAnomalies] = useState(inspection.anomalies || []);

  // --- Complete button handler (Start Analysis) ---
const handleComplete = async () => {
  const boxes = [
    { x: 50, y: 40, width: 100, height: 80 },
    { x: 200, y: 120, width: 60, height: 60 }
  ];

  setLocalAnomalies(boxes);

  try {
    const formData = new FormData();
    formData.append("threshold", threshold); // must be a string or number
    if (maintenanceImage instanceof File) {      // check it's a File
      formData.append("image", maintenanceImage);
    }

    const response = await fetch("http://127.0.0.1:32003/analyze", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Server error:", text);
      return;
    }

    const result = await response.json();
    console.log("AI Analysis Result:", result);
  } catch (err) {
    console.error("Error calling AI server:", err);
  }

  // Update inspection status
  const updatedInspection = {
    ...inspection,
    status: "Completed",
    inspectedDate: inspection.date,
    date: null,
    progressStatus: {
      thermalUpload: "Completed",
      aiAnalysis: "Completed",
      review: "Completed"
    },
    anomalies: boxes
  };

  setProgressStatus(updatedInspection.progressStatus);
  setIsCompleted(true);

  if (updateInspection) updateInspection(updatedInspection);
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
    setMaintenanceImage(file); // store File object directly
    setLocalMaintenanceChanged(true);
    setProgressStatus({
      thermalUpload: "Completed",
      aiAnalysis: "In Progress",
      review: "In Progress"
    });
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
        progressStatus,
        inspectedDate: isCompleted ? inspection.date : inspection.inspectedDate,
        status: isCompleted ? "Completed" : inspection.status,
        anomalies: localAnomalies
      });
    }
    onClose();
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

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h1 className="modal-title">Thermal Image</h1>

        {/* Transformer Info + Progress */}
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

        {/* Baseline + Thermal */}
        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Baseline Image</h3>
            <div className="weather-select">
              <label>
                Weather:
                <select value={baselineWeather} onChange={e => setBaselineWeather(e.target.value)} disabled={!baselineImage}>
                  {["Sunny", "Rainy", "Cloudy"].map(w => <option key={w} value={w}>{w}</option>)}
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
                {["Sunny", "Rainy", "Cloudy"].map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
          </div>
        </div>

        {baselineImageURL && maintenanceImageURL && (
          <ThermalImageComparison
            baselineImageURL={baselineImageURL}
            maintenanceImageURL={maintenanceImageURL}
            baselineUploadDate={baselineUploadDate}
            baselineWeather={baselineWeather}
            maintenanceWeather={maintenanceWeather}
            inspectionDate={inspection.date}
            uploader={uploader}
            onComplete={handleComplete}
            anomalies={localAnomalies}
          />
        )}

        <ErrorLog anomalies={localAnomalies || []} />
        {/* Pass threshold state to ErrorRuleset */}
        <ErrorRuleset threshold={threshold} setThreshold={setThreshold} />

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
