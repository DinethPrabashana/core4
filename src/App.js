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

        const value =
          searchFieldInspection === "transformer"
            ? transformers.find((t) => t.id === i.transformer)?.number?.toString().toLowerCase() || ""
            : i[searchFieldInspection]?.toString().toLowerCase() || "";

        return value.includes(searchQueryInspection.toLowerCase());
      })
    );
  }, [searchQueryInspection, searchFieldInspection, inspections, transformers]);

  // Transformer handlers
  const handleTransformerChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "baselineImage" && files?.[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransformerForm({ ...transformerForm, baselineImage: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      setTransformerForm({ ...transformerForm, [name]: value });
    }
  };

  // Load transformers from localStorage first
  useEffect(() => {
    const saved = localStorage.getItem("transformers");
    if (saved) {
      try {
        setTransformers(JSON.parse(saved));
      } catch {
        setTransformers([]);
      }
    }
  }, []);

  // Save transformers to localStorage
  useEffect(() => {
    localStorage.setItem("transformers", JSON.stringify(transformers));
  }, [transformers]);

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

  // Inspection handlers
  const handleInspectionChange = (e) => {
    const { name, value } = e.target;
    setInspectionForm({ ...inspectionForm, [name]: value });
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleScheduleInspection = async () => {
    const transformerId = parseInt(inspectionForm.transformer, 10);
    const selectedTransformer = transformers.find((t) => t.id === transformerId);

    const newInspection = {
      ...inspectionForm,
      transformer: transformerId,
      id: Date.now(),
      baselineImage: selectedTransformer?.baselineImage || null,
      maintenanceImage: null,
      weather: selectedTransformer?.weather || "",
    };

    setInspections((prev) => [...prev, newInspection]);
    setShowAddInspectionModal(false);
    setInspectionForm({ transformer: "", date: "", inspector: "", notes: "" });
  };

  const handleViewInspection = (inspection) => {
    setViewInspectionData(inspection);
    setShowViewInspectionModal(true);
  };

  const handleUpdateInspection = (updatedInspection) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === updatedInspection.id ? updatedInspection : i))
    );
  };

  // Load inspections from localStorage after transformers are loaded
  useEffect(() => {
    const saved = localStorage.getItem("inspections");
    if (saved) {
      try {
        setInspections(JSON.parse(saved));
      } catch {
        setInspections([]);
      }
    }
  }, [transformers.length]);

  // Save inspections
  useEffect(() => {
    const convertFilesToBase64 = async () => {
      const inspectionsBase64 = await Promise.all(
        inspections.map(async (i) => {
          const baseline =
            i.baselineImage instanceof File
              ? await fileToBase64(i.baselineImage)
              : i.baselineImage;
          const maintenance =
            i.maintenanceImage instanceof File
              ? await fileToBase64(i.maintenanceImage)
              : i.maintenanceImage;
          return { ...i, baselineImage: baseline, maintenanceImage: maintenance };
        })
      );
      localStorage.setItem("inspections", JSON.stringify(inspectionsBase64));
    };
    convertFilesToBase64();
  }, [inspections]);

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
