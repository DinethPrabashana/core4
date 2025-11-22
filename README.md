<!-- =================================================================== -->
# Thermal Transformer Inspection & Maintenance Record System
<!-- =================================================================== -->

Department of Electronic & Telecommunication Engineering (EN)  
Department of Biomedical Engineering (BM)  
University of Moratuwa  
Course: EN3350 – Software Design Competition  
Last Modified: 2025-11-23  

---

## Table of Contents
1. Overview
2. Competition Context & Requirements
3. System Architecture & Tech Stack
4. Method Used (Detection & Annotation Pipeline)
5. Phase Implementation Summary (FR1–FR4)
6. Phase-wise Setup & Usage
7. End-to-End UI Usage Walkthrough (Step by Step)
8. Data Models
9. API Endpoints
10. Annotation System Details
11. Maintenance Record Workflow
12. Setup & Installation (Backend & Frontend)
13. Export & Reporting
14. Troubleshooting & Common Issues
15. Known Limitations
16. Roadmap / Future Enhancements
17. Repository Structure
18. Conclusion

---

## 1. Overview
This web application digitizes thermal inspection workflows for distribution transformers. It supports:
- Transformer master data management
- Baseline vs maintenance image comparison
- Automated anomaly detection using computer vision
- Interactive manual annotation & feedback capture
- Maintenance record sheet generation (snapshot of image + anomalies + engineer inputs) with PDF export

The goal is a traceable, efficient, and extensible inspection & maintenance pipeline.

### 1.1 Background
Electric power utilities routinely perform thermal imaging of distribution transformers to uncover early warning signs such as overheating, loose joints, insulation degradation, and load imbalance. Traditional workflows rely on manual side‑by‑side visual comparison, which is slow, subjective, and difficult to audit. A digitized, automated, and traceable pipeline reduces human error, accelerates decision making, and creates a reliable historical knowledge base for asset management.

### 1.2 Challenge
Design and implement an end‑to‑end software solution that:
1. Captures and manages transformer master data and associated baseline / maintenance thermal images.
2. Automatically detects temperature or intensity anomalies in newly uploaded maintenance images versus stored baselines.
3. Enables engineers to validate, correct, or augment anomalies through interactive annotation tools (human‑in‑the‑loop feedback).
4. Generates structured, printable maintenance record sheets embedding annotated thermal imagery and engineer inputs for traceable operational decisions.

### 1.3 Required Features (Phase-wise Summary)
Phase 1 – Transformer & Baseline Management:
- Admin interface for transformer CRUD (ID, location, capacity).
- Upload baseline and maintenance images tagged per transformer.
- Tag baseline images with environmental condition (Sunny / Cloudy / Rainy).

Phase 2 – Automated Anomaly Detection:
- AI/CV comparison engine (baseline vs maintenance) producing potential hotspots.
- Side‑by‑side comparison view with zoom, pan, reset.
- Automatic anomaly overlay (bounding boxes, severity heuristics, metadata).

Phase 3 – Interactive Annotation & Feedback:
- Adjust/delete AI detections; draw new anomaly boxes or regions.
- Persist annotations with user, timestamp, classification, notes.
- Maintain feedback log (original vs final annotations) for future model refinement; support export.

Phase 4 – Maintenance Record Generation:
- Produce digital maintenance form with transformer metadata, timestamp, annotated image.
- Engineer fills status, readings, recommended action, remarks, location override.
- Persist and retrieve records; provide inspection‑scoped history and PDF export.

### 1.4 Judging Criteria (Condensed)
- Functionality: Completeness of FR1–FR4 deliverables.
- Scalability & Architecture: Modular, extensible, clean layering (frontend, API, CV core, persistence).
- Efficiency: Responsive image load, detection latency, UI interactivity.
- ML / CV Integration: Robustness and clarity of anomaly detection pipeline.
- Creativity & UX: Usability improvements, intuitive annotation tools, polished design system.
- Quality: Code structure, documentation, traceability (timestamps, logs), potential test coverage.

### 1.5 Resources Provided (Competition Context)
- Sample thermal image dataset (baseline & maintenance pairs).
- Handwritten maintenance sheet examples / layout references.
- UI mockups / wireframes (phase screens & form layouts).
- Suggested heuristic thresholds (temperature / intensity deviation guidelines).

