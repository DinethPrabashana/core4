# Annotation Features Documentation (FR3.1, FR3.2, FR3.3)

## Overview
This document describes the interactive annotation features implemented for the anomaly detection system, including annotation tools, metadata tracking, and model feedback integration.

---

## FR3.1: Interactive Annotation Tools

### Features Implemented

#### 1. **Adjust Existing Anomaly Markers**
- **Resize**: Click on any annotation box to select it. Resize handles (small circles) appear at all four corners
  - Drag the handles to resize the bounding box
  - Minimum size constraint prevents boxes from becoming too small (10x10 pixels)
- **Reposition**: Click and drag anywhere on the selected annotation box to move it
  - The cursor changes to indicate grab/grabbing state
  - Position is constrained to stay within image bounds

#### 2. **Delete Incorrectly Detected Anomalies**
- Click the "Delete" button in the Analysis Log table for any annotation
- **AI-detected anomalies**: Require a comment/reason before deletion
  - System validates that a comment is provided
  - Helps track why AI predictions were rejected
- **Manual annotations**: Can be deleted immediately
- Deleted annotations are marked as `deleted: true` but retained for feedback purposes

#### 3. **Add New Anomaly Markers**
- Click "Add Manual Box" button to enter drawing mode
- Click and drag on the annotated image to draw a new bounding box
- Minimum box size validation (5x5 pixels)
- Each manual annotation requires:
  - Severity selection (Faulty, Potentially Faulty, Normal)
  - Classification selection (Loose Joint, Point Overload, Full Wire Overload, Other)
  - Optional comment/notes

#### 4. **Annotation Metadata**
All annotations include:
- **Annotation Type**: `source` field ('ai' or 'user')
- **Action Type**: Automatically logged as 'added', 'edited', or 'deleted'
- **Comments/Notes**: Freeform text field for each annotation
- **Timestamp**: Created and updated timestamps
- **User ID**: Currently defaults to 'Admin'
- **Position & Size**: x, y, width, height in image coordinates
- **Confidence**: For AI detections only
- **Severity & Classification**: For categorization

---

## FR3.2: Metadata and Annotation Persistence

### Database Schema

#### **annotations** Table
Stores individual annotation records with full metadata:
```sql
- id: Primary key
- inspection_id: Foreign key to inspections
- annotation_id: Unique ID from frontend
- x, y, w, h: Bounding box coordinates
- confidence: AI confidence score (if applicable)
- severity: Classification severity
- classification: Anomaly type
- comment: User notes
- source: 'ai' or 'user'
- deleted: Boolean flag
- user_id: User who created/modified
- created_at: ISO timestamp
- updated_at: ISO timestamp
```

### Auto-Save Functionality
- **Automatic Persistence**: Annotations are auto-saved 1 second after any change
- **Debounced Saving**: Prevents excessive API calls during rapid edits
- **Manual Save**: "Save" button provides explicit save option
- **Backend Sync**: All changes immediately saved to SQLite database

### Annotation Reload
- **Automatic Loading**: When opening an inspection, saved annotations are automatically loaded
- **Format Conversion**: Database format converted to UI format seamlessly
- **State Restoration**: All annotation properties (position, size, metadata) restored exactly

### UI Display of Metadata
1. **Hover Tooltip**: Displays when hovering over annotation box:
   - User who created/modified
   - Last modification timestamp
   - Source (AI or Manual)

2. **Analysis Log Table**: Shows comprehensive metadata:
   - Source (AI/Manual)
   - Severity and Classification
   - Position and size details
   - Confidence (for AI detections)
   - User and timestamps (created/updated)
   - Comments/notes

---

## FR3.3: Feedback Integration for Model Improvement

### Annotation Logs System

#### **annotation_logs** Table
Tracks all annotation actions for model training:
```sql
- id: Primary key
- inspection_id: Foreign key
- transformer_id: Foreign key
- image_id: Reference to annotated image
- action_type: 'added', 'edited', 'deleted', 'ai_generated'
- annotation_data: Full annotation JSON
- ai_prediction: Original AI detection (JSON)
- user_annotation: User-modified version (JSON)
- user_id: Who made the change
- timestamp: When action occurred
- notes: Additional context
```

### Feedback Log Tracking
Every annotation action automatically logs:
1. **Original AI Prediction**: 
   - Bounding box coordinates
   - Confidence score
   - AI-assigned severity and classification

2. **Final User Annotation**:
   - Modified coordinates (if repositioned/resized)
   - User-assigned severity and classification
   - User comments explaining changes
   - Deletion status and reason

3. **Comparison Data**:
   - Side-by-side AI vs. human annotations
   - Enables analysis of model accuracy
   - Identifies patterns in corrections

### Export Functionality

#### JSON Export
- **Endpoint**: `/api/annotation-logs/export/json`
- **Format**: Complete JSON with nested objects
- **Contains**: All fields including parsed JSON data
- **Use Case**: Machine learning model retraining

