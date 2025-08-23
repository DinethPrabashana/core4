import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";
import TransformerList from "./components/TransformerList";
import TransformerModal from "./components/TransformerModal";
import InspectionList from "./components/InspectionList";
import InspectionModal from "./components/InspectionModal";
import InspectionViewModal from "./components/InspectionViewModal";

// Import default images
import t1 from "./assets/transformer1.png";
import t2 from "./assets/transformer2.png";
import t3 from "./assets/transformer3.png";
import t4 from "./assets/transformer4.png";

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
    maintenanceImage: null, // Add maintenanceImage field
  });
  const [searchFieldInspection, setSearchFieldInspection] = useState("");
  const [searchQueryInspection, setSearchQueryInspection] = useState("");

  // --- Load transformers ---
  useEffect(() => {
    const saved = localStorage.getItem("transformers");
    if (saved) {
      try {
        setTransformers(JSON.parse(saved));
      } catch {
        setDefaultTransformers();
      }
    } else {
      setDefaultTransformers();
    }
  }, []);

  const setDefaultTransformers = () => {
    const defaultTransformers = [
      { id: 1, number: "TX-001", pole: "A1", region: "North", type: "Bulk", baselineImage: t1, weather: "Sunny", location: "Site 1" },
      { id: 2, number: "TX-002", pole: "A2", region: "South", type: "Distribution", baselineImage: t2, weather: "Cloudy", location: "Site 2" },
      { id: 3, number: "TX-003", pole: "B1", region: "East", type: "Bulk", baselineImage: t3, weather: "Rainy", location: "Site 3" },
      { id: 4, number: "TX-004", pole: "B2", region: "West", type: "Distribution", baselineImage: t4, weather: "Sunny", location: "Site 4" },
    ];
    setTransformers(defaultTransformers);
    localStorage.setItem("transformers", JSON.stringify(defaultTransformers));
  };

  // --- Load inspections ---
  useEffect(() => {
    const saved = localStorage.getItem("inspections");
    if (saved) {
      try {
        setInspections(JSON.parse(saved));
      } catch {
        setInspections([]);
      }
    }
  }, []);

  // Save transformers whenever they change
  useEffect(() => {
    localStorage.setItem("transformers", JSON.stringify(transformers));
  }, [transformers]);

  // Save inspections whenever they change
  useEffect(() => {
    localStorage.setItem("inspections", JSON.stringify(inspections));
  }, [inspections]);

  // --- Filtering ---
  useEffect(() => {
    setFilteredTransformers(
      transformers.filter((t) => {
        if (!searchQueryDetails) return true;
        const value = t[searchFieldDetails]?.toString().toLowerCase() || "";
        return value.includes(searchQueryDetails.toLowerCase());
      })
    );
  }, [searchQueryDetails, searchFieldDetails, transformers]);

  useEffect(() => {
    setFilteredInspections(
      inspections.filter((i) => {
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
      reader.onloadend = () => setTransformerForm({ ...transformerForm, baselineImage: reader.result });
      reader.readAsDataURL(files[0]);
    } else {
      setTransformerForm({ ...transformerForm, [name]: value });
    }
  };

  const openTransformerModal = (t = null) => {
    if (t) {
      setTransformerForm({
        id: t.id,
        number: t.number,
        pole: t.pole,
        region: t.region,
        type: t.type,
        baselineImage: t.baselineImage || null,
        weather: t.weather || "",
        location: t.location || "",
      });
    } else {
      setTransformerForm({
        id: null,
        number: "",
        pole: "",
        region: "",
        type: "Bulk",
        baselineImage: null,
        weather: "",
        location: "",
      });
    }
    setShowTransformerModal(true);
  };

  const handleAddTransformer = () => {
    const t = { ...transformerForm, id: transformerForm.id || Date.now() };
    setTransformers(prev => {
      const updated = prev.some(item => item.id === t.id)
        ? prev.map(item => (item.id === t.id ? t : item))
        : [...prev, t];
      localStorage.setItem("transformers", JSON.stringify(updated));
      return updated;
    });
    setShowTransformerModal(false);
  };

  // --- Inspection handlers ---
  const handleInspectionChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "maintenanceImage" && files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setInspectionForm({ ...inspectionForm, maintenanceImage: reader.result });
      reader.readAsDataURL(files[0]);
    } else {
      setInspectionForm({ ...inspectionForm, [name]: value });
    }
  };

  const handleScheduleInspection = () => {
    const transformerId = parseInt(inspectionForm.transformer, 10);
    const selectedTransformer = transformers.find(t => t.id === transformerId);

    const newInspection = {
      ...inspectionForm,
      transformer: transformerId,
      id: Date.now(),
      baselineImage: selectedTransformer?.baselineImage || null,
      maintenanceImage: inspectionForm.maintenanceImage || null, // <-- save base64
      baselineWeather: selectedTransformer?.weather || "Sunny",
      maintenanceWeather: "Sunny",
    };

    setInspections(prev => [...prev, newInspection]);
    setShowAddInspectionModal(false);
    setInspectionForm({ transformer: "", date: "", inspector: "", notes: "", maintenanceImage: null });
  };

  const handleViewInspection = (inspection) => {
    setViewInspectionData(inspection);
    setShowViewInspectionModal(true);
  };

  const handleUpdateInspection = (updatedInspection) => {
    setInspections(inspections.map(i => (i.id === updatedInspection.id ? updatedInspection : i)));
  };

  // --- Render ---
  return (
    <div className="app">
      <Sidebar setActivePage={setActivePage} />
      <div className="content">
        {activePage === "page1" && (
          <>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === "details" && (
              <TransformerList
                transformers={transformers}
                filteredTransformers={filteredTransformers}
                selectedTransformer={selectedTransformer}
                setSelectedTransformer={setSelectedTransformer}
                searchFieldDetails={searchFieldDetails}
                setSearchFieldDetails={setSearchFieldDetails}
                searchQueryDetails={searchQueryDetails}
                setSearchQueryDetails={setSearchQueryDetails}
                setShowModal={openTransformerModal}
                setTransformers={setTransformers}
              />
            )}
            {activeTab === "inspection" && (
              <InspectionList
                filteredInspections={filteredInspections}
                transformers={transformers}
                setInspections={setInspections} 
                setFilteredInspections={setFilteredInspections}
                searchFieldInspection={searchFieldInspection}
                setSearchFieldInspection={setSearchFieldInspection}
                searchQueryInspection={searchQueryInspection}
                setSearchQueryInspection={setSearchQueryInspection}
                openAddInspectionModal={() => setShowAddInspectionModal(true)}
                openViewInspectionModal={handleViewInspection}
              />
            )}
          </>
        )}
        {activePage === "page2" && <h1>Settings Page</h1>}
      </div>

      {showTransformerModal && (
        <TransformerModal
          formData={transformerForm}
          handleInputChange={handleTransformerChange}
          handleAddTransformer={handleAddTransformer}
          onClose={() => setShowTransformerModal(false)}
        />
      )}

      {showAddInspectionModal && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={inspectionForm}
          handleInspectionChange={handleInspectionChange}
          handleScheduleInspection={handleScheduleInspection}
          onClose={() => setShowAddInspectionModal(false)}
        />
      )}

      {showViewInspectionModal && viewInspectionData && (
        <InspectionViewModal
          inspection={viewInspectionData}
          transformers={transformers}
          onClose={() => setShowViewInspectionModal(false)}
          updateInspection={handleUpdateInspection}
        />
      )}
    </div>
  );
}

export default App;