### 1.6 Final Deliverables (Competition)
- Integrated web system covering all four phases.
- Source code in public GitHub repository with README & deployment steps.
- Optional test coverage report (future enhancement here).
- Demo videos per milestone (as per competition instructions).
- Exportable data artifacts (annotations, maintenance records PDF).

---
## 2. Competition Context & Requirements
The project fulfills phase-wise functional requirements (FR1–FR4) defined in the EN3350 Software Design Competition brief. Judging focuses on functionality, scalability, efficiency, ML integration, creativity, and quality (code + documentation).

---
## 3. System Architecture & Tech Stack
Frontend (React) communicates with a Flask (Python) backend via REST over HTTP.
- Frontend: React, reusable component-driven UI, theming via CSS variables.
- Backend: Flask, SQLite, OpenCV (classical CV pipeline for alignment & hotspot detection).
- Storage: SQLite (`backend.db`).
- Export: ReportLab (PDF maintenance record generation).

High-Level Flow:
1. User creates transformer & uploads baseline image.
2. Maintenance image uploaded → AI comparison → anomaly candidates.
3. User refines anomalies (add/edit/delete/comments/classification).
4. User generates maintenance record snapshot.
5. Record persisted; historical retrieval & PDF export available.

---
## 4. Method Used (Detection & Annotation Pipeline)
This project uses a classical computer vision approach (no heavy deep learning dependency) optimized for explainability and responsiveness.

Detection Stages:
1. Preprocessing: Convert images to consistent color space; optionally normalize intensity; resize if oversized.
2. Alignment: Basic feature/keypoint or template-based alignment (ensures baseline and maintenance images are spatially comparable even with small camera shifts).
3. Temperature Proxy Extraction: Use pixel intensity (or extracted thermal channel) difference between maintenance and baseline to approximate heat delta.
4. Thresholding & Region Proposal: Apply adaptive or fixed delta threshold; generate candidate hot regions; perform morphological filtering to remove noise speckles.
5. Bounding Box Consolidation: Merge overlapping regions; discard regions below minimum area to reduce false positives.
6. Severity & Classification Heuristics: Relative intensity delta + area used to classify Faulty vs Potentially Faulty; subtype labels (e.g., LooseJoint, PointOverload) derived from shape and localized intensity pattern.
7. Anomaly Packaging: Each region stored with coordinates, size, severity score, and classification guess.

Annotation Enhancement:
- User Interaction Layer adds manual boxes, edits geometry, deletes false positives.
- Each action persists with timestamps (created_at/updated_at), classification override, and notes (comment rationale).
- Final accepted anomalies become part of maintenance record snapshot.

Why Classical CV:
- Faster iteration in competition context.
- Lower dependency footprint; easier portability.
- Transparent heuristics useful for audit and field validation.

Potential Upgrade Path:
- Swap detection stage (steps 3–6) with a trained thermal anomaly segmentation model.
- Use feedback logs (original vs final annotations) to create supervised training dataset.

## 5. Phase Implementation Summary (FR1–FR4)
Below is an expanded breakdown of each phase: objectives, user workflow, backend logic, data flow, UI components, current implementation status, and potential improvement directions.

### Phase 1 – Transformer & Baseline Management
**Objectives:** Establish foundational entities (transformers, baseline images) and environmental context.
**Core Features (FR1.1–FR1.3):**
- Transformer CRUD: Create, list, edit, delete transformer records (ID, location, capacity).
- Image Upload: Associate baseline or maintenance images with a transformer; store type and timestamp.
- Environment Tagging: Baseline images labeled (Sunny / Cloudy / Rainy) for contextual comparison.
**User Workflow:**
1. Navigate to Transformer list.
2. Add a transformer (form submission triggers POST to backend).
3. Upload baseline image with environment dropdown selection.
4. (Later) Upload maintenance images as inspections progress.
**Backend Logic:**
- Validation on required transformer fields.
- Image metadata persisted (file path or encoded reference, type, environment condition).
- Relational links: `transformers` → `inspections` (or image entries).
**Data Flow:** Frontend form → REST POST → SQLite insert → subsequent GET lists populate tables.
**UI Components:** TransformerList (table + modal), image upload form, environment selector.
**Persistence:** SQLite ensures retrieval and chronological ordering (ascending ID used for inspection numbering).
**Current Status:** Fully implemented; baseline tagging available; inspection numbering derived from order.
**Potential Improvements:** Add bulk import, environment condition analytics, file size validation, and image thumbnail generation.

