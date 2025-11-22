# Thermal Image Anomaly Detection System

This project is a web-based application designed for the inspection of electrical transformers using thermal imaging. It leverages an AI-powered backend to analyze thermal images against a baseline, automatically detecting and classifying potential faults like loose joints and overloads.

The user-friendly interface allows inspectors to upload images, review AI-generated analysis, add their own manual annotations, and generate a comprehensive inspection report.

---

## Key Features

- **Image Comparison:** Upload and compare a standard "Baseline" image with a "Thermal" (maintenance) image.
- **Persistent Data Storage:** All transformer and inspection data is saved in a robust SQLite database.
- **AI-Powered Analysis:** A Python backend uses computer vision techniques (image alignment, color difference analysis) to automatically detect hot spots and other anomalies.
- **Anomaly Classification:** AI automatically classifies anomalies as `Faulty` or `Potentially Faulty` and identifies subtypes like `LooseJoint` or `PointOverload`.
- **Interactive Annotations:** View AI-detected anomalies as bounding boxes directly on the thermal image.
- **Manual Review & Annotation:**
    - Draw new bounding boxes to manually identify anomalies the AI may have missed.
    - For manually added boxes, classify them as `Faulty`, `Potentially Faulty`, or `Normal` using a simple dropdown.
    - Add comments or reasons for any anomaly, whether AI-detected or manual.
    - Delete incorrect or irrelevant anomaly detections.
- **Inspection Workflow:** Track the progress of an inspection from image upload to final review.

---

## Tech Stack

- **Frontend:** React.js
- **Backend:** Python with Flask, SQLite Database
- **Computer Vision:** OpenCV

---

## Project Structure

The project is divided into two main parts:

```text
/
├── backend/      # Contains the Python Flask server and all AI/CV logic
└── core4/        # Contains the React.js frontend application
```

---

## Setup and Installation Guide

To run this project on your local machine, you will need to set up both the backend server and the frontend application.

### Prerequisites

- **Node.js and npm:** Download & Install Node.js
- **Python 3.x and pip:** Download & Install Python

### 1. Backend Setup (Flask Server)

The backend is responsible for all image processing, AI analysis, and data persistence.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment** (recommended):
    ```bash
    # For Windows
    python -m venv venv
    .\venv\Scripts\activate

    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install Flask Flask-Cors numpy opencv-python scikit-image
    pip install requirements.txt
    ```

4.  **Initialize the database:**
    This command only needs to be run once. It will create the `backend.db` file and set up the necessary tables.
    ```bash
    python database.py
    ```

5.  **Run the backend server:**
    ```bash
    python app.py
    ```

    The server will start running on `http://localhost:8000`. Keep this terminal window open.

### 2. Frontend Setup (React App)

The frontend provides the user interface for interacting with the application.

1.  **Open a new terminal window.**

2.  **Navigate to the frontend directory:**
    ```bash
    cd core4
    ```

3.  **Install the required npm packages:**
    ```bash
    npm install
    ```

4.  **Run the frontend application:**
    ```bash
    npm start
    ```

    Your web browser should automatically open to `http://localhost:3000`, where you can now use the application. The frontend will communicate with the backend server you started in the other terminal.

5. **Delete the default database entries:**
first go  to the backend directory, and run. 
```bash 
python -c "import sqlite3; conn=sqlite3.connect('backend.db'); conn.executescript('DELETE FROM annotation_logs; DELETE FROM annotations; DELETE FROM inspections; DELETE FROM transformers; VACUUM;'); conn.commit(); conn.close(); print('Cleared tables and VACUUM complete')"
```

***Note all the data will be erased from the database***


## Known Limitations

