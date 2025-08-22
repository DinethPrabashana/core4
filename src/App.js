import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";
import TransformerList from "./components/TransformerList";
import TransformerModal from "./components/TransformerModal";
import InspectionList from "./components/InspectionList";
import InspectionModal from "./components/InspectionModal";
import InspectionViewModal from "./components/InspectionViewModal";
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
  });
  const [searchFieldInspection, setSearchFieldInspection] = useState("");
  const [searchQueryInspection, setSearchQueryInspection] = useState("");

  // Filtering Transformers
  useEffect(() => {
    setFilteredTransformers(
      transformers.filter((t) => {
        if (!searchQueryDetails) return true;
        const value = t[searchFieldDetails]?.toString().toLowerCase() || "";
        return value.includes(searchQueryDetails.toLowerCase());
      })
    );
  }, [searchQueryDetails, searchFieldDetails, transformers]);

  // Filtering Inspections
  useEffect(() => {
    setFilteredInspections(
      inspections.filter((i) => {
        if (!searchQueryInspection) return true;
        const value = i[searchFieldInspection]?.toString().toLowerCase() || "";
        return value.includes(searchQueryInspection.toLowerCase());
      })
    );
  }, [searchQueryInspection, searchFieldInspection, inspections]);

  // Transformer handlers
  const handleTransformerChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "baselineImage" && files) {
      setTransformerForm({ ...transformerForm, baselineImage: files[0] });
    } else {
      setTransformerForm({ ...transformerForm, [name]: value });
    }
  };

  const handleAddTransformer = () => {
    const t = {
      ...transformerForm,
      id: transformerForm.id || Date.now(),
    };
    setTransformers((prev) =>
      prev.some((item) => item.id === t.id)
        ? prev.map((item) => (item.id === t.id ? t : item))
        : [...prev, t]
    );
    setShowTransformerModal(false);
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
      });
    }
    setShowTransformerModal(true);
  };

  // Inspection handlers
  const handleInspectionChange = (e) => {
    const { name, value } = e.target;
    setInspectionForm({ ...inspectionForm, [name]: value });
  };

  const handleScheduleInspection = () => {
    const transformerId = parseInt(inspectionForm.transformer, 10);
    const selectedTransformer = transformers.find((t) => t.id === transformerId);

    const newInspection = {
      ...inspectionForm,
      transformer: transformerId,
      id: Date.now(),
      baselineImage: selectedTransformer?.baselineImage || null,
      maintenanceImage: null,
      weather: selectedTransformer?.weather || "", // copy weather here
    };

    setInspections([...inspections, newInspection]);
    setShowAddInspectionModal(false);
    setInspectionForm({ transformer: "", date: "", inspector: "", notes: "" });
  };

  const handleViewInspection = (inspection) => {
    setViewInspectionData(inspection);
    setShowViewInspectionModal(true);
  };

  // Update inspection with maintenance image or weather
  const handleUpdateInspection = (updatedInspection) => {
    setInspections(inspections.map((i) => (i.id === updatedInspection.id ? updatedInspection : i)));
  };

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
          updateInspection={handleUpdateInspection} // pass the update function
        />
      )}
    </div>
  );
}

export default App;
