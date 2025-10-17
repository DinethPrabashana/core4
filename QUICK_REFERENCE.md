# Quick Reference: Annotation Features

## 🚀 Quick Start (30 seconds)

```bash
# 1. Migrate database
cd backend
python migrate_database.py

# 2. Start backend (Terminal 1)
python app.py

# 3. Start frontend (Terminal 2)
cd ../core4
npm start
```

---

## 🎯 Feature Quick Reference

### Resize Annotations
1. Click annotation box (resize handles appear)
2. Drag corner handles to resize
3. Auto-saves in 1 second

### Move Annotations
1. Click annotation box
2. Drag to new position
3. Auto-saves in 1 second

### Add Manual Annotation
1. Click "Add Manual Box" button
2. Draw box on image (click + drag)
3. Select severity and classification
4. Add optional comment

### Delete Annotation
1. Find annotation in Analysis Log table
2. Click "Delete" button
3. For AI detections: Add comment explaining why
4. Confirm deletion

### Export Feedback Logs
1. Navigate to Settings page (sidebar)
2. Click "Export Annotation Logs (JSON)" or "(CSV)"
3. File downloads automatically

---

## 📋 Keyboard Shortcuts

- **Click**: Select annotation
- **Drag**: Move selected annotation
- **Drag handle**: Resize selected annotation
- **Esc**: (Not implemented - use "Cancel Drawing" button)

---

## 🔍 Troubleshooting

### Backend not responding?
```bash
# Check if running
netstat -ano | findstr :8000

# Restart backend
cd backend
python app.py
```

### Annotations not saving?
- Check browser console (F12)
- Verify backend is running
- Check Network tab for failed requests

### Database issues?
```bash
cd backend
python migrate_database.py  # Option 2 to reinitialize
```

---

## 📊 API Endpoints

```
POST   /api/annotations/<id>              # Save annotations
GET    /api/annotations/<id>              # Get annotations
GET    /api/annotation-logs               # Get all logs
GET    /api/annotation-logs/export/json   # Export JSON
GET    /api/annotation-logs/export/csv    # Export CSV
```

---

## 🗂️ File Locations

```
backend/
  ├── app.py                    # API endpoints
  ├── database.py              # Database functions
  ├── schema.sql               # Database schema
  ├── migrate_database.py      # Migration tool
  └── backend.db               # SQLite database

core4/src/components/
  ├── InspectionViewModal.js   # Annotation UI
  └── SettingsPage.js          # Export UI

Documentation/
  ├── ANNOTATION_FEATURES.md   # Full documentation
  ├── SETUP_GUIDE.md          # Setup instructions
  ├── IMPLEMENTATION_SUMMARY.md # Implementation details
  └── QUICK_REFERENCE.md      # This file
```

---

## ✅ Feature Checklist

**FR3.1 - Interactive Tools**
- [ ] Resize annotations (drag handles)
- [ ] Reposition annotations (drag box)
- [ ] Delete annotations (with comment for AI)
- [ ] Add manual annotations (draw tool)
- [ ] Edit severity/classification
- [ ] Add comments

**FR3.2 - Persistence**
- [ ] Auto-save (1 second debounce)
- [ ] Manual save button
- [ ] Reload on reopen
- [ ] Metadata display (hover tooltip)
- [ ] Timestamps in Analysis Log

**FR3.3 - Feedback**
- [ ] Annotation logs created
- [ ] Export JSON works
- [ ] Export CSV works
- [ ] AI vs User comparison tracked

---

## 💡 Pro Tips

1. **Let auto-save do its thing**: Wait 1 second after edits
2. **Use comments liberally**: Especially when deleting AI detections
3. **Export logs regularly**: For model improvement tracking
4. **Check hover tooltips**: Quick metadata view
5. **Use Analysis Log table**: Comprehensive editing interface

---

## 🆘 Emergency Commands

### Reset Everything
```bash
cd backend
python migrate_database.py  # Choose option 2
```

### Check Database
```bash
cd backend
sqlite3 backend.db
> SELECT * FROM annotations;
> .exit
```

### Backend Status
```bash
curl http://localhost:8000/api/annotation-logs
```

---

## 📞 Need More Help?

1. **Setup Issues**: See `SETUP_GUIDE.md`
2. **Feature Details**: See `ANNOTATION_FEATURES.md`
3. **Implementation**: See `IMPLEMENTATION_SUMMARY.md`

---

**Last Updated**: January 2025  
**Version**: 1.0