- **The Flask API used in this project relies on Flask’s built-in development server, which is not suitable for production deployment. It is intended for testing and development only and may have performance and security limitations under real-world usage.**
- **The AI models for anomaly detection and classification are only as good as the data they were trained on. Inaccuracies in the training data may lead to false positives or negatives in anomaly detection.**
- **Real-time performance may vary based on the hardware specifications of the host machine, especially during AI inference and image processing tasks.**
- **The system currently supports only JPEG image format for thermal images. Other formats like PNG or BMP are not supported at this time.**
- **Network latency may affect the performance of the application, especially the communication between the frontend and backend servers.**

---

## Annotation Log Export Format

The system provides export functionality for annotation logs in both JSON and CSV formats. These exports are now concise and structured for clarity:

### JSON Export
- **Grouped by Inspection**: Each inspection contains its transformer, images, and a list of annotation actions.
- **De-duplicated**: For each annotation, only the first occurrence (earliest timestamp) of each action type (added, edited, deleted) is included.
- **Human-readable IDs**:
  - `inspection_id` shows the Inspection Number as seen in the transformer’s Inspections tab, e.g. `T1-INSP1`.
  - `transformer_id` shows the Transformer Number from the transformers table.
  - `image_id` mirrors the Inspection Number (same as `inspection_id`).
- **Structure Example:**

```json
[
  {
    "inspection_id": 1,
    "transformer_id": 101,
    "images": [
      {
        "image_id": "T1_faulty_001.jpg",
        "actions": [
          {
            "action_type": "added",
            "timestamp": "2025-10-17T12:34:56Z",
            "user_id": "inspectorA",
            "notes": "Confirmed anomaly",
            "annotation": { ... },
            "ai_prediction": { ... },
            "user_annotation": { ... }
          },
          // ... more actions
        ]
      }
      // ... more images
    ]
  }
  // ... more inspections
]
```

### CSV Export
- **Flat Table**: Each row represents a single annotation action, with clear columns for inspection, transformer, image, action, annotation details, user, and timestamp.
- **De-duplicated**: For each annotation, only the first occurrence (earliest timestamp) of each action type (added, edited, deleted) is included to avoid repeated entries from multiple saves.
- **Human-readable IDs**:
  - `inspection_id` shows the Inspection Number as seen in the transformer’s Inspections tab, e.g. `T1-INSP1`.
  - `transformer_id` shows the Transformer Number from the transformers table.
  - `image_id` mirrors the Inspection Number (same as `inspection_id`).
## Annotation System Overview

The annotation system allows users to interactively add, edit, and delete bounding boxes (markers) on thermal images to identify anomalies. Each annotation records:

- **created_at**: Timestamp when the bounding box was first added (set by the frontend, preserved by the backend).
- **updated_at**: Timestamp of the last edit or resize (set by the frontend, preserved by the backend).
- **user_id**: The user who performed the action.
- **notes**: Optional comments or reasons for the annotation.
- **classification**: Faulty, Potentially Faulty, or Normal.

Annotations are displayed in the Analysis Log table, showing the user and time for each action. The log persists across saves and reloads, accurately reflecting when each bounding box was added or edited.


### Backend Annotation Persistence

- **Database Table:** Annotations are stored in the `annotations` table in the SQLite database. Each record includes fields for `id`, `inspection_id`, `image_id`, bounding box coordinates, `created_at`, `updated_at`, `user_id`, `notes`, and `classification`.
- **API Endpoint:** The backend provides `/api/annotations/<inspection_id>` for saving and loading annotations. It accepts annotation data from the frontend and ensures timestamps and user info are preserved.
- **Persistence Logic:** When annotations are saved, the backend checks for `created_at` and `updated_at` fields from the client and stores them as provided. If missing, it uses the server time. The backend (Flask/Python) exposes REST API endpoints for saving and loading annotations.

---

## Phase 4 – Maintenance Record Sheet Generation

This release adds a complete Maintenance Record workflow on top of Phases 1–3. Engineers can now generate a printable digital record for each inspection, including transformer metadata, the annotated thermal image, anomaly list, editable fields, and saved historical records.

### What’s included

