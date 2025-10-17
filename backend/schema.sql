DROP TABLE IF EXISTS annotation_logs;
DROP TABLE IF EXISTS annotations;
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS transformers;

CREATE TABLE transformers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    pole TEXT,
    region TEXT,
    type TEXT,
    baselineImage TEXT,
    baselineUploadDate TEXT,
    weather TEXT,
    location TEXT
);

CREATE TABLE inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transformer_id INTEGER NOT NULL,
    date TEXT,
    inspectedDate TEXT,
    inspector TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Pending',
    maintenanceImage TEXT,
    maintenanceUploadDate TEXT,
    maintenanceWeather TEXT,
    annotatedImage TEXT,
    anomalies TEXT, -- Stored as JSON string
    progressStatus TEXT, -- Stored as JSON string
    FOREIGN KEY (transformer_id) REFERENCES transformers (id)
);

-- Table to store individual annotations with metadata
CREATE TABLE annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    annotation_id TEXT UNIQUE NOT NULL, -- The unique ID from frontend (e.g., 'ai_1', 'user_123')
    x REAL NOT NULL,
    y REAL NOT NULL,
    w REAL NOT NULL,
    h REAL NOT NULL,
    confidence REAL,
    severity TEXT,
    classification TEXT,
    comment TEXT,
    source TEXT NOT NULL, -- 'ai' or 'user'
    deleted INTEGER DEFAULT 0, -- 0 = active, 1 = deleted
    user_id TEXT DEFAULT 'Admin',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
);

-- Table to track annotation changes for model feedback and improvement
CREATE TABLE annotation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    transformer_id INTEGER NOT NULL,
    image_id TEXT, -- Reference to the annotated image
    action_type TEXT NOT NULL, -- 'added', 'edited', 'deleted', 'ai_generated'
    annotation_data TEXT NOT NULL, -- JSON string of the annotation state
    ai_prediction TEXT, -- Original AI prediction (JSON) if applicable
    user_annotation TEXT, -- Final user-modified annotation (JSON)
    user_id TEXT DEFAULT 'Admin',
    timestamp TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE,
    FOREIGN KEY (transformer_id) REFERENCES transformers (id) ON DELETE CASCADE
);