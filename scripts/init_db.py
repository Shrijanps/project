import sqlite3
import csv
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'real_estate.db')
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'real_estate_dataset.csv')

def hash_password(password: str) -> str:
    """Generate a SHA-256 password hash with salt for secure storage."""
    salt = "estate_secure_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode('utf-8')).hexdigest()

def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Properties Table (Based on real_estate_dataset.csv)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        square_feet REAL NOT NULL,
        num_bedrooms INTEGER NOT NULL,
        num_bathrooms INTEGER NOT NULL,
        num_floors INTEGER NOT NULL,
        year_built INTEGER NOT NULL,
        has_garden INTEGER NOT NULL CHECK(has_garden IN (0, 1)),
        has_pool INTEGER NOT NULL CHECK(has_pool IN (0, 1)),
        garage_size INTEGER NOT NULL,
        location_score REAL NOT NULL,
        distance_to_center REAL NOT NULL,
        price REAL NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    );
    """)

    # 3. Predictions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        input_features TEXT NOT NULL,
        predicted_price REAL NOT NULL,
        selected_model TEXT NOT NULL,
        k_value INTEGER DEFAULT 5,
        distance_metric TEXT DEFAULT 'euclidean',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );
    """)

    # Indexes for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);")

    # Seed Default Users if not exist
    cursor.execute("SELECT COUNT(*) FROM users;")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        admin_pass = hash_password("admin123")
        user_pass = hash_password("user123")
        cursor.execute("""
        INSERT INTO users (name, email, password_hash, role)
        VALUES 
            ('Administrator', 'admin@realestate.com', ?, 'admin'),
            ('Real Estate Analyst', 'analyst@realestate.com', ?, 'user');
        """, (admin_pass, user_pass))
        conn.commit()
        print("Default users seeded successfully (admin@realestate.com, analyst@realestate.com)")

    # Ingest Properties from CSV
    cursor.execute("SELECT COUNT(*) FROM properties;")
    prop_count = cursor.fetchone()[0]
    if prop_count == 0:
        print(f"Reading dataset from {CSV_PATH}...")
        with open(CSV_PATH, 'r') as f:
            reader = csv.DictReader(f)
            records = []
            for row in reader:
                records.append((
                    int(row['ID']),
                    float(row['Square_Feet']),
                    int(row['Num_Bedrooms']),
                    int(row['Num_Bathrooms']),
                    int(row['Num_Floors']),
                    int(row['Year_Built']),
                    int(row['Has_Garden']),
                    int(row['Has_Pool']),
                    int(row['Garage_Size']),
                    float(row['Location_Score']),
                    float(row['Distance_to_Center']),
                    float(row['Price']),
                    1 # created_by Admin
                ))
            cursor.executemany("""
            INSERT INTO properties (
                id, square_feet, num_bedrooms, num_bathrooms, num_floors,
                year_built, has_garden, has_pool, garage_size, location_score,
                distance_to_center, price, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, records)
            conn.commit()
        print(f"Successfully ingested {len(records)} property records into SQLite database.")
    else:
        print(f"Properties table already contains {prop_count} records.")

    conn.close()

if __name__ == '__main__':
    init_database()