### Phase 2 – Automated Detection
**Objectives:** Provide automated anomaly discovery comparing maintenance image against baseline.
**Core Features (FR2.1–FR2.3):**
- Comparison Engine: Align images; compute intensity/thermal deltas; identify hotspot candidates.
- Visual Side-by-Side: Baseline left, maintenance right with synchronized inspection context.
- Automatic Marking: Bounding boxes + severity heuristic (faulty vs potentially faulty) + subtype.
**User Workflow:**
1. Select maintenance inspection.
2. Trigger AI analysis (button or auto-run).
3. Review overlays (bounding boxes + list panel).
**Backend Logic:**
- Receive inspection ID → load baseline + maintenance image paths.
- Perform preprocessing (resize/alignment) and threshold segmentation.
- Return JSON anomalies (coords, size, classification, severity score, ID source=AI).
**Data Flow:** Frontend fetch → display overlays; anomalies cached client-side for annotation phase.
**UI Components:** InspectionViewModal (side-by-side layout, analyze button, anomaly table, mode toggle).
**Persistence:** Raw AI anomalies initially transient until user interacts (Phase 3 save consolidates).
**Current Status:** Implemented with classical CV; heuristics encoded; severity tags visible.
**Potential Improvements:** Confidence scoring UI, heatmap overlay layer, adaptive thresholds per environment condition.

### Phase 3 – Interactive Annotation & Feedback
**Objectives:** Incorporate human validation to refine AI results and capture corrective intelligence.
**Core Features (FR3.1–FR3.3):**
- Editing Tools: Resize, move, delete existing boxes; add new anomalies manually.
- Metadata Persistence: Store timestamps (`created_at`/`updated_at`), classification override, notes/comments, source (AI/User).
- Feedback Log: Historical log enabling model improvement dataset assembly (exportable in JSON/CSV if endpoints retained).
**User Workflow:**
1. Enter Edit mode in inspection view.
2. Adjust bounding boxes as needed; add new ones for missed hotspots.
3. Add classification and optional reasoning notes.
4. Changes auto-saved (no manual save required) or saved on explicit action depending implementation.
**Backend Logic:**
- Endpoint accepts full annotation list; upserts records preserving original `created_at` when present.
- Maintains annotation_logs for action trace (add/edit/delete) if table enabled.
**Data Flow:** Client side state → POST full array → SQLite commit → GET reload reproduces geometry and metadata.
**UI Components:** Shared ZoomAnnotatedImage (edit vs pan modes), annotation list panel, comments inputs.
**Persistence:** Durable storage of each bounding box with versioned timestamps; deletion irreversible (future soft-delete possible).
**Current Status:** Fully implemented: ID namespacing resolves reload collisions; comments captured; zoom/pan unified.
**Potential Improvements:** Polygonal annotations, multi-user conflict resolution, bulk edit tools, tag taxonomy expansion.

### Phase 4 – Maintenance Record Sheet Generation
**Objectives:** Produce a structured, immutable snapshot of inspection state with engineer context for audit and action planning.
**Core Features (FR4.1–FR4.3):**
- Record Form: Pre-fills transformer metadata, inspection number, timestamp, annotated image snapshot, anomaly list with comments.
- Engineer Inputs: Status dropdown (OK / Needs Maintenance / Urgent Attention), voltage/current readings, recommended action, remarks, location override.
- Persistence & Retrieval: Records stored with snapshot semantics; listing filterable by transformer and inspection; PDF export for reporting.
**User Workflow:**
1. After annotation refinement, click “Generate Maintenance Record”.
2. Complete engineer fields; review anomaly list; save.
3. Open Record History to view, select, or delete entries; export PDF.
**Backend Logic:**
- POST creates new `maintenance_records` row including serialized anomalies and base64 annotated image.
- GET filters by transformer_id and optionally inspection_id.
- DELETE removes record (no audit trail yet).
- PDF endpoint renders structured document (metadata header, annotated image, anomalies table, engineer inputs).
**Data Flow:** Snapshot creation insulated from future annotation changes (frozen state).
**UI Components:** MaintenanceRecordForm modal, RecordHistory modal (list + detail pane + zoom viewer), PDF export button.
**Persistence:** Ensures traceability with `created_at`/`updated_at`; location stored as per-record snapshot (does not alter transformer master record).
**Current Status:** Implemented with functioning PDF export; inspection-scoped record viewing; deletion support.
**Potential Improvements:** Versioning/audit trail, role-based access, differential updates (track field changes), digital signature/approval workflow.

