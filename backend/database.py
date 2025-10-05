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

if __name__ == '__main__':
    # Command to run from terminal in the 'backend' folder: python database.py
    init_db()