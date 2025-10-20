

# Transformer Inspection Management System

A web-based platform for power utilities to manage transformer inspections efficiently. The system enables automated detection of thermal anomalies, centralized management of transformer records and thermal images, and generation of digital maintenance records. It improves inspection accuracy, reduces manual effort, and ensures traceability across all inspection phases.

**Phase 3 Enhancement:** This version includes a complete **human-in-the-loop feedback system** with interactive annotation tools, enabling engineers to validate, correct, and enhance AI predictions. All user interactions are logged for model retraining and performance analysis.

---

<<<<<<< Updated upstream
## Table of Contents
- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Default Transformer Entries](#default-transformer-entries)
- [Usage Guide](#usage-guide)
=======
## Key Features

### Phase 1 & 2: Core Functionality
- **Image Comparison:** Upload and compare a standard "Baseline" image with a "Thermal" (maintenance) image.
- **Persistent Data Storage:** All transformer and inspection data is saved in a robust SQLite database.
- **AI-Powered Analysis:** A Python backend uses computer vision techniques (image alignment, color difference analysis) to automatically detect hot spots and other anomalies.
- **Anomaly Classification:** AI automatically classifies anomalies as `Faulty` or `Potentially Faulty` and identifies subtypes like `LooseJoint` or `PointOverload`.
- **Inspection Workflow:** Track the progress of an inspection from image upload to final review.
>>>>>>> Stashed changes

### Phase 3: Interactive Annotation System ✨ NEW
- **Interactive Annotation Tools:**
    - ✏️ **Resize**: Drag corner handles (NW, NE, SW, SE) to adjust bounding box dimensions
    - 🔄 **Reposition**: Click and drag boxes to move them anywhere on the image
    - ➕ **Add New**: Draw new bounding boxes by clicking and dragging on the image
    - 🗑️ **Delete**: Remove incorrect AI detections (requires a reason/comment)
    - 📝 **Edit Classifications**: Assign or modify severity (Faulty/Potentially Faulty/Normal) and type (Loose Joint, Point Overload, Full Wire Overload, Other)
    - 💬 **Add Comments**: Document reasoning for each annotation change

- **Automatic Persistence:**
    - 💾 Auto-save with debouncing (saves 1 second after last change)
    - 🔄 Auto-reload annotations when revisiting inspections
    - 📊 Full metadata tracking (user ID, timestamps, action types)
    - 🔍 Hover tooltips showing annotation details

- **Feedback Log System:**
    - 📈 Complete audit trail of all annotation actions
    - 🤖 Tracks both AI predictions and user modifications
    - 📤 Export logs in JSON or CSV format for model retraining
    - 🎯 Structured data format ready for machine learning pipelines

---

## Overview

This application helps teams streamline their transformer maintenance and inspection processes. It provides a centralized interface to:
- Create and manage inspection entries.
- Track progress and mark inspections as completed.
- Automatically synchronize maintenance dates with inspected dates when inspections are completed.
- View, edit, and delete inspection entries with ease.

---

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DinethPrabashana/core4.git
   cd core4

2. **Install dependencies:**

   `npm install`

3. **Start the development server:**

   `npm start`



## Usage Guide

1. Open the app in your browser (default: [http://localhost:3000](http://localhost:3000)).
2. Use the sidebar to navigate between:
   - **Transformers**
   - **Settings**
3. In the **Transformers** tab:
   - There are two sub-buttons:
     - **Transformers** – View and manage transformer records.
     - **Inspections** – View transformer inspection summaries.
   - **Add Transformer** button – Add a new transformer record.
4. In the **Inspections** view:
   - Displays a list of all transformers with their total number of inspections.
   - Clicking on a transformer shows detailed inspection records for that transformer.
5. Add or edit transformers and inspections as needed.
6. Mark inspections as complete to automatically sync the inspected date with the maintenance date.




## Data & Storage Usage

### Local Storage
The current version uses browser `localStorage` to persist transformer and inspection data between sessions.

- Inspection records, transformer lists, and their states are stored locally.
- This ensures fast loading and offline-friendly operation.

### Default Entries
This application supports optional default transformers to help with quick setup and testing during the initial phase. A configuration variable (`add_default_entry`) controls whether default transformer data should be preloaded.

- `true`: Loads predefined transformers.
- `false`: Starts with an empty database.

### Future Plan – Database Integration
We aim to migrate from local storage to a structured database in the next phase.

- This will enable multi-user access, centralized data management, and improved scalability.
- The planned backend will synchronize transformer and inspection data securely.

---


---

## Phase 3: Annotation System Architecture

### Backend Structure for Annotation Persistence

The annotation system uses a multi-table SQLite database architecture designed for scalability and queryability:

#### Database Schema

**1. `annotations` Table**
Stores individual annotation instances with full metadata:
```sql
CREATE TABLE annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    annotation_id TEXT UNIQUE NOT NULL,  -- Frontend ID (e.g., 'ai_1', 'user_123')
    x REAL NOT NULL,                     -- Bounding box coordinates
    y REAL NOT NULL,
    w REAL NOT NULL,
    h REAL NOT NULL,
    confidence REAL,                     -- AI confidence score (0-1)
    severity TEXT,                       -- Faulty/Potentially Faulty/Normal
    classification TEXT,                 -- Loose Joint/Point Overload/etc.
    comment TEXT,                        -- User notes/reasoning
    source TEXT NOT NULL,                -- 'ai' or 'user'
    deleted INTEGER DEFAULT 0,           -- Soft delete flag
    user_id TEXT DEFAULT 'Admin',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
);
```

**2. `annotation_logs` Table**
Tracks all annotation actions for model feedback and audit trail:
```sql
CREATE TABLE annotation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    transformer_id INTEGER NOT NULL,
    image_id TEXT,
    action_type TEXT NOT NULL,           -- 'added', 'edited', 'deleted'
    annotation_data TEXT NOT NULL,       -- Current annotation state (JSON)
    ai_prediction TEXT,                  -- Original AI detection (JSON)
    user_annotation TEXT,                -- Final user-modified version (JSON)
    user_id TEXT DEFAULT 'Admin',
    timestamp TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
);
```

### API Endpoints

**Annotation Management:**
- `POST /api/annotations/<inspection_id>` - Save/update annotations (auto-save)
- `GET /api/annotations/<inspection_id>` - Load annotations for an inspection
- `GET /api/annotation-logs?inspection_id=<id>` - Retrieve action logs

**Export Endpoints:**
- `GET /api/annotation-logs/export/json` - Export all logs as JSON
- `GET /api/annotation-logs/export/csv` - Export all logs as CSV

### Annotation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AI Analysis                                              │
│    - User uploads baseline + thermal images                 │
│    - Backend detects anomalies → Creates 'ai' annotations   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. Interactive Review                                       │
│    - View AI detections as bounding boxes                   │
│    - Resize/reposition boxes with drag handles             │
│    - Add manual annotations by drawing                      │
│    - Edit severity, classification, comments                │
│    - Delete incorrect detections (with reason)              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. Auto-Save (Debounced 1 second)                          │
│    - Save to annotations table                              │
│    - Log action to annotation_logs table                    │
│    - Capture: action_type, ai_prediction, user_annotation  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. Export for Model Improvement                             │
│    - Settings page → Export JSON/CSV                        │
│    - Contains: AI predictions vs final annotations          │
│    - Ready for ML training pipeline                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Implementation Features

**1. Annotation Metadata Capture**
Every annotation action includes:
- **Action Type**: `added` (new manual), `edited` (modified existing), `deleted` (removed)
- **Timestamps**: `created_at`, `updated_at` (ISO 8601 format)
- **User ID**: Tracks who made each change
- **Source**: Distinguishes between `ai` and `user` annotations
- **Optional Notes**: Comments explaining the reasoning

**2. AI Prediction Tracking**
For model improvement, the system stores:
- **Original AI Prediction**: Bounding box, confidence, classification as generated by CV pipeline
- **User Annotation**: Final version after human review
- This comparison enables:
  - False positive/negative analysis
  - Confidence threshold tuning
  - Training data generation

**3. Soft Delete with Audit Trail**
- Annotations are marked `deleted = 1` rather than removed
- Preserves history for analysis
- AI detections require a comment (reason) before deletion
- All deletions logged in `annotation_logs`

---

## Usage Guide: Phase 3 Annotation Workflow

### Step 1: Create Inspection and Upload Images
1. Navigate to "Transformers" page
2. Click "Add Inspection" for a transformer
3. Fill in inspection details (date, inspector, notes)
4. Upload **Baseline Image** (standard reference)
5. Upload **Thermal Image** (current inspection)

### Step 2: Run AI Analysis
1. In the inspection modal, click **"Run AI Analysis"**
2. AI processes images and returns detected anomalies
3. View annotated image with bounding boxes color-coded by severity:
   - 🔴 **Red**: Faulty
   - 🟠 **Orange**: Potentially Faulty
   - 🟡 **Yellow**: Normal/Other

### Step 3: Review and Edit Annotations

**To Resize a Box:**
- Click on a bounding box to select it
- Drag corner handles (visible in corners) to adjust size
- Changes auto-save after 1 second

**To Reposition a Box:**
- Click inside a bounding box and drag to move
- Position precisely over the anomaly region

**To Add a Manual Annotation:**
1. Click **"Draw Box"** button
2. Click and drag on the image to draw a rectangle
3. Select severity from dropdown (Faulty/Potentially Faulty/Normal)
4. Select classification type (Loose Joint/Point Overload/etc.)
5. Add optional comment explaining the anomaly

**To Delete an Annotation:**
- For **AI detections**: Add a comment explaining why it's incorrect, then click Delete
- For **manual annotations**: Click Delete directly
- Deleted annotations are marked but preserved in database

**To Edit Details:**
- Use dropdown menus in the annotation table to change:
  - **Severity**: Faulty / Potentially Faulty / Normal
  - **Classification**: Loose Joint / Point Overload / Full Wire Overload / Other
- Add/edit comments in the text field

### Step 4: Complete Inspection
1. Review all annotations for accuracy
2. Click **"Complete Inspection"**
3. Inspection status changes to "Completed"
4. All data is permanently saved

### Step 5: Export Annotation Logs
1. Navigate to **Settings** page (⚙️ icon in sidebar)
2. Click **"Export JSON"** for ML-ready structured data
3. Click **"Export CSV"** for spreadsheet analysis
4. Files contain complete audit trail with AI predictions vs user corrections

---


<<<<<<< Updated upstream


=======
### General System Limitations
- **The Flask API used in this project relies on Flask's built-in development server, which is not suitable for production deployment. It is intended for testing and development only and may have performance and security limitations under real-world usage.**
- **The AI models for anomaly detection and classification are only as good as the data they were trained on. Inaccuracies in the training data may lead to false positives or negatives in anomaly detection.**
- **Real-time performance may vary based on the hardware specifications of the host machine, especially during AI inference and image processing tasks.**
- **The system currently supports JPEG and PNG image formats for thermal images.**
- **Network latency may affect the performance of the application, especially the communication between the frontend and backend servers.**

### Phase 3 Annotation System Limitations
- **Annotation History Versioning**: The system does not support viewing previous versions of annotations or rolling back changes. Only the most recent state is preserved, though all actions are logged.
- **Multi-User Conflict Resolution**: If multiple users edit the same inspection simultaneously, the last save wins. There is no conflict detection or merge functionality.
- **Annotation Tool Types**: Currently only supports rectangular bounding boxes. Polygonal regions, circles, or freehand annotations are not supported.
- **Undo/Redo**: No built-in undo/redo functionality. Users must manually reverse changes.
- **Offline Mode**: Requires active backend connection. Annotations cannot be made offline.
- **Image Annotation Limits**: Performance may degrade with >100 annotations on a single image due to DOM rendering overhead.
- **Export Size**: Large annotation logs (>10,000 entries) may take several seconds to export and result in large file sizes.

---

## Annotation Log Export Format

The system provides export functionality for annotation logs in both JSON and CSV formats, specifically designed for machine learning pipelines and data analysis.

### Export Features
- **Complete Audit Trail**: Every annotation action (add/edit/delete) is logged
- **AI vs Human Comparison**: Original AI predictions stored alongside user corrections
- **Metadata Rich**: Includes timestamps, user IDs, inspection context
- **ML-Ready**: Structured format suitable for model retraining and validation

### JSON Export
Grouped by inspection with hierarchical structure for easy processing:

**Structure:**
```json
[
  {
    "inspection_id": 1,
    "transformer_id": 101,
    "images": [
      {
        "image_id": "inspection_1",
        "actions": [
          {
            "action_type": "edited",
            "timestamp": "2025-10-21T14:23:45.123456",
            "user_id": "Admin",
            "notes": "Corrected classification based on visual inspection",
            "annotation": {
              "id": "ai_1",
              "x": 150,
              "y": 200,
              "w": 80,
              "h": 60,
              "severity": "Faulty",
              "classification": "Loose Joint",
              "confidence": 0.89,
              "source": "ai",
              "deleted": false,
              "comment": "Corrected classification"
            },
            "ai_prediction": {
              "id": "ai_1",
              "x": 150,
              "y": 200,
              "w": 80,
              "h": 60,
              "severity": "Potentially Faulty",
              "classification": "Point Overload",
              "confidence": 0.89
            },
            "user_annotation": {
              "id": "ai_1",
              "x": 150,
              "y": 200,
              "w": 80,
              "h": 60,
              "severity": "Faulty",
              "classification": "Loose Joint",
              "confidence": 0.89,
              "source": "ai",
              "deleted": false,
              "comment": "Corrected classification"
            }
          }
        ]
      }
    ]
  }
]
```

**Key Fields Explained:**
- `action_type`: Type of modification (`added`, `edited`, `deleted`)
- `ai_prediction`: Original AI output (null for manual annotations)
- `user_annotation`: Final state after human review
- `annotation`: Complete current state with all metadata

### CSV Export
Flat table format for spreadsheet analysis and statistical tools:

**Columns:**
- `inspection_id`: Foreign key to inspection record
- `transformer_id`: Foreign key to transformer
- `image_id`: Reference to analyzed image
- `action_type`: Type of action performed
- `timestamp`: ISO 8601 formatted datetime
- `user_id`: User who performed the action
- `notes`: User comments/reasoning
- `annotation`: Full annotation JSON string
- `ai_prediction`: AI detection JSON (if applicable)
- `user_annotation`: User-modified annotation JSON

**Example Row:**
```csv
inspection_id,transformer_id,image_id,action_type,timestamp,user_id,notes,annotation,ai_prediction,user_annotation
1,101,inspection_1,edited,2025-10-21T14:23:45.123456,Admin,"Corrected classification","{""id"":""ai_1"",...}","{""severity"":""Potentially Faulty"",...}","{""severity"":""Faulty"",...}"
```

### Use Cases for Exported Data

**1. Model Retraining**
- Compare AI predictions vs ground truth (user annotations)
- Identify systematic errors in detection algorithm
- Generate training datasets with verified labels

**2. Performance Analysis**
- Calculate precision/recall metrics
- Analyze confidence threshold effectiveness
- Track false positive/negative rates

**3. Quality Assurance**
- Audit inspector decisions
- Identify inconsistencies in annotations
- Track annotation time and effort

**4. Regulatory Compliance**
- Maintain complete inspection records
- Document decision-making process
- Provide audit trail for safety compliance

---
>>>>>>> Stashed changes