- New database table: `maintenance_records` to persist records with timestamps, engineer name, status, readings (as JSON), recommended action, notes, annotated image snapshot, anomaly list, and a snapshot `location` (editable per record so you can override or refine the transformer's stored location).
- Backend REST API (full CRUD + PDF export):
  - `GET /api/records?transformer_id=...&inspection_id=...` – list records (optionally filter by transformer and inspection)
  - `POST /api/records` – create a record snapshot
  - `GET /api/records/:id` – fetch one record
  - `PUT /api/records/:id` – update an existing record (e.g. notes/status)
  - `DELETE /api/records/:id` – permanently delete a maintenance record
  - `GET /api/records/export/pdf?transformer_id=...&inspection_id=...` – download a structured PDF of records
- Frontend UI:
  - In the inspection view, a “Generate Maintenance Record” button appears once an annotated image exists.
  - A form modal clearly separates System Data (transformer metadata, inspection number) from Engineer Inputs. Inputs include: Engineer, Status (OK / Needs Maintenance / Urgent Attention), Voltage/Current, Recommended Action, Additional Remarks, and Location. It shows the annotated thermal image and a table of anomalies (with comments).
  - Each inspection row now has a dedicated “Records” button to view only that inspection’s maintenance records (scoped history).
  - Record History modal supports in-table and detail-pane deletion of individual records (with confirmation).
  - Export PDF button in Record History to download all records for the transformer, optionally scoped to the selected inspection.
  - Print-ready layout via the browser’s print dialog.
  - Human-friendly inspection numbering displayed (e.g. `T1-INSP3`) derived from order of inspections for a transformer.

### One-time migration

If you already have an existing database, run a one-time migration to create the new `maintenance_records` table:

```bat
cd "core4\\backend" && python migrate_database.py
```

If it’s a fresh setup, starting the backend after `database.py` initialization will already include the table via `schema.sql`.

### How to use

1. Open any inspection and run AI analysis, review and annotate if needed.
2. Click “Generate Maintenance Record”.
3. Fill in engineer inputs and save. This stores a snapshot of the annotated image and anomaly list.
4. To view history for a specific inspection, open the transformer’s inspections page and click that inspection’s “Records” button.
5. In the Record History modal you can select a record to view details or delete it.

### Data model (maintenance_records)

- `id` (PK)
- `transformer_id` (FK)
- `inspection_id` (FK, nullable)
- `record_timestamp` (string)
- `engineer_name` (string)
- `status` (string)
- `readings` (JSON string, e.g., { voltage, current })
- `recommended_action` (string)
- `notes` (string)
- `annotated_image` (string, data URI)
- `anomalies` (JSON string, array)
- `location` (string, snapshot of transformer location at time of record; can be edited without changing transformer master record)
- `created_at`, `updated_at` (string)

### Phase 4 requirements mapping (6.2 FR4)

- FR4.1 Generate Maintenance Record Form
  - Includes transformer metadata (ID, location, type), inspection number, and record timestamp
  - Embedded annotated thermal image from analysis with anomaly markers
  - Anomalies table with type, severity, location, size, and comments
- FR4.2 Editable Engineer Input Fields
  - Inputs: Engineer name, status, readings (voltage/current), recommended action, additional remarks, and location
  - Status uses dropdown; timestamp uses a date-time picker; inputs are visually separated from system-generated content
- FR4.3 Save and Retrieve Completed Records
  - Records saved to SQLite with transformer_id, inspection_id, timestamps; retrievable per transformer and per inspection; history viewer included

Additional Technical Requirements
- Clean, printable UI and export to PDF. Traceability via created_at and updated_at timestamps for each record

### Notes

- The record captures a snapshot. Subsequent changes to annotations do not retroactively alter saved records.
- You can print the record form via the browser’s print dialog for PDF-ready export.
- Deleting a record is irreversible; deletions are not currently logged (future enhancement could add audit trail).
- Inspection numbers (`<TransformerNumber>-INSP<index>`) are assigned by chronological order (ascending ID) within each transformer.