#### CSV Export
- **Endpoint**: `/api/annotation-logs/export/csv`
- **Format**: Flat CSV with JSON strings in cells
- **Contains**: All log metadata with serialized JSON
- **Use Case**: Analysis in Excel, data science tools

#### Export Data Fields
```
- inspection_id
- transformer_id
- image_id
- action_type
- user_id
- timestamp
- notes
- annotation_data (full annotation state)
- ai_prediction (original AI output)
- user_annotation (final human-verified state)
```

---

## API Endpoints

### Annotation Management
- `POST /api/annotations/<inspection_id>` - Save/update annotations
- `GET /api/annotations/<inspection_id>` - Retrieve annotations
- `GET /api/annotation-logs` - Get all annotation logs
- `GET /api/annotation-logs?inspection_id=<id>` - Filter logs by inspection
- `GET /api/annotation-logs/export/json` - Export logs as JSON
- `GET /api/annotation-logs/export/csv` - Export logs as CSV

---

## Usage Instructions

### For Users

1. **Run AI Analysis**:
   - Upload baseline and thermal images
   - Adjust detection threshold
   - Click "Run AI Analysis"
   - AI-detected anomalies appear with bounding boxes

2. **Review and Adjust Annotations**:
   - Click any annotation to select it
   - Drag corner handles to resize
   - Drag the box to reposition
   - Add comments in the Analysis Log table
   - Delete incorrect detections (with reason for AI detections)

3. **Add Manual Annotations**:
   - Click "Add Manual Box"
   - Draw bounding box on image
   - Select severity and classification
   - Add optional comments
   - Click "Cancel Drawing" to exit mode

4. **Auto-Save**:
   - Changes save automatically after 1 second
   - Click "Save" button for immediate persistence
   - Annotations reload automatically when reopening inspection

5. **Export Feedback Logs**:
   - Navigate to Settings page
   - Click "Export Annotation Logs (JSON)" or "(CSV)"
   - File downloads automatically
   - Contains all annotation history and AI vs. human comparisons

### For Developers/Model Training

1. **Access Feedback Data**:
   ```bash
   # Export logs
   curl http://localhost:8000/api/annotation-logs/export/json > logs.json
   ```

2. **Analyze Corrections**:
   - Compare `ai_prediction` vs `user_annotation` fields
   - Identify systematic errors in AI model
   - Extract false positives (AI detected, user deleted)
   - Extract false negatives (user added, AI missed)

3. **Prepare Training Data**:
   - Use `user_annotation` as ground truth
   - Filter by `action_type` for specific feedback types
   - Group by `transformer_id` for location-specific patterns
   - Use timestamps to track model improvement over time

---

## Technical Implementation Details

### Frontend Components
- **InspectionViewModal.js**: Main annotation interface
  - Interactive annotation overlays with resize handles
  - Mouse event handlers for drag/resize
  - Auto-save with debouncing
  - Metadata display on hover
  - Analysis Log table with editable fields

- **SettingsPage.js**: Export interface
  - Simplified settings page
  - JSON and CSV export buttons
  - Backend integration for log retrieval

### Backend Components
- **database.py**: Data persistence layer
  - `save_annotations()`: Store annotation data
  - `get_annotations()`: Retrieve annotations
  - `log_annotation_action()`: Create feedback logs
  - `export_annotation_logs_json()`: JSON export
  - `export_annotation_logs_csv()`: CSV export

- **app.py**: REST API endpoints
  - Annotation CRUD operations
  - Log retrieval and filtering
  - Export endpoints with proper content types

- **schema.sql**: Database structure
  - `annotations` table for current state
  - `annotation_logs` table for audit trail
  - Foreign key constraints for data integrity
  - CASCADE delete for cleanup

---

## Future Enhancements (Out of Scope)

The following were explicitly excluded from this implementation:
- ❌ Saving multiple versions of annotated images
- ❌ Switching between different annotation versions in UI
- ❌ Multi-user collaboration features
- ❌ Real-time model retraining
- ❌ Annotation history timeline/playback

---

## Testing Checklist

- [x] Database schema created successfully
- [x] Annotations save to database
- [x] Annotations reload on inspection open
- [x] Resize handles appear when annotation selected
- [x] Resizing works correctly (all 4 corners)
- [x] Repositioning works correctly (drag to move)
- [x] Manual box drawing works
- [x] Delete with comment validation (AI detections)
- [x] Auto-save triggers after edits
- [x] Metadata displays in hover tooltip
- [x] Metadata displays in Analysis Log table
- [x] Annotation logs created on actions
- [x] JSON export works and contains data
- [x] CSV export works and contains data
- [x] Settings page simplified
- [x] Export buttons functional

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running (`python app.py`)
3. Check database was initialized (`python database.py`)
4. Ensure all dependencies installed (`pip install -r requirements.txt`)
