import React from "react";
import axios from "axios";
import "../style/SettingsPage.css";

export default function SettingsPage({ onClearData }) {
  const downloadTextFile = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTransformers = () => {
    axios.get("http://localhost:8080/api/transformers")
      .then(res => {
        const transformers = res.data;
        if (!transformers.length) return alert("No transformer data to export!");
        const content = transformers.map(t => 
          `ID: ${t.id}\nNumber: ${t.number}\nPole: ${t.pole}\nRegion: ${t.region}\nType: ${t.type}\nLocation: ${t.location}\nWeather: ${t.weather}\nBaseline Upload Date: ${t.baselineUploadDate || "N/A"}\n\n`
        ).join("");
        downloadTextFile("transformers.txt", content);
      })
      .catch(err => console.error("Error exporting transformers:", err));
  };

  const handleExportInspections = () => {
    axios.get("http://localhost:8080/api/inspections")
      .then(res => {
        const inspections = res.data;
        if (!inspections.length) return alert("No inspection data to export!");
        axios.get("http://localhost:8080/api/transformers")
          .then(resTransformers => {
            const transformers = resTransformers.data;
            const content = inspections.map(i => {
              const transformerNumber = transformers.find(t => t.id === i.transformer.id)?.number || "Unknown";
              return `ID: ${i.id}\nTransformer: ${transformerNumber}\nDate: ${i.date}\nInspector: ${i.inspector}\nNotes: ${i.notes}\nStatus: ${i.progressStatus || "Pending"}\n\n`;
            }).join("");
            downloadTextFile("inspections.txt", content);
          });
      })
      .catch(err => console.error("Error exporting inspections:", err));
  };

  const handleExportTransformerImagesMeta = () => {
    axios.get("http://localhost:8080/api/transformers")
      .then(res => {
        const transformers = res.data;
        if (!transformers.length) return alert("No transformer data found!");
        const content = transformers.map(t =>
          `Transformer: ${t.number}\nBaseline Image Present: ${!!t.baselineImagePath}\nBaseline Upload Date: ${t.baselineUploadDate || "N/A"}\nWeather: ${t.weather}\n\n`
        ).join("");
        downloadTextFile("transformer_images_meta.txt", content);
      })
      .catch(err => console.error("Error exporting transformer images metadata:", err));
  };

  const handleExportInspectionImagesMeta = () => {
    axios.get("http://localhost:8080/api/inspections")
      .then(res => {
        const inspections = res.data;
        if (!inspections.length) return alert("No inspection data found!");
        axios.get("http://localhost:8080/api/transformers")
          .then(resTransformers => {
            const transformers = resTransformers.data;
            const content = inspections.map(i => {
              const transformerNumber = transformers.find(t => t.id === i.transformer.id)?.number || "Unknown";
              return `Inspection ID: ${i.id}\nTransformer: ${transformerNumber}\nMaintenance Image Present: ${!!i.maintenanceImagePath}\nUpload Date: ${i.maintenanceUploadDate || "N/A"}\nWeather: ${i.maintenanceWeather || "N/A"}\nStatus: ${i.progressStatus || "Pending"}\n\n`;
            }).join("");
            downloadTextFile("inspection_images_meta.txt", content);
          });
      })
      .catch(err => console.error("Error exporting inspection images metadata:", err));
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <button className="settings-btn blue" onClick={handleExportTransformers}>
        Export Transformers
      </button>

      <button className="settings-btn green" onClick={handleExportInspections}>
        Export Inspections
      </button>

      <button className="settings-btn purple" onClick={handleExportTransformerImagesMeta}>
        Export Transformer Images Metadata
      </button>

      <button className="settings-btn orange" onClick={handleExportInspectionImagesMeta}>
        Export Inspection Images Metadata
      </button>

      <button className="settings-btn red" onClick={onClearData}>
        Clear All Data
      </button>
    </div>
  );
}