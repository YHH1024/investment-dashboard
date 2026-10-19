import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "dashboard.db")

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'fund',
        shares REAL DEFAULT 0,
        cost_price REAL DEFAULT 0,
        current_price REAL DEFAULT 0,
        holding_amount REAL DEFAULT 0,
        start_date TEXT,
        holding_days INTEGER DEFAULT 0,
        dca_amount REAL DEFAULT 0,
        dca_frequency TEXT,
        dca_day INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'fund',
        condition_type TEXT NOT NULL DEFAULT 'above',
        target_value REAL NOT NULL,
        action_type TEXT DEFAULT 'notify',
        is_active INTEGER DEFAULT 1,
        is_triggered INTEGER DEFAULT 0,
        triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'fund',
        status TEXT DEFAULT 'observing',
        entry_price REAL DEFAULT 0,
        current_price REAL DEFAULT 0,
        predicted_price REAL DEFAULT 0,
        actual_result REAL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        price REAL NOT NULL,
        shares REAL NOT NULL,
        total REAL NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS portfolio_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        total_assets REAL NOT NULL,
        daily_return REAL,
        cumulative_return REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Check if we need to seed data
    cursor = conn.execute("SELECT COUNT(*) FROM holdings")
    if cursor.fetchone()[0] == 0:
        _seed_data(conn)
    
    conn.commit()
    conn.close()

def _seed_data(conn):
    """Insert default holdings data."""
    holdings = [
        ("000311", "景顺长城沪深300指数增强A", "fund", 0, 2.05, 2.56, 12000, "2026-01-15", 275, 25, "daily", 1),
        ("110011", "易方达中小盘混合", "fund", 2000, 7.20, 6.82, 14400, "2025-06-01", 503, 0, None, 1),
        ("161725", "招商中证白酒指数(LOF)", "fund", 10000, 1.35, 1.45, 13500, "2025-09-10", 402, 500, "weekly", 1),
        ("600036", "招商银行", "stock", 1000, 33.50, 42.45, 0, None, 0, 0, None, 1),
        ("601933", "永辉超市", "stock", 5000, 6.80, 5.82, 0, None, 0, 0, None, 1),
    ]
    for h in holdings:
        conn.execute(
            "INSERT INTO holdings (code, name, type, shares, cost_price, current_price, holding_amount, start_date, holding_days, dca_amount, dca_frequency, dca_day) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            h
        )

# Holdings CRUD
def get_all_holdings():
    conn = get_db()
    rows = conn.execute("SELECT * FROM holdings ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_holding(data):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO holdings (code, name, type, shares, cost_price, current_price, 
        holding_amount, start_date, holding_days, dca_amount, dca_frequency, dca_day)
        VALUES (:code, :name, :type, :shares, :cost_price, :current_price,
        :holding_amount, :start_date, :holding_days, :dca_amount, :dca_frequency, :dca_day)""",
        data
    )
    conn.commit()
    data["id"] = cursor.lastrowid
    conn.close()
    return data

def update_holding(holding_id, data):
    conn = get_db()
    fields = []
    values = []
    for k, v in data.items():
        if k != "id":
            fields.append(f"{k} = ?")
            values.append(v)
    values.append(holding_id)
    conn.execute(f"UPDATE holdings SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", values)
    conn.commit()
    conn.close()

def delete_holding(holding_id):
    conn = get_db()
    conn.execute("DELETE FROM holdings WHERE id = ?", (holding_id,))
    conn.commit()
    conn.close()

# Alerts CRUD
def get_all_alerts():
    conn = get_db()
    rows = conn.execute("SELECT * FROM alerts ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_alert(data):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO alerts (code, name, type, condition_type, target_value, action_type) VALUES (?,?,?,?,?,?)",
        (data["code"], data["name"], data["type"], data["condition"], data["target_value"], data.get("action_type", "notify"))
    )
    conn.commit()
    data["id"] = cursor.lastrowid
    conn.close()
    return data

def delete_alert(alert_id):
    conn = get_db()
    conn.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()

# Watchlist CRUD
def get_all_watchlist():
    conn = get_db()
    rows = conn.execute("SELECT * FROM watchlist ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_watch(data):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO watchlist (code, name, type, entry_price, current_price, predicted_price) VALUES (?,?,?,?,?,?)",
        (data["code"], data["name"], data["type"], data.get("entry_price", 0), data.get("current_price", 0), data.get("predicted_price", 0))
    )
    conn.commit()
    data["id"] = cursor.lastrowid
    conn.close()
    return data

def delete_watch(watch_id):
    conn = get_db()
    conn.execute("DELETE FROM watchlist WHERE id = ?", (watch_id,))
    conn.commit()
    conn.close()

# Settings
def get_setting(key, default=None):
    conn = get_db()
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row["value"])
        except:
            return row["value"]
    return default

def set_setting(key, value):
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        (key, json.dumps(value) if not isinstance(value, str) else value)
    )
    conn.commit()
    conn.close()

def get_all_settings():
    conn = get_db()
    rows = conn.execute("SELECT * FROM settings").fetchall()
    conn.close()
    result = {}
    for r in rows:
        try:
            result[r["key"]] = json.loads(r["value"])
        except:
            result[r["key"]] = r["value"]
    return result

def get_all_transactions(code=None):
    conn = get_db()
    if code:
        rows = conn.execute("SELECT * FROM transactions WHERE code=? ORDER BY date DESC", (code,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM transactions ORDER BY date DESC").fetchall()
    return [dict(r) for r in rows]


def add_transaction(data):
    conn = get_db()
    conn.execute(
        "INSERT INTO transactions (code, name, type, date, amount, price, shares, total, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.get('code'), data.get('name'), data.get('type'), data.get('date'),
         data.get('amount', 0), data.get('price', 0), data.get('shares', 0),
         data.get('total', 0), data.get('note', ''))
    )
    conn.commit()
    return {"ok": True}


def delete_transaction(tx_id):
    conn = get_db()
    conn.execute("DELETE FROM transactions WHERE id=?", (tx_id,))
    conn.commit()
    return {"ok": True}


def get_portfolio_history():
    conn = get_db()
    rows = conn.execute("SELECT * FROM portfolio_history ORDER BY date ASC").fetchall()
    return [dict(r) for r in rows]


def add_portfolio_snapshot(date, total_assets, daily_return=None, cumulative_return=None):
    conn = get_db()
    existing = conn.execute("SELECT id FROM portfolio_history WHERE date=?", (date,)).fetchone()
    if existing:
        conn.execute("UPDATE portfolio_history SET total_assets=?, daily_return=?, cumulative_return=? WHERE date=?",
                     (total_assets, daily_return, cumulative_return, date))
    else:
        conn.execute("INSERT INTO portfolio_history (date, total_assets, daily_return, cumulative_return) VALUES (?, ?, ?, ?)",
                     (date, total_assets, daily_return, cumulative_return))
    conn.commit()
    return {"ok": True}
