import json
import sqlite3
from datetime import datetime, timezone
from .config import CACHE_DB

DDL = """
CREATE TABLE IF NOT EXISTS api_cache(
 service TEXT NOT NULL,
 cache_key TEXT NOT NULL,
 input_address TEXT NOT NULL,
 http_status INTEGER,
 payload TEXT,
 error TEXT,
 created_at TEXT NOT NULL,
 PRIMARY KEY(service, cache_key)
);
"""

def _connection():
    CACHE_DB.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(CACHE_DB)
    connection.execute(DDL); connection.commit()
    return connection

def get(service, cache_key):
    connection = _connection()
    try:
        row = connection.execute("SELECT http_status,payload,error FROM api_cache WHERE service=? AND cache_key=?",
                                 (service, cache_key)).fetchone()
    finally:
        connection.close()
    if not row: return None
    return {"status": row[0], "payload": json.loads(row[1]) if row[1] else None,
            "error": row[2], "cached": True}

def put(service, cache_key, input_address, status, payload, error=None):
    connection = _connection()
    try:
        connection.execute("""INSERT OR REPLACE INTO api_cache
            (service,cache_key,input_address,http_status,payload,error,created_at) VALUES(?,?,?,?,?,?,?)""",
            (service, cache_key, input_address, status,
             json.dumps(payload, ensure_ascii=False) if payload is not None else None,
             error, datetime.now(timezone.utc).isoformat()))
        connection.commit()
    finally:
        connection.close()
