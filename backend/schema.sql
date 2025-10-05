DROP TABLE IF EXISTS transformers;
DROP TABLE IF EXISTS inspections;

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