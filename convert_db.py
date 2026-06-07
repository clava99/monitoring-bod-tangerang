import sqlite3
import re
import os

# 1. Tentukan nama file database SQLite baru Anda
SQLITE_DB = "sigmon.db"
SQL_DUMP_FILE = "database_backup.sql"

print("Memulai proses konversi PostgreSQL ke SQLite...")

# 2. Hubungkan ke SQLite dan buat strukturnya yang kompatibel
conn = sqlite3.connect(SQLITE_DB)
cursor = conn.cursor()

# Membuat tabel dengan format SQLite
cursor.executescript("""
CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT, wilayah TEXT, region TEXT, area TEXT, cabang_id TEXT, unit TEXT NOT NULL,
    noa REAL, noc INTEGER, os_aktif REAL, lending REAL, noa_par INTEGER, os_par REAL,
    noa_npl INTEGER, os_npl REAL, os_3r REAL, noa_lar INTEGER, os_lar REAL, pct_rr REAL,
    target_noc INTEGER, target_os REAL, target_lending REAL, gap_noc INTEGER, gap_os REAL,
    gap_lending REAL, pct_noc REAL, pct_os REAL, pct_lending REAL, pct_os_npl REAL, ao INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT, source TEXT, status TEXT, records_count INTEGER DEFAULT 0,
    error_message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL, email TEXT NOT NULL, hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'staff', is_active BOOLEAN DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")
conn.commit()

# 3. Membaca dan memproses file dump PostgreSQL
if not os.path.exists(SQL_DUMP_FILE):
    print(f"Error: File {SQL_DUMP_FILE} tidak ditemukan!")
    exit()

with open(SQL_DUMP_FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

current_table = None
columns = []
in_copy_mode = False
row_count = 0

for line in lines:
    line_str = line.strip('\n')
    
    # Deteksi awal baris data (COPY tabel FROM stdin)
    if line_str.startswith('COPY '):
        match = re.match(r"COPY public\.(\w+) \((.+)\) FROM stdin;", line_str)
        if match:
            current_table = match.group(1)
            columns = [col.strip() for col in match.group(2).split(',')]
            in_copy_mode = True
            row_count = 0
            print(f"Sedang menyalin data ke tabel: {current_table}...", end="")
        continue
    
    # Deteksi akhir baris data (\.)
    if line_str == r'\.':
        if in_copy_mode:
            print(f" Sukses ({row_count} baris dimasukkan)")
        in_copy_mode = False
        current_table = None
        columns = []
        continue
        
    # Proses input data baris demi baris
    if in_copy_mode:
        # PostgreSQL dump memisahkan kolom menggunakan karakter Tab (\t)
        vals = line_str.split('\t')
        
        # Mengubah penanda NULL (\N) milik postgres menjadi None milik Python (NULL di SQLite)
        processed_vals = [None if v == r'\N' else v for v in vals]
        
        # Susun perintah SQL INSERT
        placeholders = ', '.join(['?'] * len(columns))
        col_names = ', '.join(columns)
        sql_insert = f"INSERT OR REPLACE INTO {current_table} ({col_names}) VALUES ({placeholders})"
        
        cursor.execute(sql_insert, processed_vals)
        row_count += 1

# Simpan perubahan dan tutup koneksi
conn.commit()
conn.close()

print(f"\nSelesai! Database SQLite sukses dibuat dengan nama: {SQLITE_DB}")