### Cross-Phase Data Continuity
- Transformer ID links all subsequent entities (inspections, annotations, records).
- Annotations feed into records; record snapshots insulate historical decisions from later annotation modifications.
- Feedback log enables potential ML dataset curation for future model training.

### Summary Table (Condensed)
| Phase | Primary Entities | User Action Focus | Output Persisted | Export |
|-------|------------------|-------------------|------------------|--------|
| 1 | transformers, images | Create & tag | Transformer + image metadata | N/A |
| 2 | anomalies (AI) | Analyze & review | Transient anomaly proposals | N/A |
| 3 | annotations, logs | Refine & comment | Durable annotations + logs | JSON/CSV (optional) |
| 4 | maintenance_records | Snapshot & report | Record snapshot (image + anomalies + inputs) | PDF |

### Improvement Themes Forward
1. Robustness: Integrate confidence scores, adaptive thresholds, and thermal calibration.
2. Usability: Polygon tools, bulk operations, accessibility enhancements (keyboard navigation, ARIA).
3. Traceability: Add audit trails for record deletion & annotation edits.
4. Intelligence: Leverage feedback logs for semi-supervised model retraining.
5. Governance: Implement authentication/roles and approval workflows on maintenance records.

---
## 6. Phase-wise Setup & Usage
This section explains what is minimally required to leverage each phase, assuming prior phases are complete.

Phase 1 (Transformer & Baseline):
- Required: Transformer creation, baseline image upload with environment tag.
- Usage Trigger: After adding at least one baseline, system ready for maintenance comparisons.

Phase 2 (Automated Detection):
- Required: At least one baseline and one maintenance image for the same transformer.
- Action: Open inspection view → run AI analysis → automatic anomaly proposals generated.

Phase 3 (Annotation & Feedback):
- Required: Completed Phase 2 analysis output.
- Action: Switch to Edit mode → refine boxes (add/edit/delete) → add comments/classification.
- Persistence: Leave view or save; annotations auto-sent to backend.
- Export (optional): Annotation logs in JSON/CSV if endpoints enabled.

Phase 4 (Maintenance Records):
- Required: Annotated image (AI only or AI + manual refinements).
- Action: Click “Generate Maintenance Record” → fill engineer form → save.
- Result: Record stored with snapshot; Retrieval via Records button (inspection-scoped) and PDF export.

## 7. End-to-End UI Usage Walkthrough (Step by Step)
Follow these steps after setup to use the system effectively:
1. Launch Backend: `python app.py` (see Section 10). Ensure it runs on `http://localhost:8000`.
2. Launch Frontend: `npm start` in `core4/` → opens `http://localhost:3000`.
3. Create Transformer: Use the Transformers page (Add Transformer). Provide ID, location, capacity.
4. Upload Baseline Image: Select transformer → upload image marked as Baseline; choose environment (Sunny/Cloudy/Rainy).
5. Upload Maintenance Image: Add a new maintenance image (same transformer, Type = Maintenance).
6. Open Inspection: Select maintenance image row → open inspection/analysis view.
7. Run AI Analysis: Click Analyze (if not auto-run). Baseline & maintenance images display side-by-side.
8. Review AI Anomalies: Bounding boxes appear on thermal image; severity and type listed.
9. Adjust Anomalies:
   - Drag to reposition, handles to resize.
   - Delete incorrect boxes.
   - Draw new boxes (manual additions) → set classification & add comment.
