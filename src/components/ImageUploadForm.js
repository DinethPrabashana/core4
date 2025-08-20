import { useState } from "react";

function ImageUploadForm({ transformers, onUpload }) {
  const [formData, setFormData] = useState({
    transformerId: "",
    type: "Baseline",
    condition: "Sunny",
    uploader: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.transformerId || !formData.file || !formData.uploader) {
      alert("All fields are required!");
      return;
    }

    onUpload({
      ...formData,
      id: Date.now().toString(),
      uploadDate: new Date().toLocaleString(),
    });

    setFormData({
      transformerId: "",
      type: "Baseline",
      condition: "Sunny",
      uploader: "",
      file: null,
    });
  };

  return (
    <div className="form">
      <h2>Upload Thermal Image</h2>
      <form onSubmit={handleSubmit}>
        <select
          name="transformerId"
          value={formData.transformerId}
          onChange={handleChange}
          required
        >
          <option value="">Select Transformer</option>
          {transformers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.location} ({t.capacity} kVA)
            </option>
          ))}
        </select>

        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="Baseline">Baseline</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        {formData.type === "Baseline" && (
          <select name="condition" value={formData.condition} onChange={handleChange}>
            <option value="Sunny">Sunny</option>
            <option value="Cloudy">Cloudy</option>
            <option value="Rainy">Rainy</option>
          </select>
        )}

        <input
          type="text"
          name="uploader"
          placeholder="Uploader Name"
          value={formData.uploader}
          onChange={handleChange}
          required
        />

        <input type="file" name="file" onChange={handleChange} accept="image/*" required />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default ImageUploadForm;
