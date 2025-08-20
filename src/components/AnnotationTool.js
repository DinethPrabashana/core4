import { useRef, useState } from "react";

/**
 * Simple click-to-annotate tool:
 * - Click on image to add a marker (normalized x%, y%)
 * - Select marker in list to edit note & severity
 * - Emits onChange(annotations)
 */
function AnnotationTool({ image, annotations, onChange }) {
  const ref = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  const addMarker = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const marker = {
      id: "a_" + Date.now().toString(),
      x, y, radius: 3, // percent width
      severity: "Medium",
      note: "",
    };
    onChange([...(annotations || []), marker]);
    setSelectedId(marker.id);
  };

  const updateSelected = (patch) => {
    onChange(
      annotations.map((m) => (m.id === selectedId ? { ...m, ...patch } : m))
    );
  };

  const removeSelected = () => {
    if (!selectedId) return;
    onChange(annotations.filter((m) => m.id !== selectedId));
    setSelectedId(null);
  };

  const selected = annotations.find((m) => m.id === selectedId);

  return (
    <div className="annotator">
      <div className="image-stage" onClick={addMarker} ref={ref}>
        {image ? <img src={image.dataUrl} alt="annotate" /> : <div className="image-placeholder">No image</div>}
        {annotations.map((m) => (
          <div
            key={m.id}
            className={`marker ${selectedId === m.id ? "active" : ""}`}
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${m.radius}%`,
              height: `${m.radius}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(m.id);
            }}
            title={m.note || "(no note)"}
          />
        ))}
      </div>

      <div className="panel">
        <h4>Hotspots</h4>
        <ul className="marker-list">
          {annotations.map((m) => (
            <li
              key={m.id}
              className={selectedId === m.id ? "selected" : ""}
              onClick={() => setSelectedId(m.id)}
            >
              • {m.severity} @ ({m.x.toFixed(1)}%, {m.y.toFixed(1)}%)
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="marker-editor">
            <label>
              Severity:
              <select
                value={selected.severity}
                onChange={(e) => updateSelected({ severity: e.target.value })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>
            <label>
              Note:
              <textarea
                value={selected.note}
                onChange={(e) => updateSelected({ note: e.target.value })}
                rows={3}
                placeholder="E.g., hotspot near HV bushing"
              />
            </label>
            <label>
              Radius (%):
              <input
                type="number"
                min={1}
                max={20}
                value={selected.radius}
                onChange={(e) => updateSelected({ radius: Number(e.target.value) })}
              />
            </label>
            <div className="row">
              <button className="btn-delete" onClick={removeSelected}>Delete Marker</button>
            </div>
          </div>
        ) : (
          <p>Select a marker to edit details.</p>
        )}
      </div>
    </div>
  );
}

export default AnnotationTool;