10. Add/Refine Comments: Each anomaly row supports notes/comments (stored in snapshot & record).
11. Switch Modes: Use Zoom/Pan vs Edit mode (shared zoom component) to inspect details precisely.
12. Generate Maintenance Record: Once satisfied with annotated image, click “Generate Maintenance Record”.
13. Fill Engineer Form:
    - Engineer Name
    - Status (OK / Needs Maintenance / Urgent Attention)
    - Voltage / Current readings
    - Recommended Action
    - Additional Remarks
    - Location (override snapshot if needed)
14. Save Record: Commits snapshot of annotated image + anomalies + inputs.
15. View Record History: From transformer inspections, click “Records” for that inspection. A modal lists records with timestamps.
16. Inspect Record Detail: Select a record to view annotated image, anomaly table, engineer inputs.
17. Export PDF: Use “Export PDF” button (optionally filtered by inspection). Save structured maintenance sheet.
18. Delete Record (If Needed): Use Delete action (irreversible) to remove a record.
19. Print Record: Use browser print (Ctrl+P) for physical archiving.
20. Iterate: New maintenance image uploads create additional inspections → repeat detection, annotation, record generation.

---
## 8. Data Models
### transformers
`id`, `name`, `location`, `capacity`, `created_at`
### inspections
`id`, `transformer_id`, `baseline_image_path`, `maintenance_image_path`, `created_at`
### annotations
`id`, `inspection_id`, `image_id`, `x`, `y`, `width`, `height`, `classification`, `notes`, `created_at`, `updated_at`, `source` (AI/User)
### maintenance_records
`id`, `transformer_id`, `inspection_id`, `record_timestamp`, `engineer_name`, `status`, `readings` (JSON), `recommended_action`, `notes`, `annotated_image` (data URI), `anomalies` (JSON array), `location`, `created_at`, `updated_at`
### annotation_logs (if present)
Historical audit of add/edit/delete actions (used for export & feedback).

---
## 9. API Endpoints (Summary)
Transformers:
- `GET /api/transformers`
- `POST /api/transformers`
- `PUT /api/transformers/:id`
- `DELETE /api/transformers/:id`

Inspections / Images:
- `POST /api/inspections` (create inspection & link images)
- `GET /api/inspections?transformer_id=...`

Anomalies / Annotations:
- `GET /api/annotations/:inspection_id`
- `POST /api/annotations/:inspection_id` (save full set)

Maintenance Records:
- `GET /api/records?transformer_id=...&inspection_id=...`
- `POST /api/records`
- `GET /api/records/:id`
- `PUT /api/records/:id`
- `DELETE /api/records/:id`
- `GET /api/records/export/pdf?transformer_id=...&inspection_id=...`

Detection:
- `POST /api/analyze` (maintenance vs baseline comparison → anomaly candidates)

Migration:
- `POST /api/migrate` or run `migrate_database.py` locally (depending on implementation).

---
## 10. Annotation System Details
- Auto-save model: The frontend sends a complete annotation list; backend persists with original `created_at` & `updated_at` when provided.
- Editing updates `updated_at` only; deletion logged in `annotation_logs` (if table enabled).
- ID Namespacing prevents collision when reloading.
- Classification options: Faulty / Potentially Faulty / Normal + subtype labels (e.g., LooseJoint).
- Export (annotations) available in JSON/CSV if endpoints retained; maintenance records use PDF only.

---
## 11. Maintenance Record Workflow
Snapshot Principle: Each saved record freezes the annotated image + anomaly set + engineer inputs. Future annotation changes do NOT retroactively alter existing records.
Key Features:
- Scoped History: View records per transformer or filtered by inspection.
- PDF Export: Structured sheet with transformer metadata, timestamp, engineer inputs, anomaly table.
- Location Override: Record stores a snapshot `location` independent of transformer master record.
- Deletion: Irreversible (no audit trail yet). Future enhancement: soft delete + audit.

---
## 12. Setup & Installation
### Prerequisites
- Python 3.10+
- Node.js (LTS) & npm

### Backend (Windows Example)
```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python database.py   :: initializes schema
python app.py        :: starts server at http://localhost:8000
```

