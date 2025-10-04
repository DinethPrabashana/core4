import React, { useState, useRef, useEffect } from "react";
import '../style/MaintenanceImageModal.css';

export default function MaintenanceImageModal({ imageURL, anomalies = [], onClose }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  // --- Zoom Handlers ---
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  
  const handleResetZoom = () => {
    setZoom(1);
    if (containerRef.current && imgRef.current) {
      const container = containerRef.current;
      const img = imgRef.current;
      const centerX = (container.offsetWidth - img.offsetWidth) / 2;
      const centerY = (container.offsetHeight - img.offsetHeight) / 2;
      setOffset({ x: centerX, y: centerY });
    }
  };

  // --- Mouse Handlers ---
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setStartDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    if (!containerRef.current || !imgRef.current) return;

    const container = containerRef.current;
    const img = imgRef.current;

    let newX = e.clientX - startDrag.x;
    let newY = e.clientY - startDrag.y;

    const maxX = 0;
    const maxY = 0;
    const minX = Math.min(container.offsetWidth - img.offsetWidth * zoom, 0);
    const minY = Math.min(container.offsetHeight - img.offsetHeight * zoom, 0);

    newX = Math.max(Math.min(newX, maxX), minX);
    newY = Math.max(Math.min(newY, maxY), minY);

    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => setDragging(false);

  // Center image initially
  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;
    const container = containerRef.current;
    const img = imgRef.current;
    const centerX = (container.offsetWidth - img.offsetWidth) / 2;
    const centerY = (container.offsetHeight - img.offsetHeight) / 2;
    setOffset({ x: centerX, y: centerY });
  }, [imageURL]);

  return (
    <div className="modal-overlay">
      <div
        className="modal-card modal-large"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <h3>Maintenance Image Viewer</h3>

        {/* Image container */}
        <div
          ref={containerRef}
          className="image-box"
          onMouseDown={handleMouseDown}
        >
          <img
            ref={imgRef}
            src={imageURL}
            alt="Maintenance"
            className="maintenance-image"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "top left",
              transition: dragging ? "none" : "transform 0.1s ease",
            }}
          />
          {anomalies.map((box, idx) => (
            <div
              key={idx}
              className="anomaly-box"
              style={{
                left: `${box.x * zoom + offset.x}px`,
                top: `${box.y * zoom + offset.y}px`,
                width: `${box.width * zoom}px`,
                height: `${box.height * zoom}px`,
              }}
            />
          ))}
        </div>

        {/* Controls below image */}
        <div className="image-controls">
          <button className="control-btn" onClick={handleZoomIn}>Zoom In</button>
          <button className="control-btn" onClick={handleResetZoom}>Reset Zoom</button>
          <button className="control-btn">Annotate (dummy)</button>
        </div>

        <button
          onClick={onClose}
          className="inspection-cancel-btn close-btn"
        >
          Close
        </button>
      </div>
    </div>
  );
}
