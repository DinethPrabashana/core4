import sqlite3
import json

DATABASE = 'backend.db'

def get_db_connection():
    """Creates a database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database from the schema file."""
    conn = get_db_connection()
    with open('schema.sql') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("Database initialized.")

def dict_from_row(row):
    """Converts a sqlite3.Row object to a dictionary."""
    if row is None:
        return None
    return dict(row)

# --- Transformer Functions ---

def add_transformer(t):
    """Adds or updates a transformer."""
    conn = get_db_connection()
    # Check if transformer with this ID or number exists
    existing = conn.execute('SELECT id FROM transformers WHERE id = ? OR number = ?', (t.get('id'), t.get('number'))).fetchone()
    
    if existing:
        # Update existing transformer
        t['id'] = existing['id']
        conn.execute(
            'UPDATE transformers SET number = ?, pole = ?, region = ?, type = ?, baselineImage = ?, baselineUploadDate = ?, weather = ?, location = ? WHERE id = ?',
            (t['number'], t['pole'], t['region'], t['type'], t['baselineImage'], t['baselineUploadDate'], t['weather'], t['location'], t['id'])
        )
    else:
        # Insert new transformer
        cursor = conn.execute(
            'INSERT INTO transformers (number, pole, region, type, baselineImage, baselineUploadDate, weather, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (t['number'], t['pole'], t['region'], t['type'], t['baselineImage'], t['baselineUploadDate'], t['weather'], t['location'])
        )
        t['id'] = cursor.lastrowid

    conn.commit()
    conn.close()
    return t

def get_all_transformers():
    """Fetches all transformers."""
    conn = get_db_connection()
    transformers = conn.execute('SELECT * FROM transformers').fetchall()
    conn.close()
    return [dict_from_row(row) for row in transformers]


