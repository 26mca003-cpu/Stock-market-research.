import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("DATABASE_URL not found")
    exit(1)

with open("schema.sql", "r") as f:
    sql = f.read()

# Only run the new part
new_sql = sql.split("-- ===== ADMIN / MONITORING TABLES =====")[1]

conn = psycopg2.connect(DB_URL)
conn.autocommit = True
with conn.cursor() as cur:
    print("Applying new schema part...")
    cur.execute(new_sql)
    print("Successfully applied new schema.")
conn.close()
