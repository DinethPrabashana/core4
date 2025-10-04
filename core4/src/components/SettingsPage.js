import React from "react";
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
    const transformers = JSON.parse(localStorage.getItem("transformers") || "[]");
    if (!transformers.length) return alert("No transformer data to export!");
    const content = transformers.map(t => 
      `ID: ${t.id}\nNumber: ${t.number}\nPole: ${t.pole}\nRegion: ${t.region}\nType: ${t.type}\nLocation: ${t.location}\nWeather: ${t.weather}\nBaseline Upload Date: ${t.baselineUploadDate || "N/A"}\n\n`
    ).join("");
    downloadTextFile("transformers.txt", content);
  };

  const handleExportInspections = () => {
    const inspections = JSON.parse(localStorage.getItem("inspections") || "[]");
    if (!inspections.length) return alert("No inspection data to export!");
    const transformers = JSON.parse(localStorage.getItem("transformers") || "[]");
    const content = inspections.map(i => {
      const transformerNumber = transformers.find(t => t.id === i.transformer)?.number || "Unknown";
      return `ID: ${i.id}\nTransformer: ${transformerNumber}\nDate: ${i.date}\nInspector: ${i.inspector}\nNotes: ${i.notes}\nStatus: ${i.status || "Pending"}\n\n`;
    }).join("");
    downloadTextFile("inspections.txt", content);
  };

  const handleExportTransformerImagesMeta = () => {
    const transformers = JSON.parse(localStorage.getItem("transformers") || "[]");
    if (!transformers.length) return alert("No transformer data found!");
    const content = transformers.map(t =>
      `Transformer: ${t.number}\nBaseline Image Present: ${!!t.baselineImage}\nBaseline Upload Date: ${t.baselineUploadDate || "N/A"}\nWeather: ${t.weather}\n\n`
    ).join("");
    downloadTextFile("transformer_images_meta.txt", content);
  };

  const handleExportInspectionImagesMeta = () => {
    const inspections = JSON.parse(localStorage.getItem("inspections") || "[]");
    const transformers = JSON.parse(localStorage.getItem("transformers") || "[]");
    if (!inspections.length) return alert("No inspection data found!");
    const content = inspections.map(i => {
      const transformerNumber = transformers.find(t => t.id === i.transformer)?.number || "Unknown";
      return `Inspection ID: ${i.id}\nTransformer: ${transformerNumber}\nMaintenance Image Present: ${!!i.maintenanceImage}\nUpload Date: ${i.maintenanceUploadDate || "N/A"}\nWeather: ${i.maintenanceWeather || "N/A"}\nStatus: ${i.status || "Pending"}\n\n`;
    }).join("");
    downloadTextFile("inspection_images_meta.txt", content);
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
        Clear Local Storage
      </button>
    </div>
  );
}
