import React from "react";

function ComparisonViewer({ baselineImage, maintenanceImage }) {
  return (
    <div className="viewer">
      <div className="image-box">
        <div className="image-title">Baseline</div>
        {baselineImage ? (
          <img src={baselineImage.dataUrl} alt="baseline" />
        ) : (
          <div className="image-placeholder">No matching baseline</div>
        )}
      </div>
      <div className="image-box">
        <div className="image-title">Maintenance</div>
        {maintenanceImage ? (
          <img src={maintenanceImage.dataUrl} alt="maintenance" />
        ) : (
          <div className="image-placeholder">No maintenance image</div>
        )}
      </div>
    </div>
  );
}

export default ComparisonViewer;