### Backend (macOS/Linux)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python database.py
python app.py
```

### Database Migration (if upgrading Phase 3 → Phase 4)
```bash
python migrate_database.py
```

### Frontend
```bash
cd core4
npm install
npm start
```

### Optional: Clean Database (Destructive!)
```bash
python -c "import sqlite3; c=sqlite3.connect('backend.db'); c.executescript('DELETE FROM annotation_logs; DELETE FROM annotations; DELETE FROM inspections; DELETE FROM transformers; VACUUM;'); c.commit(); c.close(); print('Cleared')"
```

---
## 13. Export & Reporting
- Maintenance Records: PDF only via `/api/records/export/pdf` or UI button (structured layout + anomalies + engineer inputs).
- Annotation Logs: JSON/CSV (if enabled) for model feedback datasets.
- Printing: Browser print dialog formats record detail pane cleanly.

---
## 14. Troubleshooting & Common Issues
- Missing Packages: Ensure `pip install -r requirements.txt` succeeded (ReportLab, Flask-Cors, OpenCV).
- Database Schema Errors: Run `migrate_database.py` after pulling new code.
- Large Image Performance: Resize thermal images before upload (recommended <3MB).
- CORS Failures: Confirm backend running on port 8000 before starting frontend.
- PDF Generation Error (e.g., `NameError: inch`): Ensure `from reportlab.lib.units import inch` exists in PDF module.

---
## 15. Known Limitations
- Development Flask server (not production-hardened).
- Classical CV heuristics (could be improved with trained thermal ML models).
- No user authentication / role-based access yet.
- JPEG only supported for thermal images.
- No audit trail for maintenance record deletions.
- Annotation export may omit advanced polygon support (bounding boxes only).

---
## 16. Roadmap / Future Enhancements
- User Authentication & Roles (Engineer / Admin / Viewer)
- Dark Mode & Theme Customization
- Model Retraining Pipeline using annotation feedback
- Audit Trail for record deletes & annotation edits
- Performance optimizations (vectorized hotspot detection)
- Cloud/File Storage abstraction (S3 / Azure Blob)
- Multi-format image support (PNG, TIFF)
- Access Control & Multi-user concurrency handling

---
## 17. Repository Structure (Simplified)
## 18. Conclusion
This system delivers a full transformer thermal inspection workflow: structured data, automated anomaly detection, human validation, and traceable maintenance record generation with export. The classical CV pipeline + structured annotation feedback establishes a foundation for iterative ML improvements. Future enhancements (authentication, model retraining, audit trails, and advanced visualization) can be layered without disrupting existing modules thanks to clear phase separation and snapshot-based record design. The platform is ready for extension into production-grade reliability and intelligent maintenance analytics.

### Appendix A – Evaluation Rubrics (Summarized)
Phase 1 (Example Distribution): Feature completeness, UI clarity, architecture quality, metadata handling, documentation & bonus innovation.
Phase 2: Detection functionality, accuracy/robustness, code modularity, documentation clarity.
Phase 3: Annotation functionality, backend integration & persistence, usability design, logging/export traceability, documentation.
Phase 4: Maintenance form generation, editable fields & UX, backend integration/versioning, retrieval & export quality, documentation robustness.
```text
backend/
  app.py                # Flask API
  database.py           # Initial schema setup
  migrate_database.py   # Phase 4 migration
  anomaly_cv.py         # CV detection logic
  requirements.txt
  schema.sql
core4/
  src/
    components/         # React components (modals, lists, forms)
    style/              # Themed CSS modules
    App.js / App.css
  public/
    index.html          # Font + meta
data/                   # Sample transformer image folders
```

---
## Attribution & Academic Use
Developed as part of EN3350 Software Design Competition (University of Moratuwa). Use for educational and evaluation purposes only.

---
## License
If a license is required for submission, add it here (e.g., MIT). Otherwise, default internal academic usage.

---
## Change Log (Recent)
- Phase 4: Added `maintenance_records`, PDF export, snapshot logic, unified zoom component, global theming.
- UI Modernization: Introduced design tokens, consolidated modal/table styling, improved zoom/pan viewer.

---
## Contact
For academic inquiries: Department of Electronic & Telecommunication Engineering / Department of Biomedical Engineering, University of Moratuwa.

---
Enjoy building upon this foundation! Contributions and improvements encouraged.
