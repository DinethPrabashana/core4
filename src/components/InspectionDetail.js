import React from "react";
import ComparisonViewer from "./ComparisonViewer";
import AnnotationTool from "./AnnotationTool";

/**
 * Shows: meta, comparison, annotation tool, and printable maintenance record.
 */
function InspectionDetail({
  inspection,
  transformer,
  baselineImage, // chosen by condition
  onUpdateAnnotations,
  onPrintRecord
}) {
  if (!inspection) return null;

  return (
    <div className="detail">
      <h2>Inspection #{inspection.id}</h2>
      <div className="detail-grid">
        <div className="card">
          <h3>Meta</h3>
          <p><strong>Transformer:</strong> {transformer ? `${transformer.location} (${transformer.capacity} kVA)` : inspection.transformerId}</p>
          <p><strong>Date:</strong> {inspection.date}</p>
          <p><strong>Inspector:</strong> {inspection.inspector}</p>
          <p><strong>Status:</strong> {inspection.status}</p>
          <p><strong>Condition (baseline match):</strong> {inspection.condition}</p>
          <p><strong>Notes:</strong> {inspection.notes || "-"}</p>
          <button onClick={() => onPrintRecord(inspection.id)}>Open Maintenance Record</button>
        </div>

        <div className="card">
          <h3>Side-by-side</h3>
          <ComparisonViewer
            baselineImage={baselineImage || null}
            maintenanceImage={inspection.maintenanceImage}
          />
        </div>

        <div className="card">
          <h3>Annotate Hotspots (Maintenance)</h3>
          <AnnotationTool
            image={inspection.maintenanceImage}
            annotations={inspection.annotations || []}
            onChange={(anns) => onUpdateAnnotations(inspection.id, anns)}
          />
        </div>
      </div>
    </div>
  );
}

export default InspectionDetail;