def get_latest_inspection_for_transformer(transformer_id):
    """Return the latest inspection for a transformer (prefer inspectedDate, fallback to date)."""
    conn = get_db_connection()
    row = conn.execute(
        '''SELECT * FROM inspections WHERE transformer_id = ? ORDER BY 
           COALESCE(inspectedDate, date) DESC LIMIT 1''',
        (transformer_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    insp = dict_from_row(row)
    insp['transformer'] = insp.pop('transformer_id')
    if insp.get('anomalies'):
        try:
            insp['anomalies'] = json.loads(insp['anomalies'])
        except Exception:
            insp['anomalies'] = insp['anomalies']
    if insp.get('progressStatus'):
        try:
            insp['progressStatus'] = json.loads(insp['progressStatus'])
        except Exception:
            insp['progressStatus'] = insp['progressStatus']
    return insp

def delete_transformer(transformer_id):
    """Deletes a transformer and its associated inspections."""
    conn = get_db_connection()
    conn.execute('DELETE FROM inspections WHERE transformer_id = ?', (transformer_id,))
    conn.execute('DELETE FROM transformers WHERE id = ?', (transformer_id,))
    conn.commit()
    conn.close()

def update_transformer_from_inspection(transformer_id, baseline_image, baseline_upload_date, weather):
    """Updates a transformer's baseline info from an inspection modal."""
    conn = get_db_connection()
    conn.execute(
        'UPDATE transformers SET baselineImage = ?, baselineUploadDate = ?, weather = ? WHERE id = ?',
        (baseline_image, baseline_upload_date, weather, transformer_id)
    )
    conn.commit()
    conn.close()

# --- Inspection Functions ---

def add_inspection(i):
    """Adds a new inspection."""
    conn = get_db_connection()
    cursor = conn.execute(
        'INSERT INTO inspections (transformer_id, date, inspector, notes, status, progressStatus) VALUES (?, ?, ?, ?, ?, ?)',
        (i['transformer'], i['date'], i['inspector'], i['notes'], 'Pending', json.dumps(i['progressStatus']))
    )
    i['id'] = cursor.lastrowid
    conn.commit()
    conn.close()
    return i

def get_all_inspections():
    """Fetches all inspections."""
    conn = get_db_connection()
    inspections = conn.execute('SELECT * FROM inspections').fetchall()
    conn.close()
    
    # Deserialize JSON fields
    result = []
    for row in inspections:
        inspection_dict = dict_from_row(row)
        inspection_dict['transformer'] = inspection_dict.pop('transformer_id')
        if inspection_dict.get('anomalies'):
            inspection_dict['anomalies'] = json.loads(inspection_dict['anomalies'])
        if inspection_dict.get('progressStatus'):
            inspection_dict['progressStatus'] = json.loads(inspection_dict['progressStatus'])
        result.append(inspection_dict)
    return result

def update_inspection(i):
    """Updates an existing inspection."""
    conn = get_db_connection()
    conn.execute(
        '''UPDATE inspections SET 
           date = ?, inspectedDate = ?, inspector = ?, notes = ?, status = ?, 
           maintenanceImage = ?, maintenanceUploadDate = ?, maintenanceWeather = ?, 
           annotatedImage = ?, anomalies = ?, progressStatus = ?
           WHERE id = ?''',
        (i.get('date'), i.get('inspectedDate'), i.get('inspector'), i.get('notes'), i.get('status'),
         i.get('maintenanceImage'), i.get('maintenanceUploadDate'), i.get('maintenanceWeather'),
         i.get('annotatedImage'), json.dumps(i.get('anomalies')), json.dumps(i.get('progressStatus')),
         i.get('id'))
    )
    conn.commit()
    conn.close()

def delete_inspection(inspection_id):
    """Deletes an inspection."""
    conn = get_db_connection()
    conn.execute('DELETE FROM inspections WHERE id = ?', (inspection_id,))
    conn.commit()
    conn.close()

# --- Annotation Functions ---

def save_annotations(inspection_id, annotations, user_id='Admin'):
    """Save or update annotations for an inspection.

    Note: The annotations table enforces a UNIQUE constraint on annotation_id.
    To avoid collisions across inspections (e.g., many inspections use 'ai_1'),
    we store a namespaced ID: f"{inspection_id}__{id}" in annotation_id.
    When loading, we strip this prefix back to the original id for the UI.
    """
    from datetime import datetime
    conn = get_db_connection()
    timestamp = datetime.now().isoformat()

    def _to_storage_id(insp_id, ann_id):
        ann_id = str(ann_id)
        prefix = f"{insp_id}__"
        # Avoid double-prefixing if already stored format
        if ann_id.startswith(prefix):
            return ann_id
        return prefix + ann_id

    for annot in annotations:
        storage_id = _to_storage_id(inspection_id, annot['id'])

        # Check if annotation exists for this inspection (by storage id)
        existing = conn.execute(
            'SELECT id FROM annotations WHERE annotation_id = ?',
            (storage_id,)
        ).fetchone()

        if existing:
            # Update existing annotation
            conn.execute(
                '''UPDATE annotations SET 
                   x = ?, y = ?, w = ?, h = ?, confidence = ?, severity = ?, 
                   classification = ?, comment = ?, deleted = ?, updated_at = ?
                   WHERE annotation_id = ?''',
                (annot['x'], annot['y'], annot['w'], annot['h'], 
                 annot.get('confidence'), annot.get('severity'), 
                 annot.get('classification'), annot.get('comment', ''),
                 1 if annot.get('deleted') else 0, timestamp, storage_id)
            )
        else:
            # Insert new annotation
            conn.execute(
                '''INSERT INTO annotations 
                   (inspection_id, annotation_id, x, y, w, h, confidence, severity, 
                    classification, comment, source, deleted, user_id, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (inspection_id, storage_id, annot['x'], annot['y'], annot['w'], annot['h'],
                 annot.get('confidence'), annot.get('severity'), 
                 annot.get('classification'), annot.get('comment', ''),
                 annot.get('source', 'user'), 1 if annot.get('deleted') else 0,
                 user_id, timestamp, timestamp)
            )

    conn.commit()
    conn.close()

def get_annotations(inspection_id):
    """Retrieve all annotations for an inspection.

    Strips the storage prefix '<inspection_id>__' from annotation_id before returning
    to the client so UI sees the original id values.
    """
    conn = get_db_connection()
    annotations = conn.execute(
        'SELECT * FROM annotations WHERE inspection_id = ?',
        (inspection_id,)
    ).fetchall()
    conn.close()

    prefix = f"{inspection_id}__"
    result = []
    for row in annotations:
        d = dict_from_row(row)
        ann_id = d.get('annotation_id')
        if isinstance(ann_id, str) and ann_id.startswith(prefix):
            d['annotation_id'] = ann_id[len(prefix):]
        result.append(d)
    return result

def log_annotation_action(inspection_id, transformer_id, action_type, annotation_data, 
                          ai_prediction=None, user_annotation=None, user_id='Admin', notes=None):
    """Log an annotation action for feedback and model improvement."""
    from datetime import datetime
    conn = get_db_connection()
    timestamp = datetime.now().isoformat()
    
    # Get the annotated image ID from inspection if available
    inspection = conn.execute(
        'SELECT annotatedImage FROM inspections WHERE id = ?',
        (inspection_id,)
    ).fetchone()
    
    image_id = f"inspection_{inspection_id}" if inspection else None
    
    conn.execute(
        '''INSERT INTO annotation_logs 
           (inspection_id, transformer_id, image_id, action_type, annotation_data, 
            ai_prediction, user_annotation, user_id, timestamp, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (inspection_id, transformer_id, image_id, action_type, 
         json.dumps(annotation_data), 
         json.dumps(ai_prediction) if ai_prediction else None,
         json.dumps(user_annotation) if user_annotation else None,
         user_id, timestamp, notes)
    )
    conn.commit()
    conn.close()

def get_annotation_logs(inspection_id=None):
    """Retrieve annotation logs, optionally filtered by inspection."""
    conn = get_db_connection()
    if inspection_id:
        logs = conn.execute(
            'SELECT * FROM annotation_logs WHERE inspection_id = ? ORDER BY timestamp DESC',
            (inspection_id,)
        ).fetchall()
    else:
        logs = conn.execute(
            'SELECT * FROM annotation_logs ORDER BY timestamp DESC'
        ).fetchall()
    conn.close()
    
    result = []
    for row in logs:
        log_dict = dict_from_row(row)
        # Parse JSON fields
        if log_dict.get('annotation_data'):
            log_dict['annotation_data'] = json.loads(log_dict['annotation_data'])
        if log_dict.get('ai_prediction'):
            log_dict['ai_prediction'] = json.loads(log_dict['ai_prediction'])
        if log_dict.get('user_annotation'):
            log_dict['user_annotation'] = json.loads(log_dict['user_annotation'])
        result.append(log_dict)
    return result

def export_annotation_logs_json():
    """Export all annotation logs as JSON with first occurrence per action per annotation.
    Also merges first non-empty notes/comment into the earliest log for better fidelity.
    """
    logs = get_annotation_logs()
    if not logs:
        return json.dumps([])

    # Deduplicate and merge notes/comment, sort ascending for readability
    deduped_logs = first_occurrence_with_merged_notes(logs, sort_order='asc')

    # Build mappings for human-readable identifiers
    conn = get_db_connection()
    try:
        t_rows = conn.execute('SELECT id, number FROM transformers').fetchall()
        transformer_number_by_id = {row['id']: row['number'] for row in t_rows}

        insp_rows = conn.execute('SELECT id, transformer_id FROM inspections ORDER BY transformer_id ASC, id ASC').fetchall()
        insp_counter_by_transformer = {}
        inspection_number_by_id = {}
        for row in insp_rows:
            tid = row['transformer_id']
            insp_counter_by_transformer[tid] = insp_counter_by_transformer.get(tid, 0) + 1
            prefix = transformer_number_by_id.get(tid, str(tid))
            inspection_number_by_id[row['id']] = f"{prefix}-INSP{insp_counter_by_transformer[tid]}"
    finally:
        conn.close()

    # Group logs by inspection and image for output (using human-readable ids)
    structured = {}
    for log in deduped_logs:
        raw_insp_id = log.get('inspection_id')
        raw_trans_id = log.get('transformer_id')
        human_transformer = transformer_number_by_id.get(raw_trans_id, raw_trans_id)
        human_inspection = inspection_number_by_id.get(raw_insp_id, raw_insp_id)

        # Per request, image_id mirrors the inspection number
        human_image_id = human_inspection

        if human_inspection not in structured:
            structured[human_inspection] = {
                'inspection_id': human_inspection,
                'transformer_id': human_transformer,
                'images': {}
            }
        if human_image_id not in structured[human_inspection]['images']:
            structured[human_inspection]['images'][human_image_id] = {
                'image_id': human_image_id,
                'actions': []
            }
        action = {
            'action_type': log.get('action_type'),
            'timestamp': log.get('timestamp'),
            'user_id': log.get('user_id'),
            'notes': log.get('notes', ''),
            'annotation': log.get('annotation_data'),
            'ai_prediction': log.get('ai_prediction'),
            'user_annotation': log.get('user_annotation')
        }
        structured[human_inspection]['images'][human_image_id]['actions'].append(action)

    # Convert dict to list for output
    output = []
    for insp in structured.values():
        insp['images'] = list(insp['images'].values())
        output.append(insp)
    return json.dumps(output, indent=2)

def export_annotation_logs_csv():
    """Export annotation logs as CSV format."""
    import csv
    from io import StringIO

    logs = get_annotation_logs()
    if not logs:
        return ""

    # Deduplicate and merge notes/comment, sorted by timestamp ascending
    deduped_logs = first_occurrence_with_merged_notes(logs, sort_order='asc')

    # Build mapping for human-readable identifiers
    # - transformer_id -> transformer.number
    # - inspection_id -> f"{transformer.number}-INSP{index}" where index is per-transformer order by inspection id ASC
    conn = get_db_connection()
    try:
        t_rows = conn.execute('SELECT id, number FROM transformers').fetchall()
        transformer_number_by_id = {row['id']: row['number'] for row in t_rows}

        insp_rows = conn.execute('SELECT id, transformer_id FROM inspections ORDER BY transformer_id ASC, id ASC').fetchall()
        insp_counter_by_transformer = {}
        inspection_number_by_id = {}
        for row in insp_rows:
            tid = row['transformer_id']
            insp_counter_by_transformer[tid] = insp_counter_by_transformer.get(tid, 0) + 1
            prefix = transformer_number_by_id.get(tid, str(tid))
            inspection_number_by_id[row['id']] = f"{prefix}-INSP{insp_counter_by_transformer[tid]}"
    finally:
        conn.close()

    output = StringIO()
    fieldnames = [
        'inspection_id', 'transformer_id', 'image_id', 'action_type',
        'timestamp', 'user_id', 'notes', 'annotation', 'ai_prediction', 'user_annotation'
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for log in deduped_logs:
        # Map to readable ids
        human_transformer = transformer_number_by_id.get(log.get('transformer_id')) if 'transformer_number_by_id' in locals() else None
        human_inspection = inspection_number_by_id.get(log.get('inspection_id')) if 'inspection_number_by_id' in locals() else None

        writer.writerow({
            # Use inspection number for inspection_id
            'inspection_id': human_inspection or log.get('inspection_id'),
            # Use transformer number for transformer_id
            'transformer_id': human_transformer or log.get('transformer_id'),
            # Use inspection number for image_id (as requested)
            'image_id': human_inspection or (log.get('image_id') or ''),
            'action_type': log.get('action_type'),
            'timestamp': log.get('timestamp'),
            'user_id': log.get('user_id'),
            'notes': log.get('notes', ''),
            'annotation': json.dumps(log.get('annotation_data'), ensure_ascii=False) if log.get('annotation_data') else '',
            'ai_prediction': json.dumps(log.get('ai_prediction'), ensure_ascii=False) if log.get('ai_prediction') else '',
            'user_annotation': json.dumps(log.get('user_annotation'), ensure_ascii=False) if log.get('user_annotation') else ''
        })
    return output.getvalue()


def first_occurrence_only(logs, sort_order='desc'):
    """Return only the first occurrence (earliest timestamp) of each action per annotation.

    Key is (inspection_id, annotation_id, action_type). Annotation id is taken from
    annotation_data.id when available; otherwise, falls back to a stable representation.

    sort_order: 'asc' or 'desc' on timestamp for the returned list.
    """
    from datetime import datetime

    if not logs:
        return []

    earliest_by_key = {}
    for log in logs:
        ann = log.get('annotation_data') or {}
        ann_id = None
        if isinstance(ann, dict):
            ann_id = ann.get('id')
        if ann_id is None:
            try:
                ann_id = json.dumps(ann, sort_keys=True)
            except Exception:
                ann_id = str(ann)

        key = (log.get('inspection_id'), ann_id, log.get('action_type'))
        ts_str = log.get('timestamp') or ""
        try:
            ts_val = datetime.fromisoformat(ts_str)
        except Exception:
            ts_val = ts_str

        if key not in earliest_by_key:
            earliest_by_key[key] = (ts_val, log)
        else:
            existing_ts, _ = earliest_by_key[key]
            if (hasattr(ts_val, 'timestamp') and hasattr(existing_ts, 'timestamp') and ts_val < existing_ts) or \
               (not hasattr(ts_val, 'timestamp') and ts_val < existing_ts):
                earliest_by_key[key] = (ts_val, log)

    result = [item[1] for item in earliest_by_key.values()]

    def sort_key(l):
        try:
            return datetime.fromisoformat(l.get('timestamp') or "")
        except Exception:
            return l.get('timestamp') or ""

    reverse = (sort_order == 'desc')
    result.sort(key=sort_key, reverse=reverse)
    return result


def _parse_ts(ts_str):
    from datetime import datetime
    try:
        return datetime.fromisoformat(ts_str or "")
    except Exception:
        return ts_str or ""


def first_occurrence_with_merged_notes(logs, sort_order='asc'):
    """Return earliest log per key, but merge first non-empty notes/comment from later logs in same key.

    - Key: (inspection_id, annotation_id, action_type)
    - Earliest log by timestamp is the base record.
    - If base has empty notes, take the first non-empty notes found chronologically in the group.
    - If base annotation_data/user_annotation lack `comment` or it is empty, and a later log has non-empty comment,
      merge that comment into those nested objects for output fidelity.
    - sort_order: 'asc' or 'desc' for returned list.
    """
    if not logs:
        return []

    # Group logs by key
    groups = {}
    for log in logs:
        ann = log.get('annotation_data') or {}
        ann_id = None
        if isinstance(ann, dict):
            ann_id = ann.get('id')
        if ann_id is None:
            try:
                ann_id = json.dumps(ann, sort_keys=True)
            except Exception:
                ann_id = str(ann)
        key = (log.get('inspection_id'), ann_id, log.get('action_type'))
        groups.setdefault(key, []).append(log)

    merged = []
    for key, glogs in groups.items():
        # sort ascending by timestamp to find earliest and then scan for first non-empty notes/comment
        glogs_sorted = sorted(glogs, key=lambda l: _parse_ts(l.get('timestamp') or ""))
        base = dict(glogs_sorted[0])  # shallow copy of earliest

        # Helper to read notes/comment
        def _get_notes(l):
            n = l.get('notes')
            return (n or '').strip()
        def _get_comment_from_annotation(l):
            ann = l.get('annotation_data') or {}
            if isinstance(ann, dict):
                c = ann.get('comment')
                return (c or '').strip()
            return ''

        # Find first non-empty notes/comment in chronological order
        first_notes = _get_notes(base)
        if not first_notes:
            for l in glogs_sorted[1:]:
                cand = _get_notes(l)
                if cand:
                    first_notes = cand
                    break

        first_comment = _get_comment_from_annotation(base)
        if not first_comment:
            for l in glogs_sorted[1:]:
                cand = _get_comment_from_annotation(l)
                if cand:
                    first_comment = cand
                    break

        # Merge into base copy for output
        if first_notes:
            base['notes'] = first_notes

        # Merge comment into annotation_data and user_annotation if present and missing/empty
        if first_comment:
            try:
                if isinstance(base.get('annotation_data'), dict):
                    if not (base['annotation_data'].get('comment') or '').strip():
                        base['annotation_data'] = dict(base['annotation_data'])
                        base['annotation_data']['comment'] = first_comment
                if isinstance(base.get('user_annotation'), dict):
                    if not (base['user_annotation'].get('comment') or '').strip():
                        base['user_annotation'] = dict(base['user_annotation'])
                        base['user_annotation']['comment'] = first_comment
            except Exception:
                pass

        merged.append(base)

    # Sort final list
    reverse = (sort_order == 'desc')
    merged.sort(key=lambda l: _parse_ts(l.get('timestamp') or ""), reverse=reverse)
    return merged

# --- Maintenance Records (Phase 4) ---

def _json_dumps_or_none(obj):
    try:
        return json.dumps(obj) if obj is not None else None
    except Exception:
        return None

def _json_loads_or_passthrough(val):
    if val is None:
        return None
    try:
        return json.loads(val)
    except Exception:
        return val

def add_maintenance_record(record):
    """Create a maintenance record.

    Expected record keys:
      transformer_id (int), inspection_id (int or None), record_timestamp (str),
      engineer_name (str), status (str), readings (dict), recommended_action (str),
      notes (str), annotated_image (str), anomalies (list)
    """
    from datetime import datetime
    conn = get_db_connection()
    now = datetime.now().isoformat()
    cursor = conn.execute(
        '''INSERT INTO maintenance_records
           (transformer_id, inspection_id, record_timestamp, engineer_name, status, readings, recommended_action, notes, annotated_image, anomalies, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            record.get('transformer_id'),
            record.get('inspection_id'),
            record.get('record_timestamp') or now,
            record.get('engineer_name'),
            record.get('status'),
            _json_dumps_or_none(record.get('readings')),
            record.get('recommended_action'),
            record.get('notes'),
            record.get('annotated_image'),
            _json_dumps_or_none(record.get('anomalies')),
            now,
            now
        )
    )
    new_id = cursor.lastrowid
    conn.commit()
    # Return the row
    row = conn.execute('SELECT * FROM maintenance_records WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    rec = dict_from_row(row)
    rec['readings'] = _json_loads_or_passthrough(rec.get('readings'))
    rec['anomalies'] = _json_loads_or_passthrough(rec.get('anomalies'))
    return rec

def update_maintenance_record(record_id, record):
    """Update an existing maintenance record by id."""
    from datetime import datetime
    conn = get_db_connection()
    now = datetime.now().isoformat()
    conn.execute(
        '''UPDATE maintenance_records SET
               transformer_id = ?,
               inspection_id = ?,
               record_timestamp = ?,
               engineer_name = ?,
               status = ?,
               readings = ?,
               recommended_action = ?,
               notes = ?,
               annotated_image = ?,
               anomalies = ?,
               updated_at = ?
           WHERE id = ?''',
        (
            record.get('transformer_id'),
            record.get('inspection_id'),
            record.get('record_timestamp') or now,
            record.get('engineer_name'),
            record.get('status'),
            _json_dumps_or_none(record.get('readings')),
            record.get('recommended_action'),
            record.get('notes'),
            record.get('annotated_image'),
            _json_dumps_or_none(record.get('anomalies')),
            now,
            record_id
        )
    )
    conn.commit()
    row = conn.execute('SELECT * FROM maintenance_records WHERE id = ?', (record_id,)).fetchone()
    conn.close()
    if not row:
        return None
    rec = dict_from_row(row)
    rec['readings'] = _json_loads_or_passthrough(rec.get('readings'))
    rec['anomalies'] = _json_loads_or_passthrough(rec.get('anomalies'))
    return rec

def get_maintenance_record(record_id):
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM maintenance_records WHERE id = ?', (record_id,)).fetchone()
    conn.close()
    if not row:
        return None
    rec = dict_from_row(row)
    rec['readings'] = _json_loads_or_passthrough(rec.get('readings'))
    rec['anomalies'] = _json_loads_or_passthrough(rec.get('anomalies'))
    return rec

def list_maintenance_records(transformer_id=None, inspection_id=None):
    conn = get_db_connection()
    if transformer_id and inspection_id:
        rows = conn.execute(
            'SELECT * FROM maintenance_records WHERE transformer_id = ? AND inspection_id = ? ORDER BY record_timestamp DESC',
            (transformer_id, inspection_id)
        ).fetchall()
    elif transformer_id:
        rows = conn.execute(
            'SELECT * FROM maintenance_records WHERE transformer_id = ? ORDER BY record_timestamp DESC',
            (transformer_id,)
        ).fetchall()
    elif inspection_id:
        rows = conn.execute(
            'SELECT * FROM maintenance_records WHERE inspection_id = ? ORDER BY record_timestamp DESC',
            (inspection_id,)
        ).fetchall()
    else:
        rows = conn.execute('SELECT * FROM maintenance_records ORDER BY record_timestamp DESC').fetchall()
    conn.close()
    result = []
    for r in rows:
        rec = dict_from_row(r)
        rec['readings'] = _json_loads_or_passthrough(rec.get('readings'))
        rec['anomalies'] = _json_loads_or_passthrough(rec.get('anomalies'))
        result.append(rec)
    return result

def delete_maintenance_record(record_id):
    """Delete a maintenance record by id."""
    conn = get_db_connection()
    conn.execute('DELETE FROM maintenance_records WHERE id = ?', (record_id,))
    conn.commit()
    conn.close()

if __name__ == '__main__':
    # Command to run from terminal in the 'backend' folder: python database.py
    init_db()