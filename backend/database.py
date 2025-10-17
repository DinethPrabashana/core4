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
    """Save or update annotations for an inspection."""
    from datetime import datetime
    conn = get_db_connection()
    timestamp = datetime.now().isoformat()
    
    for annot in annotations:
        # Check if annotation exists
        existing = conn.execute(
            'SELECT id FROM annotations WHERE annotation_id = ?',
            (annot['id'],)
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
                 1 if annot.get('deleted') else 0, timestamp, annot['id'])
            )
        else:
            # Insert new annotation
            conn.execute(
                '''INSERT INTO annotations 
                   (inspection_id, annotation_id, x, y, w, h, confidence, severity, 
                    classification, comment, source, deleted, user_id, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (inspection_id, annot['id'], annot['x'], annot['y'], annot['w'], annot['h'],
                 annot.get('confidence'), annot.get('severity'), 
                 annot.get('classification'), annot.get('comment', ''),
                 annot.get('source', 'user'), 1 if annot.get('deleted') else 0,
                 user_id, timestamp, timestamp)
            )
    
    conn.commit()
    conn.close()

def get_annotations(inspection_id):
    """Retrieve all annotations for an inspection."""
    conn = get_db_connection()
    annotations = conn.execute(
        'SELECT * FROM annotations WHERE inspection_id = ?',
        (inspection_id,)
    ).fetchall()
    conn.close()
    return [dict_from_row(row) for row in annotations]

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
    """Export all annotation logs as JSON."""
    logs = get_annotation_logs()
    # Group logs by inspection and transformer
    structured = {}
    for log in logs:
        insp_id = log.get('inspection_id')
        trans_id = log.get('transformer_id')
        image_id = log.get('image_id')
        if insp_id not in structured:
            structured[insp_id] = {
                'inspection_id': insp_id,
                'transformer_id': trans_id,
                'images': {}
            }
        if image_id not in structured[insp_id]['images']:
            structured[insp_id]['images'][image_id] = {
                'image_id': image_id,
                'actions': []
            }
        # Only include essential fields
        action = {
            'action_type': log.get('action_type'),
            'timestamp': log.get('timestamp'),
            'user_id': log.get('user_id'),
            'notes': log.get('notes', ''),
            'annotation': log.get('annotation_data'),
            'ai_prediction': log.get('ai_prediction'),
            'user_annotation': log.get('user_annotation')
        }
        structured[insp_id]['images'][image_id]['actions'].append(action)
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
    output = StringIO()
    fieldnames = [
        'inspection_id', 'transformer_id', 'image_id', 'action_type',
        'timestamp', 'user_id', 'notes', 'annotation', 'ai_prediction', 'user_annotation'
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for log in logs:
        writer.writerow({
            'inspection_id': log.get('inspection_id'),
            'transformer_id': log.get('transformer_id'),
            'image_id': log.get('image_id'),
            'action_type': log.get('action_type'),
            'timestamp': log.get('timestamp'),
            'user_id': log.get('user_id'),
            'notes': log.get('notes', ''),
            'annotation': json.dumps(log.get('annotation_data'), ensure_ascii=False) if log.get('annotation_data') else '',
            'ai_prediction': json.dumps(log.get('ai_prediction'), ensure_ascii=False) if log.get('ai_prediction') else '',
            'user_annotation': json.dumps(log.get('user_annotation'), ensure_ascii=False) if log.get('user_annotation') else ''
        })
    return output.getvalue()

if __name__ == '__main__':
    # Command to run from terminal in the 'backend' folder: python database.py
    init_db()