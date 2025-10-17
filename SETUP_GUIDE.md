# Setup Guide for Annotation Features

## Quick Start

Follow these steps to set up and use the new annotation features.

---

## 1. Backend Setup

### Step 1: Navigate to Backend Directory
```cmd
cd "c:\Users\Dinneth Perera\Desktop\Sem 7\Software Design Competition\core4\backend"
```

### Step 2: Migrate Database
Run the migration script to add new annotation tables:
```cmd
python migrate_database.py
```

**What this does:**
- Backs up your existing database (if it exists)
- Creates new `annotations` and `annotation_logs` tables
- Preserves all existing transformer and inspection data

**Expected output:**
```
============================================================
Database Migration Tool - Annotation Features
============================================================
✓ Database backed up to backend_backup.db
✓ Created 'annotations' table
✓ Created 'annotation_logs' table

✓ Migration completed successfully!
```

### Step 3: Start Backend Server
```cmd
python app.py
```

**Expected output:**
```
 * Running on http://0.0.0.0:8000
 * Debug mode: on
```

---

## 2. Frontend Setup

### Step 1: Navigate to Frontend Directory
Open a new terminal:
```cmd
cd "c:\Users\Dinneth Perera\Desktop\Sem 7\Software Design Competition\core4\core4"
```

### Step 2: Install Dependencies (if needed)
```cmd
npm install
```

### Step 3: Start Frontend Server
```cmd
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view core4 in the browser.
  Local:            http://localhost:3000
```

---

## 3. Testing the Features

### Test FR3.1: Interactive Annotation Tools

1. **Open an Inspection:**
   - Navigate to the Inspection tab
   - Click "View" on any existing inspection
   - OR create a new inspection and upload images

2. **Run AI Analysis:**
   - Upload baseline image
   - Upload thermal/maintenance image
   - Adjust the detection threshold slider
   - Click "Run AI Analysis"
   - Wait for AI-detected anomalies to appear

3. **Adjust Existing Annotations:**
   - **Resize:** Click on any anomaly box → Drag corner handles to resize
   - **Reposition:** Click on any anomaly box → Drag the box to move it
   - **Edit:** Add comments in the Analysis Log table
   - **Delete:** Click "Delete" button (AI detections require a comment first)

4. **Add Manual Annotations:**
   - Click "Add Manual Box" button
   - Click and drag on the image to draw a box
   - Select severity from dropdown (Faulty/Potentially Faulty/Normal)
   - Select classification from dropdown
   - Add optional comment
   - Click "Cancel Drawing" to exit mode

### Test FR3.2: Metadata and Persistence

1. **Check Auto-Save:**
   - Make changes to annotations (resize, move, add comments)
   - Wait 1 second (auto-save debounce)
   - Check browser console for successful save message
   - Click "Save" button for immediate save

2. **Verify Metadata Display:**
   - **Hover Tooltip:** Hover over any annotation box
     - Should show User, Modified time, Source
   - **Analysis Log Table:** Check the "User/Time" column
     - Should show Created and Updated timestamps
     - Should show User ID

3. **Test Annotation Reload:**
   - Make some changes to annotations
   - Click "Save"
   - Close the inspection modal
   - Reopen the same inspection
   - Verify all annotations are restored exactly as saved

### Test FR3.3: Feedback Integration

1. **Check Annotation Logs:**
   - Make various changes (add, edit, delete annotations)
   - Open browser dev tools → Network tab
   - Look for POST requests to `/api/annotations/<id>`
   - Verify response is 200 OK

2. **Export Annotation Logs:**
   - Navigate to Settings page (sidebar button)
   - Click "Export Annotation Logs (JSON)"
     - Should download `annotation_logs.json`
     - Open file and verify it contains annotation data
   - Click "Export Annotation Logs (CSV)"
     - Should download `annotation_logs.csv`
     - Open in Excel/Notepad and verify format

3. **Verify Log Contents:**
   - Open the exported JSON file
   - Check for these fields:
     ```json
     {
       "id": 1,
       "inspection_id": 1,
       "transformer_id": 1,
       "action_type": "added",
       "annotation_data": {...},
       "ai_prediction": {...},
       "user_annotation": {...},
       "user_id": "Admin",
       "timestamp": "2025-01-01T12:00:00"
     }
     ```

---

## 4. Troubleshooting

### Backend Issues

**Problem:** Migration script fails
```
✗ Migration failed: no such table: inspections
```
**Solution:** Reinitialize the entire database:
```cmd
python migrate_database.py
# Choose option 2 when prompted
```

