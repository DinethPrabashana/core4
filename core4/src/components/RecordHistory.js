import React, { useEffect, useState, useRef } from "react";
import "../style/RecordHistory.css";

export default function RecordHistory({ transformer, inspection = null, onClose }) {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inspectionNumber, setInspectionNumber] = useState(null);

  // Fetch records for transformer (and optionally inspection)
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const base = `http://localhost:8000/api/records`;
        const url = inspection ? `${base}?transformer_id=${transformer.id}&inspection_id=${inspection.id}` : `${base}?transformer_id=${transformer.id}`;
        const res = await fetch(url);
        const data = await res.json();
        setRecords(data);
        // Auto-select the latest record for convenience
        if (Array.isArray(data) && data.length > 0) {
          setSelectedRecord(data[0]);
        }
      } catch (e) {
        console.error(e);
        alert('Failed to load maintenance records.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [transformer.id, inspection?.id]);

  // Compute human-friendly inspection number if inspection provided
  useEffect(() => {
    const computeInspectionNumber = async () => {
      if (!inspection) return;
      try {
        const res = await fetch('http://localhost:8000/api/inspections');
        if (!res.ok) throw new Error('Failed fetch inspections');
        const all = await res.json();
        const forTransformer = all.filter(i => i.transformer === transformer.id).sort((a, b) => a.id - b.id);
        const idx = forTransformer.findIndex(i => i.id === inspection.id);
        if (idx >= 0) {
          setInspectionNumber(`${transformer.number}-INSP${idx + 1}`);
        } else {
          setInspectionNumber(`Inspection ${inspection.id}`);
        }
      } catch (e) {
        console.warn('Could not compute inspection number', e);
        setInspectionNumber(`Inspection ${inspection.id}`);
      }
    };
    computeInspectionNumber();
  }, [inspection, transformer.id, transformer.number]);

  const openRecord = (rec) => setSelectedRecord(rec);

  const deleteRecord = async (rec) => {
    if (!window.confirm('Delete this maintenance record? This action cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/records/${rec.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== rec.id));
        if (selectedRecord && selectedRecord.id === rec.id) setSelectedRecord(null);
      } else {
        const err = await res.json();
        alert('Failed to delete: ' + (err.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Delete failed', e);
      alert('Network error deleting record');
    }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'stretch', overflow: 'auto' }}>
      <div className="modal-card record-history-modal">
        <div className="record-history-header">
          <div className="record-history-title">
            <h2>Maintenance Records</h2>
            <div className="record-subtitle">
              <span className="pill">{transformer.number}</span>
              {inspection && (
                <span className="pill pill-muted">{inspectionNumber || '...'}</span>
              )}
            </div>
          </div>
          <div className="record-history-actions">
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="record-history-body">
            <div className="record-list">
              <div className="section-title">Saved Records</div>
              {records.length === 0 ? (
                <div className="empty-state">No records found{inspection ? ' for this inspection.' : '.'}</div>
              ) : (
                <div className="table-wrap">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date/Time</th>
                        <th>Saved At</th>
                        <th>Engineer</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Anomalies</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => {
                        const anomaliesArr = Array.isArray(r.anomalies) ? r.anomalies : (r.anomalies && typeof r.anomalies === 'object' ? Object.values(r.anomalies) : []);
                        const anomalyCount = anomaliesArr.filter(a => !a.deleted).length;
                        const savedAtRaw = r.created_at || r.updated_at || r.record_timestamp;
                        let savedAt = savedAtRaw;
                        try {
                          if (savedAtRaw && /\d/.test(savedAtRaw)) {
                            const d = new Date(savedAtRaw);
                            if (!isNaN(d.getTime())) savedAt = d.toLocaleString();
                          }
                        } catch (_) {}

                        const statusClass = (r.status || '').toLowerCase().replace(/\s+/g, '-');
                        return (
                          <tr key={r.id}>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.id}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.record_timestamp}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{savedAt || '—'}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.engineer_name || 'N/A'}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.location || transformer.location || 'N/A'}</td>
                            <td onClick={() => openRecord(r)} className="cell-link"><span className={`status-badge ${statusClass}`}>{r.status || 'N/A'}</span></td>
                            <td onClick={() => openRecord(r)} className="cell-link">{anomalyCount}</td>
                            <td>
                              <div className="row-actions">
                                <button className="btn-link" onClick={() => openRecord(r)}>View</button>
                                <button className="btn-danger" onClick={() => deleteRecord(r)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="record-details">
              <div className="section-title">Details</div>
              {selectedRecord ? (
                <div className="details-card">
                  <div className="details-header">
                    <div className="details-title">
                      <span className="muted">Record</span> #{selectedRecord.id}
                    </div>
                    <div className="row-actions">
                      <button className="btn-danger" onClick={() => deleteRecord(selectedRecord)}>Delete</button>
                    </div>
                  </div>
                  <div className="details-meta">
                    <div>
                      <div className="label">Saved At</div>
                      <div className="value monospace">{(selectedRecord.created_at && new Date(selectedRecord.created_at).toLocaleString()) || selectedRecord.record_timestamp || '—'}</div>
                    </div>
                    <div>
                      <div className="label">Engineer</div>
                      <div className="value">{selectedRecord.engineer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="label">Location</div>
                      <div className="value">{selectedRecord.location || transformer.location || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="label">Status</div>
                      <div className="value"><span className={`status-badge ${(selectedRecord.status || '').toLowerCase().replace(/\s+/g,'-')}`}>{selectedRecord.status || 'N/A'}</span></div>
                    </div>
                    <div>
                      <div className="label">Anomalies</div>
                      <div className="value monospace">{Array.isArray(selectedRecord.anomalies) ? selectedRecord.anomalies.filter(a => !a.deleted).length : 0}</div>
                    </div>
                  </div>

                  <div className="details-section">
                    <div className="section-subtitle">Anomalies</div>
                    {(() => {
                      const arr = Array.isArray(selectedRecord.anomalies) ? selectedRecord.anomalies : (selectedRecord.anomalies && typeof selectedRecord.anomalies === 'object' ? Object.values(selectedRecord.anomalies) : []);
                      const filtered = arr.filter(a => !a.deleted);
                      return filtered.length > 0 ? (
                      <div className="table-wrap">
                        <table className="records-table compact">
                          <thead>
                            <tr>
                               <th>#</th>
                               <th>Type</th>
                               <th>Severity</th>
                               <th>Comment</th>
                               <th>Position</th>
                               <th>Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((a, idx) => (
                              <tr key={a.id || idx}>
                                <td>{idx + 1}</td>
                                <td>{a.classification || 'N/A'}</td>
                                <td><span className={`severity-pill ${(a.severity || '').toLowerCase()}`}>{a.severity || 'N/A'}</span></td>
                                <td>{a.comment ? a.comment : '—'}</td>
                                <td>({Math.round(a.x)}, {Math.round(a.y)})</td>
                                <td>{Math.round(a.w)}x{Math.round(a.h)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      ) : (
                        <div className="empty-sub">No anomalies.</div>
                      );
                    })()}
                  </div>

                  {selectedRecord.annotated_image && (
                    <ZoomAnnotatedImage
                      src={selectedRecord.annotated_image}
                      anomalies={(() => {
                        const arr = Array.isArray(selectedRecord.anomalies)
                          ? selectedRecord.anomalies
                          : (selectedRecord.anomalies && typeof selectedRecord.anomalies === 'object' ? Object.values(selectedRecord.anomalies) : []);
                        return arr.filter(a => !a.deleted);
                      })()}
                    />
                  )}

                  <div className="details-section">
                    <div className="section-subtitle">Readings</div>
                    <pre className="code-block">{JSON.stringify(selectedRecord.readings || {}, null, 2)}</pre>
                  </div>

                  <div className="details-section two-col">
                    <div>
                      <div className="section-subtitle">Recommended Action</div>
                      <div className="text-block">{selectedRecord.recommended_action || '—'}</div>
                    </div>
                    <div>
                      <div className="section-subtitle">Notes</div>
                      <div className="text-block">{selectedRecord.notes || '—'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">Select a record to view details.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ZoomAnnotatedImage({ src, anomalies = [] }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // On image load, compute natural size and fit-to-width
  const onImgLoad = () => {
    const w = imgRef.current?.naturalWidth || 0;
    const h = imgRef.current?.naturalHeight || 0;
    setNatural({ w, h });
    fitToWidth(w);
  };

  const fitToWidth = (natW = natural.w) => {
    const cw = containerRef.current?.clientWidth || natW || 1;
    const fit = Math.max(0.1, Math.min(3, cw / (natW || 1)));
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomBy = (delta, pivot = null) => {
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    if (!pivot) {
      setZoom(newZoom);
      return;
    }
    // Keep pivot point stable while zooming
    const rect = containerRef.current.getBoundingClientRect();
    const px = pivot.clientX - rect.left - pan.x;
    const py = pivot.clientY - rect.top - pan.y;
    const k = newZoom / zoom;
    const nx = pan.x - (px * (k - 1));
    const ny = pan.y - (py * (k - 1));
    setPan({ x: nx, y: ny });
    setZoom(newZoom);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    zoomBy(delta, e);
  };

  const onMouseDown = (e) => {
    setPanning(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!panning) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onMouseUp = () => setPanning(false);
  const onMouseLeave = () => setPanning(false);

  // Compute severity color
  const colorFor = (sev) => {
    const s = (sev || '').toLowerCase();
    if (s.includes('urgent') || s.includes('faulty')) return '#e53935';
    if (s.includes('potential')) return '#fb8c00';
    if (s.includes('ok') || s.includes('normal')) return '#43a047';
    return '#1976d2';
  };

  return (
    <div className="annotated-wrap">
      <div className="zoom-toolbar">
        <button className="btn" onClick={() => zoomBy(1/1.1)}>−</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="btn" onClick={() => zoomBy(1.1)}>+</button>
        <div className="spacer" />
        <button className="btn" onClick={resetView}>Reset</button>
        <button className="btn" onClick={() => fitToWidth()}>Fit</button>
      </div>
      <div
        className="zoom-viewer"
        ref={containerRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div
          className="zoom-inner"
          style={{
            width: natural.w || 'auto',
            height: natural.h || 'auto',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          <img ref={imgRef} src={src} alt="Annotated" onLoad={onImgLoad} style={{ width: natural.w || 'auto', height: 'auto', display: 'block' }} />
          <div className="overlay-layer" style={{ width: natural.w, height: natural.h }}>
            {anomalies.map((a, idx) => (
              <div
                key={(a.id || 'ann') + '_' + idx}
                className="bbox"
                title={`#${idx + 1} ${a.classification || ''} • ${a.severity || ''}${a.comment ? ' • ' + a.comment : ''}`}
                style={{
                  left: a.x,
                  top: a.y,
                  width: a.w,
                  height: a.h,
                  borderColor: colorFor(a.severity)
                }}
              >
                <span className="bbox-label" style={{ backgroundColor: colorFor(a.severity) }}>
                  {a.classification || 'Anomaly'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hint">Tip: Scroll to zoom, drag to pan.</div>
    </div>
  );
}
