import React from "react";

function ImageGallery({ images }) {
  return (
    <div className="gallery">
      <h2>Uploaded Images</h2>
      {images.length === 0 ? (
        <p>No images uploaded yet.</p>
      ) : (
        images.map((img) => (
          <div key={img.id} className="image-card">
            <p>
              Transformer ID: {img.transformerId} | Type: {img.type} | Condition:{" "}
              {img.type === "Baseline" ? img.condition : "-"}
            </p>
            <p>Uploader: {img.uploader}</p>
            <p>Uploaded: {img.uploadDate}</p>
            <p>File: {img.file.name}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default ImageGallery;
