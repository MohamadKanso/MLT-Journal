import sqlite3, os, json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "journal.db")

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# New structured columns to add via migration
NEW_COLUMNS = {
    "model_type":             "TEXT",
    "setup_quality":          "TEXT",
    "account_type":           "TEXT",
    "stop_loss_type":         "TEXT",
    "exit_logic":             "TEXT",
    "re_entry_criteria":      "TEXT",
    "trading_rules":          "TEXT",
    "trade_direction_type":   "TEXT",
    "entry_model":            "TEXT",
    "news_type":              "TEXT",
    "rejection_candle_type":  "TEXT",
    "htf_weak_structure":     "TEXT",
    "mtf_weak_structure":     "TEXT",
    "break_of_structure":     "TEXT",
    "entry_confirmation_type":"TEXT",
    "target_type":            "TEXT",
    "emotions":               "TEXT DEFAULT '[]'",
    "dxy_direction":          "TEXT",
    "confluence_tags":        "TEXT DEFAULT '[]'",
    "condition_tags":         "TEXT DEFAULT '[]'",
    "deleted_at":             "TEXT",
}

def init_db():
    conn = get_conn()
    conn.execute("""
    CREATE TABLE IF NOT EXISTS trades (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at            TEXT DEFAULT (datetime('now')),

        -- Identity
        trade_name            TEXT,
        date                  TEXT,
        time_of_trade         TEXT,
        weekday               TEXT,
        session               TEXT,

        -- Pair & Direction
        pairs                 TEXT DEFAULT 'GBPUSD',
        position              TEXT,

        -- Trade Type & Setup
        trade_type            TEXT,
        type_direction        TEXT,
        setup                 TEXT,
        model_type            TEXT,

        -- Risk & Result
        risk_pct              TEXT,
        rr                    REAL,
        result                TEXT,
        profit_pct            REAL,

        -- Structure (legacy)
        htf_weak              TEXT,
        mtf_weak              TEXT,
        bos                   TEXT,
        htf_pricing           TEXT,
        mtf_pricing           TEXT,
        decisional_extreme    TEXT,
        poi_reaction          TEXT,

        -- Entry (legacy)
        entry_confirmation    TEXT,
        rejection_candle      TEXT,
        order_flow            TEXT,
        conditions            TEXT,
        trade_confluences     TEXT,
        confirmation_risk     TEXT,
        entry_model_time      TEXT,

        -- Management
        stop_loss             TEXT,
        be_criteria           TEXT,
        re_entry              TEXT,
        target                TEXT,
        news                  TEXT,
        rules                 TEXT,

        -- Analysis
        dxy                   TEXT,
        top_down              TEXT,

        -- Grading
        grade                 TEXT,
        why_grade             TEXT,

        -- Psychology & Review
        psycho                TEXT,
        review_lesson         TEXT,

        -- Images (JSON array of objects: {filename, timeframe})
        chart_images          TEXT DEFAULT '[]',
        dxy_chart_images      TEXT DEFAULT '[]',

        -- MT5 link
        mt5_ticket            INTEGER,
        account               TEXT,

        -- ── NEW STRUCTURED FIELDS ──────────────────────
        setup_quality          TEXT,
        account_type           TEXT,
        stop_loss_type         TEXT,
        exit_logic             TEXT,
        re_entry_criteria      TEXT,
        trading_rules          TEXT,
        trade_direction_type   TEXT,
        entry_model            TEXT,
        news_type              TEXT,
        rejection_candle_type  TEXT,
        htf_weak_structure     TEXT,
        mtf_weak_structure     TEXT,
        break_of_structure     TEXT,
        entry_confirmation_type TEXT,
        target_type            TEXT,
        emotions               TEXT DEFAULT '[]',
        dxy_direction          TEXT,
        confluence_tags        TEXT DEFAULT '[]',
        condition_tags         TEXT DEFAULT '[]'
    )
    """)
    conn.commit()

    # Migration: add any missing columns to existing databases
    cur = conn.cursor()
    for col, col_type in NEW_COLUMNS.items():
        try:
            cur.execute(f"ALTER TABLE trades ADD COLUMN {col} {col_type}")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # column already exists

    conn.close()


