import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";
import TransformerList from "./components/TransformerList";
import TransformerModal from "./components/TransformerModal";
import InspectionList from "./components/InspectionList";
import InspectionModal from "./components/InspectionModal";

function App() {
  // --- Pages & Tabs ---
  const [activePage, setActivePage] = useState("page1");
  const [activeTab, setActiveTab] = useState("details");

  // --- Transformers ---
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
  });
  const [ownerData, setOwnerData] = useState({
    name: "",
    phone: "",
    address: "",
    photo: null,
  });
  const [searchFieldDetails, setSearchFieldDetails] = useState("number");
  const [searchQueryDetails, setSearchQueryDetails] = useState("");

  // --- Inspections ---
  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    transformer: "",
    date: "",
    inspector: "",
    notes: "",
  });
  const [searchFieldInspection, setSearchFieldInspection] = useState("");
  const [searchQueryInspection, setSearchQueryInspection] = useState("");

  // --- Filter Transformers ---
  useEffect(() => {
    setFilteredTransformers(
      transformers.filter((t) => {
        if (!searchQueryDetails) return true;
        const value = t[searchFieldDetails]?.toString().toLowerCase() || "";
        return value.includes(searchQueryDetails.toLowerCase());
      })
    );
  }, [searchQueryDetails, searchFieldDetails, transformers]);

  // --- Filter Inspections ---
  useEffect(() => {
    setFilteredInspections(
      inspections.filter((i) => {
        if (!searchQueryInspection) return true;
        const value = i[searchFieldInspection]?.toString().toLowerCase() || "";
        return value.includes(searchQueryInspection.toLowerCase());
      })
    );
  }, [searchQueryInspection, searchFieldInspection, inspections]);

  // --- Handlers ---
  const handleTransformerChange = (e) => {
    const { name, value } = e.target;
    setTransformerForm({ ...transformerForm, [name]: value });
  };

  const handleOwnerChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setOwnerData({ ...ownerData, photo: files[0] });
    } else {
      setOwnerData({ ...ownerData, [name]: value });
    }
  };

  const handleAddTransformer = () => {
    const t = {
      ...transformerForm,
      owner: ownerData,
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
      });
      setOwnerData({ ...t.owner });
    } else {
      setTransformerForm({
        id: null,
        number: "",
        pole: "",
        region: "",
        type: "Bulk",
      });
      setOwnerData({ name: "", phone: "", address: "", photo: null });
    }
    setShowTransformerModal(true);
  };

  const handleInspectionChange = (e) => {
    const { name, value } = e.target;
    setInspectionForm({ ...inspectionForm, [name]: value });
  };

  const handleScheduleInspection = () => {
    const transformerId = parseInt(inspectionForm.transformer, 10); // Convert to number
    const newInspection = { 
      ...inspectionForm, 
      transformer: transformerId, 
      id: Date.now() 
    };
    setInspections([...inspections, newInspection]);
    setShowInspectionModal(false);
    setInspectionForm({ transformer: "", date: "", inspector: "", notes: "" });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar setActivePage={setActivePage} />

      <div style={{ flexGrow: 1, padding: "20px", overflowY: "auto" }}>
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
                inspections={inspections}
                transformers={transformers}
                searchFieldInspection={searchFieldInspection}
                setSearchFieldInspection={setSearchFieldInspection}
                searchQueryInspection={searchQueryInspection}
                setSearchQueryInspection={setSearchQueryInspection}
                setShowInspectionModal={setShowInspectionModal}
                filteredInspections={filteredInspections}
              />
            )}
          </>
        )}

        {activePage === "page2" && <h1>Settings Page</h1>}
      </div>

      {/* Modals */}
      {showTransformerModal && (
        <TransformerModal
          formData={transformerForm}
          ownerData={ownerData}
          handleInputChange={handleTransformerChange}
          handleOwnerChange={handleOwnerChange}
          handleAddTransformer={handleAddTransformer}
          onClose={() => setShowTransformerModal(false)}
        />
      )}

      {showInspectionModal && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={inspectionForm}
          handleInspectionChange={handleInspectionChange}
          handleScheduleInspection={handleScheduleInspection}
          onClose={() => setShowInspectionModal(false)}
        />
      )}
    </div>
  );
}

export default App;
