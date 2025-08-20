import { useState, useEffect } from "react";

function TransformerForm({ onAdd, editing, onUpdate }) {
  const [formData, setFormData] = useState({ id: "", location: "", capacity: "" });

  useEffect(() => {
    if (editing) {
      setFormData(editing);
    }
  }, [editing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.location || !formData.capacity) {
      alert("Please fill all fields!");
      return;
    }

    if (editing) {
      onUpdate(formData);
    } else {
      onAdd({ ...formData, id: Date.now().toString() });
    }
    setFormData({ id: "", location: "", capacity: "" });
  };

  return (
    <div className="form">
      <h2>{editing ? "Edit Transformer" : "Add Transformer"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="capacity"
          placeholder="Capacity (kVA)"
          value={formData.capacity}
          onChange={handleChange}
          required
        />
        <button type="submit">{editing ? "Update" : "Add"}</button>
      </form>
    </div>
  );
}

export default TransformerForm;