def save_trade(data):
    conn = get_conn()
    cols = ", ".join(data.keys())
    placeholders = ", ".join(["?" for _ in data])
    cur = conn.execute(
        f"INSERT INTO trades ({cols}) VALUES ({placeholders})",
        list(data.values())
    )
    conn.commit()
    tid = cur.lastrowid
    conn.close()
    return tid


def update_trade(tid, data):
    conn = get_conn()
    sets = ", ".join([f"{k}=?" for k in data.keys()])
    conn.execute(
        f"UPDATE trades SET {sets} WHERE id=?",
        list(data.values()) + [tid]
    )
    conn.commit()
    conn.close()


def delete_trade(tid):
    """Soft-delete: marks with deleted_at timestamp, not a hard delete."""
    conn = get_conn()
    conn.execute("UPDATE trades SET deleted_at=datetime('now') WHERE id=?", (tid,))
    conn.commit()
    conn.close()


def get_trash():
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM trades WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def restore_trade(tid):
    conn = get_conn()
    conn.execute("UPDATE trades SET deleted_at=NULL WHERE id=?", (tid,))
    conn.commit()
    conn.close()


def permanent_delete_trade(tid):
    conn = get_conn()
    conn.execute("DELETE FROM trades WHERE id=?", (tid,))
    conn.commit()
    conn.close()


