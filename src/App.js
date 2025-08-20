import "./index.css";
import { useEffect, useState } from "react";
// existing imports you already have:
import TransformerList from "./components/TransformerList";
import TransformerForm from "./components/TransformerForm";
import ImageUploadForm from "./components/ImageUploadForm";
// new:
import InspectionForm from "./components/InspectionForm";
import InspectionList from "./components/InspectionList";
import InspectionDetail from "./components/InspectionDetail";
import MaintenanceRecordView from "./components/MaintenanceRecordView";

function App() {
  const [transformers, setTransformers] = useState([]);
  const [editing, setEditing] = useState(null);

  const [images, setImages] = useState([]); // {id, transformerId, type, condition?, uploader, uploadDate, name, dataUrl}
  const [inspections, setInspections] = useState([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);
  const [recordModeId, setRecordModeId] = useState(null); // when set, show printable record

  // load
  useEffect(() => {
    const t = JSON.parse(localStorage.getItem("transformers")) || [];
    const imgs = JSON.parse(localStorage.getItem("images")) || [];
    const insp = JSON.parse(localStorage.getItem("inspections")) || [];
    setTransformers(t);
    setImages(imgs);
    setInspections(insp);
  }, []);

  // save
  useEffect(() => {
    localStorage.setItem("transformers", JSON.stringify(transformers));
  }, [transformers]);
  useEffect(() => {
    localStorage.setItem("images", JSON.stringify(images));
  }, [images]);
  useEffect(() => {
    localStorage.setItem("inspections", JSON.stringify(inspections));
  }, [inspections]);

  // transformer handlers (unchanged from your phase-1)
  const handleAddTransformer = (t) => setTransformers([...transformers, t]);
  const handleDeleteTransformer = (id) =>
    setTransformers(transformers.filter((t) => t.id !== id));
  const handleEditTransformer = (t) => setEditing(t);
  const handleUpdateTransformer = (updated) => {
    setTransformers(transformers.map((t) => (t.id === updated.id ? updated : t)));
    setEditing(null);
  };

  // image upload (phase-1)
  const handleUploadImage = async (imgMeta) => {
    // If the form gave a File object in imgMeta.file, convert to base64 so it persists
    if (imgMeta.file && !imgMeta.dataUrl) {
      const dataUrl = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(imgMeta.file);
      });
      const cleaned = {
        id: imgMeta.id,
        transformerId: imgMeta.transformerId,
        type: imgMeta.type,
        condition: imgMeta.type === "Baseline" ? imgMeta.condition : undefined,
        uploader: imgMeta.uploader,
        uploadDate: imgMeta.uploadDate,
        name: imgMeta.file.name,
        dataUrl,
      };
      setImages((prev) => [...prev, cleaned]);
    } else {
      setImages((prev) => [...prev, imgMeta]);
    }
  };

  // inspection creation
  const handleCreateInspection = (inspectionPayload) => {
    // also store the maintenance image in the global images list for traceability
    const maintImage = {
      id: inspectionPayload.maintenanceImage.id,
      transformerId: inspectionPayload.transformerId,
      type: "Maintenance",
      uploader: inspectionPayload.inspector,
      uploadDate: new Date().toLocaleString(),
      name: inspectionPayload.maintenanceImage.name,
      dataUrl: inspectionPayload.maintenanceImage.dataUrl,
    };

    // choose a baseline by condition (fallback: any baseline)
    const baselines = images.filter(
      (im) =>
        im.transformerId === inspectionPayload.transformerId && im.type === "Baseline"
    );
    const matched =
      baselines.find((b) => b.condition === inspectionPayload.condition) || baselines[0];

    const newInspection = {
      ...inspectionPayload,
      baselineImageId: matched ? matched.id : null,
    };

    setImages((prev) => [...prev, maintImage]);
    setInspections((prev) => [...prev, newInspection]);
    setSelectedInspectionId(newInspection.id);
  };

  const handleSelectInspection = (id) => setSelectedInspectionId(id);
  const handleDeleteInspection = (id) => {
    setInspections((prev) => prev.filter((i) => i.id !== id));
    if (selectedInspectionId === id) setSelectedInspectionId(null);
  };
  const handleStatusChange = (id, status) => {
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };
  const handleUpdateAnnotations = (id, anns) => {
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, annotations: anns } : i)));
  };

  const selectedInspection = inspections.find((i) => i.id === selectedInspectionId) || null;
  const selectedTransformer = selectedInspection
    ? transformers.find((t) => t.id === selectedInspection.transformerId)
    : null;
  const baselineForSelected =
    selectedInspection && selectedInspection.baselineImageId
      ? images.find((im) => im.id === selectedInspection.baselineImageId) || null
      : null;

  const openRecord = (id) => setRecordModeId(id);
  const closeRecord = () => setRecordModeId(null);

  const recordInspection =
    recordModeId ? inspections.find((i) => i.id === recordModeId) : null;
  const recordTransformer = recordInspection
    ? transformers.find((t) => t.id === recordInspection.transformerId)
    : null;
  const recordBaseline =
    recordInspection && recordInspection.baselineImageId
      ? images.find((im) => im.id === recordInspection.baselineImageId) || null
      : null;

  return (
    <div className="app-container">
      <h1>Transformer Management & Inspections</h1>

      {/* transformers (existing) */}
      <TransformerForm
        onAdd={handleAddTransformer}
        editing={editing}
        onUpdate={handleUpdateTransformer}
      />
      <TransformerList
        transformers={transformers}
        onDelete={handleDeleteTransformer}
        onEdit={handleEditTransformer}
      />

      {/* baseline & maintenance upload (existing) */}
      <ImageUploadForm transformers={transformers} onUpload={handleUploadImage} />

      {/* inspections (new) */}
      <InspectionForm transformers={transformers} onCreate={handleCreateInspection} />
      <InspectionList
        inspections={inspections}
        transformers={transformers}
        onSelect={handleSelectInspection}
        onDelete={handleDeleteInspection}
        onStatus={handleStatusChange}
      />
      {selectedInspection && (
        <InspectionDetail
          inspection={selectedInspection}
          transformer={selectedTransformer}
          baselineImage={baselineForSelected}
          onUpdateAnnotations={handleUpdateAnnotations}
          onPrintRecord={(id) => openRecord(id)}
        />
      )}

      {/* printable maintenance record */}
      {recordInspection && (
        <div className="record-modal">
          <div className="record-modal-inner">
            <button className="close" onClick={closeRecord}>×</button>
            <MaintenanceRecordView
              inspection={recordInspection}
              transformer={recordTransformer}
              baselineImage={recordBaseline}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