**Problem:** Backend won't start
```
ModuleNotFoundError: No module named 'flask'
```
**Solution:** Install requirements:
```cmd
pip install -r requirements.txt
```

**Problem:** 404 errors on API endpoints
**Solution:** 
- Ensure backend is running on port 8000
- Check `http://localhost:8000/api/transformers` in browser

### Frontend Issues

**Problem:** "Failed to save annotations" alert
**Solution:**
- Check backend is running
- Check browser console for detailed error
- Verify inspection has an `id` field

**Problem:** Annotations don't show up
**Solution:**
- Check Network tab for failed requests
- Verify database has data: `sqlite3 backend.db "SELECT * FROM annotations;"`
- Clear browser cache and reload

**Problem:** Resize handles don't appear
**Solution:**
- Click on an annotation box to select it first
- Only selected annotations show handles
- Check browser console for JavaScript errors

---

## 5. Database Verification

### Check Database Tables
```cmd
cd backend
sqlite3 backend.db
```

```sql
-- List all tables
.tables

-- Check annotations table structure
.schema annotations

-- View annotation data
SELECT * FROM annotations;

-- Check annotation logs
SELECT id, action_type, user_id, timestamp FROM annotation_logs;

-- Exit SQLite
.exit
```

---

## 6. Feature Checklist

Use this checklist to verify all features are working:

### FR3.1 - Interactive Annotation Tools
- [ ] Can resize annotations by dragging corner handles
- [ ] Can reposition annotations by dragging
- [ ] Can delete AI detections (with comment requirement)
- [ ] Can delete manual annotations (no comment required)
- [ ] Can add new manual annotations with drawing tool
- [ ] Manual annotations have severity dropdown
- [ ] Manual annotations have classification dropdown
- [ ] Can add comments to any annotation
- [ ] Selected annotations show visual feedback (thicker border)
- [ ] Cursor changes appropriately (grab/grabbing)

### FR3.2 - Metadata and Persistence
- [ ] Annotations auto-save after 1 second
- [ ] Manual save button works
- [ ] Annotations reload when reopening inspection
- [ ] Hover tooltip shows metadata (user, time, source)
- [ ] Analysis Log shows created/updated timestamps
- [ ] Analysis Log shows user ID
- [ ] All metadata persists across sessions

### FR3.3 - Feedback Integration
- [ ] Annotation logs created on add/edit/delete
- [ ] JSON export downloads successfully
- [ ] CSV export downloads successfully
- [ ] Exported data contains all required fields
- [ ] AI predictions tracked separately from user annotations
- [ ] Action types correctly logged (added/edited/deleted)
- [ ] Timestamps in ISO format

---

## 7. API Testing (Optional)

### Test Endpoints with cURL

**Save annotations:**
```cmd
curl -X POST http://localhost:8000/api/annotations/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"annotations\": [{\"id\": \"test_1\", \"x\": 100, \"y\": 100, \"w\": 50, \"h\": 50, \"source\": \"user\"}], \"user_id\": \"Admin\", \"transformer_id\": 1}"
```

**Get annotations:**
```cmd
curl http://localhost:8000/api/annotations/1
```

**Get annotation logs:**
```cmd
curl http://localhost:8000/api/annotation-logs
```

**Export JSON:**
```cmd
curl http://localhost:8000/api/annotation-logs/export/json > logs.json
```

**Export CSV:**
```cmd
curl http://localhost:8000/api/annotation-logs/export/csv > logs.csv
```

---

## 8. Common Usage Patterns

### Pattern 1: AI + Manual Review
1. Run AI analysis
2. Review AI detections
3. Delete false positives (add comment explaining why)
4. Add missed anomalies manually
5. Adjust sizes/positions as needed
6. Save (auto-saves anyway)
7. Export feedback logs periodically for model retraining

### Pattern 2: Manual-Only Annotation
1. Skip AI analysis
2. Click "Add Manual Box"
3. Draw all anomalies manually
4. Fill in severity and classification
5. Add detailed comments
6. Annotations save automatically

### Pattern 3: Iterative Improvement
1. Run AI with different thresholds
2. Compare results
3. Keep best annotations
4. Delete duplicates/errors
5. Export logs to track model performance over time

---

## Support

If you encounter issues not covered in this guide:
1. Check `ANNOTATION_FEATURES.md` for detailed documentation
2. Review browser console for JavaScript errors
3. Check backend terminal for Python errors
4. Verify database integrity with SQLite commands
5. Test API endpoints individually with cURL

---

## Next Steps

After successful setup:
1. Create test inspections with sample data
2. Experiment with all annotation tools
3. Export and review annotation logs
4. Use exported data for model improvement
5. Monitor annotation quality over time