def get_trade(tid):
    conn = get_conn()
    row = conn.execute("SELECT * FROM trades WHERE id=?", (tid,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_trades(filters=None):
    conn = get_conn()
    query = "SELECT * FROM trades WHERE deleted_at IS NULL"
    vals = []
    if filters:
        for k, v in filters.items():
            if v and v != "all":
                if k in ["trade_confluences", "conditions", "confluence_tags"]:
                    query += f" AND {k} LIKE ?"
                    vals.append(f"%{v}%")
                else:
                    query += f" AND {k}=?"
                    vals.append(v)
    query += " ORDER BY date DESC, id DESC"
    rows = conn.execute(query, vals).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_stats():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM trades WHERE deleted_at IS NULL").fetchall()
    conn.close()
    trades = [dict(r) for r in rows]
    if not trades:
        return {"total": 0}

    def is_win(t):
        return t.get("result") in ("Take-Profit", "Breakeven - TP", "Partial Win")
    def is_loss(t):
        return t.get("result") in ("Stop-Loss", "Partial Loss")
    def is_be(t):
        return t.get("result") in ("Breakeven", "Breakeven - SL")

    wins   = [t for t in trades if is_win(t)]
    losses = [t for t in trades if is_loss(t)]
    bes    = [t for t in trades if is_be(t)]
    total  = len(trades)

    rrs          = [t["rr"] for t in trades if t.get("rr")]
    profits      = [t["profit_pct"] for t in trades if t.get("profit_pct") is not None]
    win_profits  = [t["profit_pct"] for t in wins   if t.get("profit_pct") is not None]
    loss_profits = [t["profit_pct"] for t in losses if t.get("profit_pct") is not None]

    win_rate  = round(len(wins) / total * 100, 1) if total else 0
    avg_rr    = round(sum(rrs) / len(rrs), 2) if rrs else 0
    avg_win   = round(sum(win_profits)  / len(win_profits),  2) if win_profits  else 0
    avg_loss  = round(sum(loss_profits) / len(loss_profits), 2) if loss_profits else 0
    total_pnl = round(sum(profits), 2) if profits else 0
    pf = round(abs(sum(win_profits) / sum(loss_profits)), 2) if loss_profits and sum(loss_profits) != 0 else 0
    exp = round((win_rate / 100 * avg_win) + ((1 - win_rate / 100) * avg_loss), 2) if profits else 0

    # Cumulative PnL curve
    sorted_t = sorted(trades, key=lambda x: (x.get("date") or "", x.get("id", 0)))
    cum = []
    running = 0
    for t in sorted_t:
        running += (t.get("profit_pct") or 0)
        cum.append({
            "date":   t.get("date", ""),
            "name":   t.get("trade_name", ""),
            "pnl":    round(running, 2),
            "result": t.get("result", ""),
        })

    # Max drawdown
    peak, max_dd = 0, 0
    for p in cum:
        if p["pnl"] > peak: peak = p["pnl"]
        dd = peak - p["pnl"]
        if dd > max_dd: max_dd = dd

    # Consecutive wins / losses
    max_cons_wins = max_cons_losses = cur_w = cur_l = 0
    for t in sorted_t:
        if is_win(t):   cur_w += 1; cur_l = 0
        elif is_loss(t): cur_l += 1; cur_w = 0
        else: cur_w = 0; cur_l = 0
        max_cons_wins   = max(max_cons_wins,   cur_w)
        max_cons_losses = max(max_cons_losses, cur_l)

    def breakdown(key):
        d = {}
        for t in trades:
            k = t.get(key) or "Unknown"
            d.setdefault(k, {"wins": 0, "losses": 0, "bes": 0, "total": 0, "pnl": 0})
            d[k]["total"] += 1
            d[k]["pnl"] = round(d[k]["pnl"] + (t.get("profit_pct") or 0), 2)
            if is_win(t):   d[k]["wins"]   += 1
            elif is_loss(t): d[k]["losses"] += 1
            elif is_be(t):  d[k]["bes"]    += 1
        for k in d:
            d[k]["win_rate"] = round(d[k]["wins"] / d[k]["total"] * 100, 1) if d[k]["total"] else 0
        return d

    # Weekday ordered breakdown
    WEEKDAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    wd_raw = breakdown("weekday")
    by_weekday_ordered = {w: wd_raw.get(w, {"wins":0,"losses":0,"bes":0,"total":0,"pnl":0,"win_rate":0}) for w in WEEKDAY_ORDER}

    # Hour breakdown (from time_of_trade HH:MM)
    by_hour = {}
    for t in trades:
        tstr = t.get("time_of_trade", "") or ""
        try:
            hour = int(tstr.split(":")[0])
        except Exception:
            continue
        by_hour.setdefault(hour, {"wins":0,"losses":0,"bes":0,"total":0,"pnl":0})
        by_hour[hour]["total"] += 1
        by_hour[hour]["pnl"] = round(by_hour[hour]["pnl"] + (t.get("profit_pct") or 0), 2)
        if is_win(t):    by_hour[hour]["wins"]   += 1
        elif is_loss(t): by_hour[hour]["losses"] += 1
        elif is_be(t):   by_hour[hour]["bes"]    += 1
    for h in by_hour:
        by_hour[h]["win_rate"] = round(by_hour[h]["wins"] / by_hour[h]["total"] * 100, 1) if by_hour[h]["total"] else 0

    best  = max(profits) if profits else 0
    worst = min(profits) if profits else 0

    return {
        "total": total, "wins": len(wins), "losses": len(losses), "bes": len(bes),
        "win_rate": win_rate, "avg_rr": avg_rr, "avg_win": avg_win, "avg_loss": avg_loss,
        "total_pnl": total_pnl, "profit_factor": pf, "expectancy": exp,
        "max_drawdown": round(max_dd, 2), "best_trade": round(best, 2), "worst_trade": round(worst, 2),
        "max_cons_wins": max_cons_wins, "max_cons_losses": max_cons_losses,
        "cum_pnl":       cum,
        "by_session":    breakdown("session"),
        "by_weekday":    by_weekday_ordered,
        "by_weekday_raw": breakdown("weekday"),
        "by_hour":       by_hour,
        "by_grade":      breakdown("grade"),
        "by_position":   breakdown("position"),
        "by_setup":      breakdown("setup"),
        "by_trade_type": breakdown("trade_type"),
        "by_result":     breakdown("result"),
        "by_pair":       breakdown("pairs"),
        "by_entry_model":breakdown("entry_model"),
        "by_setup_quality": breakdown("setup_quality"),
        "by_trading_rules": breakdown("trading_rules"),
    }


init_db()
