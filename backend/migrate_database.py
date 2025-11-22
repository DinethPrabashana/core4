"""
Database Migration Script for Annotation Features
This script will update the existing database to include the new annotation tables.
Run this after pulling the latest code changes.
"""

import sqlite3
import os
import sys

DATABASE = 'backend.db'

def backup_database():
    """Create a backup of the current database"""
    if os.path.exists(DATABASE):
        backup_name = DATABASE.replace('.db', '_backup.db')
        import shutil
        shutil.copy2(DATABASE, backup_name)
        print(f"✓ Database backed up to {backup_name}")
        return True
    return False

def check_tables_exist():
    """Check if new tables already exist"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='annotations'")
    annotations_exists = cursor.fetchone() is not None
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='annotation_logs'")
    logs_exists = cursor.fetchone() is not None

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='maintenance_records'")
    records_exists = cursor.fetchone() is not None
    
    conn.close()
    return annotations_exists, logs_exists, records_exists

def migrate_database():
    """Add new annotation tables to existing database"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        # Create annotations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS annotations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                inspection_id INTEGER NOT NULL,
                annotation_id TEXT UNIQUE NOT NULL,
                x REAL NOT NULL,
                y REAL NOT NULL,
                w REAL NOT NULL,
                h REAL NOT NULL,
                confidence REAL,
                severity TEXT,
                classification TEXT,
                comment TEXT,
                source TEXT NOT NULL,
                deleted INTEGER DEFAULT 0,
                user_id TEXT DEFAULT 'Admin',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
            )
        ''')
        print("✓ Created 'annotations' table")
        
        # Create annotation_logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS annotation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                inspection_id INTEGER NOT NULL,
                transformer_id INTEGER NOT NULL,
                image_id TEXT,
                action_type TEXT NOT NULL,
                annotation_data TEXT NOT NULL,
                ai_prediction TEXT,
                user_annotation TEXT,
                user_id TEXT DEFAULT 'Admin',
                timestamp TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE,
                FOREIGN KEY (transformer_id) REFERENCES transformers (id) ON DELETE CASCADE
            )
        ''')
        print("✓ Created 'annotation_logs' table")
        
        # Create maintenance_records table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS maintenance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transformer_id INTEGER NOT NULL,
                inspection_id INTEGER,
                record_timestamp TEXT NOT NULL,
                engineer_name TEXT,
                status TEXT,
                readings TEXT,
                recommended_action TEXT,
                notes TEXT,
                annotated_image TEXT,
                anomalies TEXT,
                location TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (transformer_id) REFERENCES transformers (id) ON DELETE CASCADE,
                FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE SET NULL
            )
        ''')
        print("✓ Created 'maintenance_records' table")

        # Attempt to add location column if table existed without it
        try:
            cursor.execute("PRAGMA table_info(maintenance_records)")
            cols = [r[1] for r in cursor.fetchall()]
            if 'location' not in cols:
                cursor.execute('ALTER TABLE maintenance_records ADD COLUMN location TEXT')
                print("✓ Added 'location' column to existing maintenance_records table")
        except Exception as e:
            print(f"(i) Skipped adding location column (maybe already exists): {e}")
        
        conn.commit()
        print("\n✓ Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def reinitialize_database():
    """Completely reinitialize the database from schema.sql"""
    print("\nWARNING: This will delete all existing data!")
    response = input("Are you sure you want to reinitialize? (yes/no): ")
    
    if response.lower() != 'yes':
        print("Reinitialization cancelled.")
        return False
    
    # Backup first
    backup_database()
    
    # Delete existing database
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
        print("✓ Old database removed")
    
    # Initialize from schema
    conn = sqlite3.connect(DATABASE)
    with open('schema.sql', 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    
    print("✓ Database reinitialized from schema.sql")
    return True

def main():
    print("=" * 60)
    print("Database Migration Tool - Annotation Features")
    print("=" * 60)
    
    if not os.path.exists(DATABASE):
        print(f"\nDatabase '{DATABASE}' not found.")
        print("Initializing new database from schema.sql...")
        
        if not os.path.exists('schema.sql'):
            print("ERROR: schema.sql not found!")
            sys.exit(1)
        
        conn = sqlite3.connect(DATABASE)
        with open('schema.sql', 'r') as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()
        print("✓ New database created successfully!")
        return
    
    # Check what already exists
    annotations_exists, logs_exists, records_exists = check_tables_exist()
    
    if annotations_exists and logs_exists and records_exists:
        print("\n✓ Annotation tables already exist. No migration needed.")
        print("\nOptions:")
        print("1. Exit (no changes)")
        print("2. Reinitialize database (deletes all data)")
        
        choice = input("\nEnter choice (1 or 2): ")
        
        if choice == '2':
            reinitialize_database()
        else:
            print("No changes made.")
        return
    
    # Perform migration
    print("\nExisting database found. Preparing migration...")
    print(f"  - Annotations table exists: {annotations_exists}")
    print(f"  - Annotation logs table exists: {logs_exists}")
    print(f"  - Maintenance records table exists: {records_exists}")
    
    # Create backup
    if backup_database():
        print("\nProceeding with migration...")
        migrate_database()
    else:
        print("\nNo backup needed. Creating new tables...")
        migrate_database()
    
    print("\n" + "=" * 60)
    print("Migration complete! You can now use the annotation features.")
    print("=" * 60)

if __name__ == '__main__':
    main()
