import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";
import TransformerList from "./components/TransformerList";
import TransformerModal from "./components/TransformerModal";
import InspectionList from "./components/InspectionList";
import InspectionModal from "./components/InspectionModal";
import InspectionViewModal from "./components/InspectionViewModal";
import TransformerInspectionsPage from "./components/TransformerInspectionsPage";
import SettingsPage from "./components/SettingsPage";

import t1 from "./assets/transformer1.png";
import t2 from "./assets/transformer2.png";
import t3 from "./assets/transformer3.png";
import t4 from "./assets/transformer4.png";
import t5 from "./assets/transformer5.png";

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

  const [showTransformerInspectionsPage, setShowTransformerInspectionsPage] = useState(false);
  const [selectedTransformerForPage, setSelectedTransformerForPage] = useState(null);

  // --- Add default transformers toggle ---
  const ADD_DEFAULT_ENTRY = true; // set false to skip default transformers

  // --- Default transformers ---
  const DEFAULT_TRANSFORMERS = [
    { id: 1, number: "TX-001", pole: "A1", region: "Ragama", type: "Bulk", baselineImage: t1, baselineUploadDate: null, weather: "Sunny", location: "Site 1" },
    { id: 2, number: "TX-002", pole: "A2", region: "Gampaha", type: "Distribution", baselineImage: t2, baselineUploadDate: null, weather: "Cloudy", location: "Site 2" },
    { id: 3, number: "TX-003", pole: "B1", region: "Nugegoda", type: "Bulk", baselineImage: t3, baselineUploadDate: null, weather: "Rainy", location: "Site 3" },
    { id: 4, number: "TX-004", pole: "B2", region: "Colombo", type: "Distribution", baselineImage: t4, baselineUploadDate: null, weather: "Sunny", location: "Site 4" },
    { id: 5, number: "TX-005", pole: "C1", region: "Kalaniya", type: "Distribution", baselineImage: t5, baselineUploadDate: null, weather: "Cloudy", location: "Site 5" },
  ];

  // --- Load transformers ---
  useEffect(() => {
    let savedTransformers = [];
    try {
      savedTransformers = JSON.parse(localStorage.getItem("transformers")) || [];
    } catch {
      savedTransformers = [];
    }

    let allTransformers = savedTransformers;

    if (ADD_DEFAULT_ENTRY) {
      // Add default transformers only if not already present
      const existingIds = new Set(savedTransformers.map(t => t.id));
      const transformersToAdd = DEFAULT_TRANSFORMERS.filter(t => !existingIds.has(t.id));
      allTransformers = [...transformersToAdd, ...savedTransformers];
    }

    setTransformers(allTransformers);
    localStorage.setItem("transformers", JSON.stringify(allTransformers));
  }, []);

  // --- Load inspections ---
  useEffect(() => {
    let savedInspections = [];
    try {
      savedInspections = JSON.parse(localStorage.getItem("inspections")) || [];
    } catch {
      savedInspections = [];
    }
    setInspections(savedInspections);
  }, []);

  // --- Save to localStorage ---
  useEffect(() => { localStorage.setItem("transformers", JSON.stringify(transformers)); }, [transformers]);
  useEffect(() => { localStorage.setItem("inspections", JSON.stringify(inspections)); }, [inspections]);

  // --- Filtering ---
  useEffect(() => {
    setFilteredTransformers(
      transformers.filter(t => {
        if (!searchQueryDetails) return true;
        const value = t[searchFieldDetails]?.toString().toLowerCase() || "";
        return value.includes(searchQueryDetails.toLowerCase());
      })
    );
  }, [searchQueryDetails, searchFieldDetails, transformers]);

  useEffect(() => {
    setFilteredInspections(
      inspections.filter(i => {
        if (!searchQueryInspection) return true;
        const value =
          searchFieldInspection === "transformer"
            ? transformers.find(t => t.id === i.transformer)?.number?.toString().toLowerCase() || ""
            : i[searchFieldInspection]?.toString().toLowerCase() || "";
        return value.includes(searchQueryInspection.toLowerCase());
      })
    );
  }, [searchQueryInspection, searchFieldInspection, inspections, transformers]);

  // --- Transformer handlers ---
  const handleTransformerChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "baselineImage" && files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setTransformerForm({
        ...transformerForm,
        baselineImage: reader.result,
        baselineUploadDate: new Date().toLocaleString(),
      });
      reader.readAsDataURL(files[0]);
    } else { setTransformerForm({ ...transformerForm, [name]: value }); }
  };

  const openTransformerModal = (t = null) => {
    if (t) setTransformerForm({ ...t });
    else setTransformerForm({ id: null, number: "", pole: "", region: "", type: "Bulk", baselineImage: null, baselineUploadDate: null, weather: "", location: "" });
    setShowTransformerModal(true);
  };

  const handleAddTransformer = () => {
    const t = { ...transformerForm, id: transformerForm.id || Date.now() };
    setTransformers(prev => prev.some(item => item.id === t.id) ? prev.map(item => item.id === t.id ? t : item) : [...prev, t]);
    setShowTransformerModal(false);
  };

  // --- Inspection handlers ---
  const handleInspectionChange = (e) => { setInspectionForm({ ...inspectionForm, [e.target.name]: e.target.value }); };

  const handleScheduleInspection = () => {
    if (!inspectionForm.transformer || !inspectionForm.date || !inspectionForm.inspector) {
      alert("Please select a transformer, and fill in both the Date and Inspector fields.");
      return;
    }

    const transformerId = parseInt(inspectionForm.transformer, 10);
    const newInspection = { ...inspectionForm, transformer: transformerId, id: Date.now(), maintenanceImage: null, maintenanceUploadDate: null, maintenanceWeather: "Sunny" };
    setInspections(prev => [...prev, newInspection]);
    setShowAddInspectionModal(false);
    setInspectionForm({ transformer: "", date: "", inspector: "", notes: "", maintenanceImage: null, maintenanceUploadDate: null, maintenanceWeather: "Sunny" });
  };

  const handleViewInspection = (inspection) => { setViewInspectionData(inspection); setShowViewInspectionModal(true); };
  const handleUpdateInspection = (updatedInspection) => { setInspections(inspections.map(i => (i.id === updatedInspection.id ? updatedInspection : i))); };
  const handleUpdateTransformer = (updatedTransformer) => { setTransformers(prev => prev.map(t => (t.id === updatedTransformer.id ? updatedTransformer : t))); };

  // --- Full-page inspection handlers ---
  const handleOpenTransformerInspectionsPage = (transformer) => { setSelectedTransformerForPage(transformer); setShowTransformerInspectionsPage(true); };
  const handleBackToMain = () => { setSelectedTransformerForPage(null); setShowTransformerInspectionsPage(false); };

  // --- Clear Local Storage handler ---
  const handleClearLocalStorage = () => { localStorage.clear(); window.location.reload(); };

  return (
    <div className="app">
      <Sidebar setActivePage={setActivePage} />
      <div className="content">
        {activePage === "page2" ? (
          <SettingsPage onClearData={handleClearLocalStorage} />
        ) : showTransformerInspectionsPage && selectedTransformerForPage ? (
          <TransformerInspectionsPage
            transformer={selectedTransformerForPage}
            inspections={inspections.filter(i => i.transformer === selectedTransformerForPage.id)}
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
