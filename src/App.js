// App.js
import React, { useState } from "react";
import corefourLogo from "./assets/corefour.jpg";
import placeholderImage from "./assets/transformer.jpg";

function App() {
  const [activePage, setActivePage] = useState("transformers");
  const [activeTab, setActiveTab] = useState("details");
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [selectedInspectionTransformer, setSelectedInspectionTransformer] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Transformers state
  const [transformers, setTransformers] = useState([]);
  const [nextTransformerId, setNextTransformerId] = useState(1);
  const [showTransformerModal, setShowTransformerModal] = useState(false);
  const [transformerForm, setTransformerForm] = useState({
    id: null,
    number: "",
    pole: "",
    region: "",
    type: "Bulk",
  });
  const [transformerImages, setTransformerImages] = useState({}); // { [transformerNumber]: [imageUrls] }

  // Inspections state
  const [inspections, setInspections] = useState([]);
  const [nextInspectionId, setNextInspectionId] = useState(1);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    id: null,
    branch: "",
    transformer: "",
    date: "",
    time: "",
  });

  // Search states
  const [searchFieldDetails, setSearchFieldDetails] = useState("number");
  const [searchQueryDetails, setSearchQueryDetails] = useState("");
  const [searchFieldInspection, setSearchFieldInspection] = useState("transformerNumber");
  const [searchQueryInspection, setSearchQueryInspection] = useState("");

  // Transformer handlers
  const handleTransformerInputChange = (e) => {
    setTransformerForm({ ...transformerForm, [e.target.name]: e.target.value });
  };

  const openTransformerModal = (transformer = null) => {
    if (transformer) {
      setTransformerForm({
        id: transformer.id,
        number: transformer.number,
        pole: transformer.pole,
        region: transformer.region,
        type: transformer.type,
      });
    } else {
      setTransformerForm({ id: null, number: "", pole: "", region: "", type: "Bulk" });
    }
    setShowTransformerModal(true);
  };

  const handleSaveTransformer = () => {
    if (transformerForm.id) {
      // Edit
      setTransformers(
        transformers.map((t) =>
          t.id === transformerForm.id ? { ...transformerForm } : t
        )
      );
    } else {
      // Add
      setTransformers([
        ...transformers,
        { ...transformerForm, id: nextTransformerId },
      ]);
      setNextTransformerId(nextTransformerId + 1);
    }
    setShowTransformerModal(false);
    setTransformerForm({ id: null, number: "", pole: "", region: "", type: "Bulk" });
  };

  const handleDeleteTransformer = (id) => {
    if (window.confirm("Are you sure you want to delete this transformer?")) {
      setTransformers(transformers.filter((t) => t.id !== id));
      // Also clean up images and inspections
      const transformerNumber = transformers.find((t) => t.id === id)?.number;
      if (transformerNumber) {
        const newImages = { ...transformerImages };
        delete newImages[transformerNumber];
        setTransformerImages(newImages);
      }
      setInspections(inspections.filter((i) => i.transformer !== transformerNumber));
    }
  };

  // Inspection handlers
  const handleInspectionInputChange = (e) => {
    setInspectionForm({ ...inspectionForm, [e.target.name]: e.target.value });
  };

  const openInspectionModal = (inspection = null, prefillTransformer = "") => {
    if (inspection) {
      setInspectionForm({
        id: inspection.id,
        branch: inspection.branch,
        transformer: inspection.transformer,
        date: inspection.date,
        time: inspection.time,
      });
    } else {
      setInspectionForm({
        id: null,
        branch: "",
        transformer: prefillTransformer,
        date: "",
        time: "",
      });
    }
    setShowInspectionModal(true);
  };

  const handleSaveInspection = () => {
    if (!inspectionForm.transformer) {
      alert("Please provide a transformer number.");
      return;
    }
    if (inspectionForm.id) {
      // Edit
      setInspections(
        inspections.map((i) =>
          i.id === inspectionForm.id ? { ...inspectionForm } : i
        )
      );
    } else {
      // Add
      setInspections([
        ...inspections,
        { ...inspectionForm, id: nextInspectionId },
      ]);
      setNextInspectionId(nextInspectionId + 1);
    }
    setShowInspectionModal(false);
    setInspectionForm({ id: null, branch: "", transformer: "", date: "", time: "" });
  };

  const handleDeleteInspection = (id) => {
    if (window.confirm("Are you sure you want to delete this inspection?")) {
      setInspections(inspections.filter((i) => i.id !== id));
    }
  };

  // Image upload handler
  const handleUploadImage = (e, transformerNumber) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTransformerImages((prev) => ({
        ...prev,
        [transformerNumber]: [...(prev[transformerNumber] || []), imageUrl],
      }));
    }
  };

  // Filtering for transformers
  const filteredTransformers = transformers.filter((t) => {
    if (!searchQueryDetails) return true;
    const value = t[searchFieldDetails]?.toString().toLowerCase();
    return value?.includes(searchQueryDetails.toLowerCase());
  });

  // Inspection rows
  const inspectionRows = transformers.map((t) => {
    const related = inspections.filter((i) => i.transformer === t.number);
    const last = related.length ? related[related.length - 1] : null;
    return {
      transformerNumber: t.number,
      inspectionNumber: related.length ? String(related.length) : "-",
      lastInspectionDate: last ? last.date : "-",
      maintenanceDate: "-",
      status: related.length ? "Scheduled" : "Pending",
    };
  });

  // Filtering for inspection rows
  const filteredInspectionRows = inspectionRows.filter((row) => {
    if (!searchQueryInspection) return true;
    const value = String(row[searchFieldInspection] ?? "").toLowerCase();
    return value.includes(searchQueryInspection.toLowerCase());
  });

  // View inspection details
  const viewInspectionDetails = (transformerNumber) => {
    const transformer = transformers.find((t) => t.number === transformerNumber);
    setSelectedInspectionTransformer(transformer);
    setActivePage("inspectionDetails");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Column - Sidebar */}
      <div
        style={{
          width: "11%",
          backgroundColor: "#02090fff",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          color: "white",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img
            src={corefourLogo}
            alt="CoreFour Logo"
            style={{ width: "100px", height: "100px", marginBottom: "5px" }}
          />
          <h2 style={{ fontSize: "30px", fontWeight: "bold" }}>CoreFour</h2>
        </div>

        <button
          style={{ padding: "15px", fontSize: "16px" }}
          onClick={() => setActivePage("transformers")}
        >
          Transformers
        </button>
        <button
          style={{ padding: "15px", fontSize: "16px" }}
          onClick={() => setActivePage("settings")}
        >
          Settings
        </button>
      </div>

      {/* Right Column - Main Content */}
      <div style={{ flexGrow: 1, padding: "20px" }}>
        {activePage === "transformers" && (
          <>
            {/* Tabs */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => setActiveTab("details")}
                style={{
                  padding: "10px 20px",
                  background: activeTab === "details" ? "#010007ff" : "#ddd",
                  color: activeTab === "details" ? "white" : "black",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Transformers
              </button>
              <button
                onClick={() => setActiveTab("inspection")}
                style={{
                  padding: "10px 20px",
                  background: activeTab === "inspection" ? "#010c01ff" : "#ddd",
                  color: activeTab === "inspection" ? "white" : "black",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Inspection
              </button>
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
              <>
                <button
                  onClick={() => openTransformerModal()}
                  style={{
                    padding: "10px 20px",
                    marginBottom: "20px",
                    backgroundColor: "#2b95dbff",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  + Add Transformer
                </button>

                {/* Search */}
                <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                  <select
                    value={searchFieldDetails}
                    onChange={(e) => setSearchFieldDetails(e.target.value)}
                    style={{ padding: "8px" }}
                  >
                    <option value="number">Transformer #</option>
                    <option value="pole">Pole #</option>
                    <option value="region">Region</option>
                    <option value="type">Type</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter search value..."
                    value={searchQueryDetails}
                    onChange={(e) => setSearchQueryDetails(e.target.value)}
                    style={{ padding: "8px", flex: "1" }}
                  />
                  <button
                    style={{
                      padding: "8px 16px",
                      background: "#83c650ff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    🔍 Search
                  </button>
                </div>

                {/* Selected Transformer */}
                {selectedTransformer && (
                  <div
                    style={{
                      padding: "15px",
                      marginBottom: "20px",
                      background: "#e8f4fc",
                      border: "1px solid #2b95dbff",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", gap: "15px" }}>
                      <div style={{ padding: "10px", border: "1px solid #2b95dbff", borderRadius: "6px", background: "#fff" }}>
                        <strong>Number:</strong>
                        <div>{selectedTransformer.number}</div>
                      </div>
                      <div style={{ padding: "10px", border: "1px solid #2b95dbff", borderRadius: "6px", background: "#fff" }}>
                        <strong>Pole:</strong>
                        <div>{selectedTransformer.pole}</div>
                      </div>
                      <div style={{ padding: "10px", border: "1px solid #2b95dbff", borderRadius: "6px", background: "#fff" }}>
                        <strong>Region:</strong>
                        <div>{selectedTransformer.region}</div>
                      </div>
                      <div style={{ padding: "10px", border: "1px solid #2b95dbff", borderRadius: "6px", background: "#fff" }}>
                        <strong>Type:</strong>
                        <div>{selectedTransformer.type}</div>
                      </div>
                    </div>

                    <img
                      src={placeholderImage}
                      alt="Transformer"
                      style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", marginLeft: "20px" }}
                    />

                    <button
                      onClick={() => setSelectedTransformer(null)}
                      style={{ alignSelf: "flex-start", padding: "5px 12px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginLeft: "15px" }}
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Transformers Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Transformer #</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Pole #</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Region</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Type</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransformers.map((t) => (
                      <tr key={t.id}>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.number}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.pole}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.region}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{t.type}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px", display: "flex", gap: "5px" }}>
                          <button
                            onClick={() => setSelectedTransformer(t)}
                            style={{ padding: "5px 10px", background: "#2b95dbff", color: "white", border: "none", borderRadius: "5px" }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openTransformerModal(t)}
                            style={{ padding: "5px 10px", background: "#ffc107", color: "white", border: "none", borderRadius: "5px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTransformer(t.id)}
                            style={{ padding: "5px 10px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "5px" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Inspection Tab */}
            {activeTab === "inspection" && (
              <>
                <button
                  onClick={() => openInspectionModal(null, "")}
                  style={{
                    padding: "10px 20px",
                    marginBottom: "20px",
                    backgroundColor: "#2b95dbff",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  + Add Inspection
                </button>

                {/* Search */}
                <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                  <select
                    value={searchFieldInspection}
                    onChange={(e) => setSearchFieldInspection(e.target.value)}
                    style={{ padding: "8px" }}
                  >
                    <option value="transformerNumber">Transformer #</option>
                    <option value="inspectionNumber">Inspection #</option>
                    <option value="lastInspectionDate">Last Inspection</option>
                    <option value="maintenanceDate">Maintenance Date</option>
                    <option value="status">Status</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter search value..."
                    value={searchQueryInspection}
                    onChange={(e) => setSearchQueryInspection(e.target.value)}
                    style={{ padding: "8px", flex: "1" }}
                  />
                  <button
                    style={{
                      padding: "8px 16px",
                      background: "#2b95dbff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    🔍 Search
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Transformer #</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Inspection #</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Last Inspection</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Maintenance Date</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Status</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInspectionRows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>
                          {transformers.length === 0
                            ? "No transformers added yet."
                            : "No matching records."}
                        </td>
                      </tr>
                    )}
                    {filteredInspectionRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.transformerNumber}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.inspectionNumber}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.lastInspectionDate}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.maintenanceDate}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.status}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          <button
                            onClick={() => viewInspectionDetails(row.transformerNumber)}
                            style={{ padding: "5px 10px", background: "#2b95dbff", color: "white", border: "none", borderRadius: "5px" }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {activePage === "inspectionDetails" && selectedInspectionTransformer && (
          <>
            <button
              onClick={() => {
                setActivePage("transformers");
                setActiveTab("inspection");
                setSelectedInspectionTransformer(null);
              }}
              style={{
                padding: "10px 20px",
                marginBottom: "20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              ← Back to Inspections
            </button>

            <h2>Inspection Details for Transformer #{selectedInspectionTransformer.number}</h2>

            <button
              onClick={() => openInspectionModal(null, selectedInspectionTransformer.number)}
              style={{
                padding: "10px 20px",
                marginBottom: "20px",
                backgroundColor: "#2b95dbff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              + Schedule New Inspection
            </button>

            {/* Inspections Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Branch</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Date</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Time</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inspections
                  .filter((i) => i.transformer === selectedInspectionTransformer.number)
                  .map((i) => (
                    <tr key={i.id}>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{i.branch}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{i.date}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{i.time}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px", display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => openInspectionModal(i)}
                          style={{ padding: "5px 10px", background: "#ffc107", color: "white", border: "none", borderRadius: "5px" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteInspection(i.id)}
                          style={{ padding: "5px 10px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "5px" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                {inspections.filter((i) => i.transformer === selectedInspectionTransformer.number).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>
                      No inspections scheduled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Thermal Images Section */}
            <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "20px", background: "#fff", marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "15px", color: "#333" }}>Thermal Images</h3>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: "1", minWidth: "250px" }}>
                  <div style={{ marginBottom: "15px", color: "#666" }}>
                    <span style={{ fontWeight: "bold" }}>Status:</span> Pending
                  </div>
                  <button
                    onClick={() => document.getElementById(`thermalUpload-${selectedInspectionTransformer.number}`).click()}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#2b95dbff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginBottom: "15px",
                    }}
                  >
                    Upload thermal image
                  </button>
                  <input
                    id={`thermalUpload-${selectedInspectionTransformer.number}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, selectedInspectionTransformer.number)}
                    style={{ display: "none" }}
                  />
                  <div style={{ marginBottom: "15px", color: "#666" }}>
                    <span style={{ fontWeight: "bold" }}>Weather Condition:</span>
                    <select
                      style={{ padding: "8px", marginLeft: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
                      onChange={(e) => console.log(e.target.value)} // Placeholder for weather condition handling
                    >
                      <option value="Sunny">Sunny</option>
                      <option value="Cloudy">Cloudy</option>
                      <option value="Rainy">Rainy</option>
                    </select>
                  </div>
                </div>
                <div style={{ flex: "2", minWidth: "300px" }}>
                  <div style={{ marginBottom: "15px", color: "#666" }}>
                    <span style={{ fontWeight: "bold" }}>Progress</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: "0" }}>
                    <li style={{ display: "flex", alignItems: "center", marginBottom: "10px", color: "#666" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ccc", marginRight: "10px" }}></span>
                      Thermal image upload <span style={{ color: "#999", marginLeft: "10px" }}>Pending</span>
                    </li>
                    <li style={{ display: "flex", alignItems: "center", marginBottom: "10px", color: "#666" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ccc", marginRight: "10px" }}></span>
                      AI Analysis <span style={{ color: "#999", marginLeft: "10px" }}>Pending</span>
                    </li>
                    <li style={{ display: "flex", alignItems: "center", marginBottom: "10px", color: "#666" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ccc", marginRight: "10px" }}></span>
                      Thermal image review <span style={{ color: "#999", marginLeft: "10px" }}>Pending</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                {(transformerImages[selectedInspectionTransformer.number] || []).map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Thermal Image ${idx + 1}`}
                    style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "5px", border: "1px solid #e0e0e0" }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {activePage === "settings" && <h1>Welcome to Settings</h1>}
      </div>

      {/* Transformer Modal */}
      {showTransformerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "400px" }}>
            <h2>{transformerForm.id ? "Edit Transformer" : "Add Transformer"}</h2>
            <input name="number" placeholder="Transformer Number" value={transformerForm.number} onChange={handleTransformerInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
            <input name="pole" placeholder="Pole Number" value={transformerForm.pole} onChange={handleTransformerInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
            <input name="region" placeholder="Region" value={transformerForm.region} onChange={handleTransformerInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
            <select name="type" value={transformerForm.type} onChange={handleTransformerInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }}>
              <option value="Bulk">Bulk</option>
              <option value="Distribution">Distribution</option>
            </select>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button onClick={() => setShowTransformerModal(false)} style={{ padding: "8px 16px", marginRight: "10px", background: "#ccc", border: "none", borderRadius: "5px" }}>Cancel</button>
              <button onClick={handleSaveTransformer} style={{ padding: "8px 16px", background: "#2b95dbff", color: "white", border: "none", borderRadius: "5px" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {showInspectionModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "400px" }}>
            <h2>{inspectionForm.id ? "Edit Inspection" : "Schedule Inspection"}</h2>
            <input name="branch" placeholder="Branch" value={inspectionForm.branch} onChange={handleInspectionInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
            <input name="transformer" placeholder="Transformer Number" value={inspectionForm.transformer} onChange={handleInspectionInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
            <input type="date" name="date" value={inspectionForm.date} onChange={handleInspectionInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
            <input type="time" name="time" value={inspectionForm.time} onChange={handleInspectionInputChange} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button onClick={() => setShowInspectionModal(false)} style={{ padding: "8px 16px", marginRight: "10px", background: "#ccc", border: "none", borderRadius: "5px" }}>Cancel</button>
              <button onClick={handleSaveInspection} style={{ padding: "8px 16px", background: "#2b95dbff", color: "white", border: "none", borderRadius: "5px" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;