import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";
import TransformerList from "./components/TransformerList";
import TransformerModal from "./components/TransformerModal";
import InspectionList from "./components/InspectionList";
import InspectionModal from "./components/InspectionModal";
import InspectionViewModal from "./components/InspectionViewModal";
import TransformerInspectionsPage from "./components/TransformerInspectionsPage";
import SettingsPage from "./components/SettingsPage";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("page1");
  const [activeTab, setActiveTab] = useState("details");

  const [transformers, setTransformers] = useState([]);
  const [filteredTransformers, setFilteredTransformers] = useState([]);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [showTransformerModal, setShowTransformerModal] = useState(false);
  const [transformerForm, setTransformerForm] = useState({
    id: null,
    number: "",
    pole: "",
    region: "",
    type: "Bulk",
    baselineImage: null,
    baselineUploadDate: null,
    weather: "",
    location: "",
  });
  const [searchFieldDetails, setSearchFieldDetails] = useState("number");
  const [searchQueryDetails, setSearchQueryDetails] = useState("");

  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [showViewInspectionModal, setShowViewInspectionModal] = useState(false);
  const [viewInspectionData, setViewInspectionData] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({
    transformer: "",
    date: "",
    inspector: "",
    notes: "",
    maintenanceImage: null,
    maintenanceUploadDate: null,
    maintenanceWeather: "Sunny",
  });
  const [searchFieldInspection, setSearchFieldInspection] = useState("");
  const [searchQueryInspection, setSearchQueryInspection] = useState("");

  // Full-page inspection view
  const [showTransformerInspectionsPage, setShowTransformerInspectionsPage] = useState(false);
  const [selectedTransformerForPage, setSelectedTransformerForPage] = useState(null);

  // Fetch transformers and inspections on mount
  useEffect(() => {
    axios.get("http://localhost:8080/api/transformers")
      .then(res => {
        setTransformers(res.data);
        setFilteredTransformers(res.data);
      })
      .catch(err => console.error("Error fetching transformers:", err));

    axios.get("http://localhost:8080/api/inspections")
      .then(res => {
        setInspections(res.data);
        setFilteredInspections(res.data);
      })
      .catch(err => console.error("Error fetching inspections:", err));
  }, []);

  // Filtering transformers
  useEffect(() => {
    setFilteredTransformers(
      transformers.filter(t => {
        if (!searchQueryDetails) return true;
        const value = t[searchFieldDetails]?.toString().toLowerCase() || "";
        return value.includes(searchQueryDetails.toLowerCase());
      })
    );
  }, [searchQueryDetails, searchFieldDetails, transformers]);

  // Filtering inspections
  useEffect(() => {
    setFilteredInspections(
      inspections.filter(i => {
        if (!searchQueryInspection) return true;
        const value =
          searchFieldInspection === "transformer"
            ? transformers.find(t => t.id === i.transformer.id)?.number?.toString().toLowerCase() || ""
            : i[searchFieldInspection]?.toString().toLowerCase() || "";
        return value.includes(searchQueryInspection.toLowerCase());
      })
    );
  }, [searchQueryInspection, searchFieldInspection, inspections, transformers]);

  // Transformer handlers
  const handleTransformerChange = (e) => {
    const { name, value, files } = e.target;
    setTransformerForm({
      ...transformerForm,
      [name]: files ? files[0] : value,
    });
  };

  const openTransformerModal = (t = null) => {
    if (t) setTransformerForm({ ...t, baselineImage: null });
    else setTransformerForm({ id: null, number: "", pole: "", region: "", type: "Bulk", baselineImage: null, baselineUploadDate: null, weather: "", location: "" });
    setShowTransformerModal(true);
  };

  const handleAddTransformer = () => {
    const transformerData = {
      number: transformerForm.number,
      pole: transformerForm.pole,
      region: transformerForm.region,
      type: transformerForm.type,
      location: transformerForm.location,
      weather: transformerForm.weather,
    };

    const form = new FormData();
    if (transformerForm.baselineImage instanceof File) {
      form.append("file", transformerForm.baselineImage);
      form.append("weather", transformerForm.weather);
    }

    if (transformerForm.id) {
      // Update transformer
      axios.put(`http://localhost:8080/api/transformers/${transformerForm.id}`, transformerData)
        .then(() => {
          if (form.has("file")) {
            axios.post(`http://localhost:8080/api/transformers/${transformerForm.id}/upload-baseline`, form, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
          axios.get("http://localhost:8080/api/transformers").then(res => {
            setTransformers(res.data);
            setFilteredTransformers(res.data);
          });
        })
        .catch(err => console.error("Error updating transformer:", err));
    } else {
      // Create transformer
      axios.post("http://localhost:8080/api/transformers", transformerData)
        .then(res => {
          const newId = res.data.id;
          if (form.has("file")) {
            axios.post(`http://localhost:8080/api/transformers/${newId}/upload-baseline`, form, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
          axios.get("http://localhost:8080/api/transformers").then(res => {
            setTransformers(res.data);
            setFilteredTransformers(res.data);
          });
        })
        .catch(err => console.error("Error creating transformer:", err));
    }
    setShowTransformerModal(false);
    setTransformerForm({ id: null, number: "", pole: "", region: "", type: "Bulk", baselineImage: null, baselineUploadDate: null, weather: "", location: "" });
  };

  // Inspection handlers
  const handleInspectionChange = (e) => {
    setInspectionForm({ ...inspectionForm, [e.target.name]: e.target.value });
  };

  const handleScheduleInspection = () => {
    const transformerId = parseInt(inspectionForm.transformer, 10);
    const newInspection = {
      transformer: { id: transformerId },
      date: inspectionForm.date,
      inspector: inspectionForm.inspector,
      notes: inspectionForm.notes,
      progressStatus: "Pending",
    };
    axios.post("http://localhost:8080/api/inspections", newInspection)
      .then(() => {
        axios.get("http://localhost:8080/api/inspections").then(res => {
          setInspections(res.data);
          setFilteredInspections(res.data);
        });
      })
      .catch(err => console.error("Error creating inspection:", err));
    setShowAddInspectionModal(false);
    setInspectionForm({ transformer: "", date: "", inspector: "", notes: "", maintenanceImage: null, maintenanceUploadDate: null, maintenanceWeather: "Sunny" });
  };

  const handleViewInspection = (inspection) => {
    setViewInspectionData(inspection);
    setShowViewInspectionModal(true);
  };

  const handleUpdateInspection = (updatedInspection) => {
    axios.put(`http://localhost:8080/api/inspections/${updatedInspection.id}`, updatedInspection)
      .then(() => {
        axios.get("http://localhost:8080/api/inspections").then(res => {
          setInspections(res.data);
          setFilteredInspections(res.data);
        });
      })
      .catch(err => console.error("Error updating inspection:", err));
  };

  const handleUpdateTransformer = (updatedTransformer) => {
    axios.put(`http://localhost:8080/api/transformers/${updatedTransformer.id}`, updatedTransformer)
      .then(() => {
        axios.get("http://localhost:8080/api/transformers").then(res => {
          setTransformers(res.data);
          setFilteredTransformers(res.data);
        });
      })
      .catch(err => console.error("Error updating transformer:", err));
  };

  // Full-page inspection handlers
  const handleOpenTransformerInspectionsPage = (transformer) => {
    setSelectedTransformerForPage(transformer);
    setShowTransformerInspectionsPage(true);
  };
  const handleBackToMain = () => {
    setSelectedTransformerForPage(null);
    setShowTransformerInspectionsPage(false);
  };

  // Clear data (optional: could delete all via API if needed)
  const handleClearLocalStorage = () => {
    axios.delete("http://localhost:8080/api/transformers")
      .then(() => axios.delete("http://localhost:8080/api/inspections"))
      .then(() => {
        setTransformers([]);
        setFilteredTransformers([]);
        setInspections([]);
        setFilteredInspections([]);
      })
      .catch(err => console.error("Error clearing data:", err));
  };

  return (
    <div className="app">
      <Sidebar setActivePage={setActivePage} />
      <div className="content">
        {activePage === "page2" ? (
          <SettingsPage onClearData={handleClearLocalStorage} />
        ) : showTransformerInspectionsPage && selectedTransformerForPage ? (
          <TransformerInspectionsPage
            transformer={selectedTransformerForPage}
            inspections={inspections.filter(i => i.transformer.id === selectedTransformerForPage.id)}
            setInspections={setInspections}
            setFilteredInspections={setFilteredInspections}
            transformers={transformers}
            onBack={handleBackToMain}
            onViewInspection={handleViewInspection}
          />
        ) : (
          <>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === "details" && (
              <TransformerList
                transformers={transformers}
                filteredTransformers={filteredTransformers}
                setTransformers={setTransformers}
                selectedTransformer={selectedTransformer}
                setSelectedTransformer={setSelectedTransformer}
                searchFieldDetails={searchFieldDetails}
                setSearchFieldDetails={setSearchFieldDetails}
                searchQueryDetails={searchQueryDetails}
                setSearchQueryDetails={setSearchQueryDetails}
                setShowModal={openTransformerModal}
                onViewInspections={handleOpenTransformerInspectionsPage}
              />
            )}
            {activeTab === "inspection" && (
              <InspectionList
                filteredInspections={filteredInspections}
                transformers={transformers}
                inspections={inspections}
                setInspections={setInspections}
                setFilteredInspections={setFilteredInspections}
                searchFieldInspection={searchFieldInspection}
                setSearchFieldInspection={setSearchFieldInspection}
                searchQueryInspection={searchQueryInspection}
                setSearchQueryInspection={setSearchQueryInspection}
                openAddInspectionModal={() => setShowAddInspectionModal(true)}
                onViewInspections={handleOpenTransformerInspectionsPage}
              />
            )}
          </>
        )}
      </div>

      {showTransformerModal && (
        <TransformerModal
          formData={transformerForm}
          handleInputChange={handleTransformerChange}
          handleAddTransformer={handleAddTransformer}
          onClose={() => setShowTransformerModal(false)}
        />
      )}

      {showAddInspectionModal && !showTransformerInspectionsPage && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={inspectionForm}
          handleInspectionChange={handleInspectionChange}
          handleScheduleInspection={handleScheduleInspection}
          onClose={() => setShowAddInspectionModal(false)}
          disableTransformerSelect={false}
        />
      )}

      {showViewInspectionModal && viewInspectionData && (
        <InspectionViewModal
          inspection={viewInspectionData}
          transformers={transformers}
          onClose={() => setShowViewInspectionModal(false)}
          updateInspection={handleUpdateInspection}
          updateTransformer={handleUpdateTransformer}
        />
      )}
    </div>
  );
}

export default App;