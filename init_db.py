import sqlite3
import os

DB_PATH = os.environ.get("DB_PATH", "/app/data/sigmon.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Only init if DB doesn't exist
if not os.path.exists(DB_PATH):
    conn = sqlite3.connect(DB_PATH)
    sql_file = os.path.join(os.path.dirname(__file__), "init_db.sql")
    with open(sql_file) as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")
else:
    print(f"Database already exists at {DB_PATH}")
