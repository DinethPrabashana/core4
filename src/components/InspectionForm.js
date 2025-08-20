import { useState } from "react";

// utility: file -> base64
const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

function InspectionForm({ transformers, onCreate }) {
  const [form, setForm] = useState({
    transformerId: "",
    date: new Date().toISOString().slice(0, 10),
    inspector: "",
    status: "Pending",
    condition: "Sunny", // used to choose baseline
    notes: "",
    file: null, // maintenance image
  });

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm((f) => ({ ...f, [name]: files ? files[0] : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.transformerId || !form.inspector || !form.file) {
      alert("Transformer, inspector and maintenance image are required.");
      return;
    }
    const dataUrl = await readFileAsDataURL(form.file);

    // pass complete inspection payload upward
    onCreate({
      id: Date.now().toString(),
      transformerId: form.transformerId,
      date: form.date,
      inspector: form.inspector,
      status: form.status,
      condition: form.condition,
      notes: form.notes,
      maintenanceImage: {
        id: "m_" + Date.now().toString(),
        name: form.file.name,
        dataUrl,
      },
      annotations: [], // starts empty
    });

    setForm({
      transformerId: "",
      date: new Date().toISOString().slice(0, 10),
      inspector: "",
      status: "Pending",
      condition: "Sunny",
      notes: "",
      file: null,
    });
  };

  return (
    <div className="form">
      <h2>Create Inspection</h2>
      <form onSubmit={onSubmit}>
        <select
          name="transformerId"
          value={form.transformerId}
          onChange={onChange}
          required
        >
          <option value="">Select Transformer</option>
          {transformers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.location} ({t.capacity} kVA)
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={onChange}
          required
        />

        <input
          type="text"
          name="inspector"
          placeholder="Inspector name"
          value={form.inspector}
          onChange={onChange}
          required
        />

        <select name="status" value={form.status} onChange={onChange}>
          <option>Pending</option>
          <option>In Review</option>
          <option>Completed</option>
        </select>

        {/* used to pick baseline */}
        <select name="condition" value={form.condition} onChange={onChange}>
          <option>Sunny</option>
          <option>Cloudy</option>
          <option>Rainy</option>
        </select>

        <textarea
          name="notes"
          placeholder="Notes"
          value={form.notes}
          onChange={onChange}
          rows={2}
        />

        <input type="file" accept="image/*" name="file" onChange={onChange} required />

        <button type="submit">Create Inspection</button>
      </form>
    </div>
  );
}

export default InspectionForm;
