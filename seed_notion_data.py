#!/usr/bin/env python3
"""
Seed script: clears all existing trades and inserts real Notion data.
Run from the KansoTrader project root:
    python3 seed_notion_data.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "journal.db")

# ── Backtest trades from Notion Trade Log ────────────────────────────────────
BACKTEST_TRADES = [
    {
        "trade_name": "1",
        "date": "2024-11-05",
        "time_of_trade": "08:00",
        "entry_model": "EPS+D",
        "type_direction": "External",
        "break_of_structure": "5M and less",
        "htf_weak": "MTF Target",
        "rejection_candle": "Engulf Candle",
        "be_criteria": "SL",
        "news": "No News",
        "result": "Stop-Loss",
        "rr": -1.0,
        "profit_pct": -1.0,
        "review_lesson": "5M OFS was down, 1H BOS down but no 4H close, 4H is bullish and against this trade",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Tuesday",
    },
    {
        "trade_name": "2",
        "date": "2024-11-06",
        "time_of_trade": "09:00",
        "entry_model": "EPS+D",
        "type_direction": "External",
        "break_of_structure": "15M and less",
        "htf_weak": "MTF Target",
        "rejection_candle": "Engulf Candle",
        "be_criteria": "BE after first BOS",
        "news": "No News",
        "result": "Take-Profit",
        "rr": 3.17,
        "profit_pct": 3.17,
        "review_lesson": "5M OFS is down, 1H is down and there is a target but 4H is upwards",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Wednesday",
    },
    {
        "trade_name": "3",
        "date": "2024-11-07",
        "entry_model": "EPS+D",
        "type_direction": "External",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Thursday",
    },
    {
        "trade_name": "4",
        "date": "2024-11-08",
        "entry_model": "EPS+S",
        "type_direction": "External",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Friday",
    },
    {
        "trade_name": "6",
        "date": "2024-11-12",
        "entry_model": "EPS+D",
        "type_direction": "External",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Tuesday",
    },
    {
        "trade_name": "7",
        "date": "2024-11-13",
        "entry_model": "IPS+D",
        "type_direction": "Internal",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Wednesday",
    },
    {
        "trade_name": "8",
        "date": "2024-11-14",
        "entry_model": "EPS+D",
        "type_direction": "External",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Thursday",
    },
    {
        "trade_name": "11",
        "date": "2024-11-19",
        "entry_model": "EPS+D",
        "type_direction": "External",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Tuesday",
    },
    {
        "trade_name": "12 (news win)",
        "date": "2024-11-20",
        "news": "2H After 🔴",
        "result": "Take-Profit",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Wednesday",
    },
    {
        "trade_name": "13",
        "date": "2024-11-21",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Thursday",
    },
    {
        "trade_name": "14",
        "date": "2024-11-22",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Friday",
        "review_lesson": "So close to TP!",
    },
    {
        "trade_name": "15",
        "date": "2024-11-25",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Monday",
    },
    {
        "trade_name": "17",
        "date": "2024-11-27",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Wednesday",
    },
    {
        "trade_name": "19",
        "date": "2024-12-02",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Monday",
    },
    {
        "trade_name": "20",
        "date": "2024-12-03",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Tuesday",
    },
    {
        "trade_name": "21",
        "date": "2024-12-04",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Wednesday",
    },
    {
        "trade_name": "23",
        "date": "2024-12-09",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Monday",
    },
    {
        "trade_name": "24",
        "date": "2024-12-10",
        "trade_type": "Backtest",
        "pairs": "GBPUSD",
        "risk_pct": "1%",
        "session": "London",
        "weekday": "Tuesday",
    },
]

# ── Confirmed main journal trades ────────────────────────────────────────────
MAIN_JOURNAL_TRADES = [
    {
        "trade_name": "Trade (4)",
        "date": "2025-01-16",
        "time_of_trade": "11:55",
        "pairs": "GBPUSD",
        "position": "Short",
        "session": "London",
        "trade_type": "BT",
        "type_direction": "Internal",
        "entry_model": "IPS+S",
        "grade": "A",
        "risk_pct": "1%",
        "rr": 3.35,
        "profit_pct": -1.0,
        "result": "Stop-Loss",
        "weekday": "Thursday",
        "news": ">2 Hours Before",
        "trading_rules": "Rules Followed",
        "entry_model_time": "1-2 Hours",
        "dxy": "DXY is moving down",
        "why_grade": "DXY is moving up H4 and 1H, 4H and 1H target, Trending, 5M ofs, model is good",
    },
]


def get_table_columns(conn):
    """Return the set of columns in the trades table."""
    cur = conn.execute("PRAGMA table_info(trades)")
    return {row[1] for row in cur.fetchall()}


def insert_trade(conn, data, table_cols):
    """Insert a trade, only using columns that exist in the table."""
    clean = {k: v for k, v in data.items() if k in table_cols}
    if not clean:
        return
    cols = ", ".join(clean.keys())
    placeholders = ", ".join(["?" for _ in clean])
    conn.execute(
        f"INSERT INTO trades ({cols}) VALUES ({placeholders})",
        list(clean.values()),
    )


def main():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        print("Make sure the Flask server has been started at least once to create the DB.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Count current trades before deletion
    count_before = conn.execute("SELECT COUNT(*) FROM trades").fetchone()[0]
    print(f"Current trades in database: {count_before}")

    # Hard-delete ALL trades (including soft-deleted)
    conn.execute("DELETE FROM trades")
    conn.commit()
    print(f"Deleted all {count_before} existing trades.")

    # Get valid columns
    table_cols = get_table_columns(conn)

    # Insert backtest trades
    inserted_bt = 0
    for trade in BACKTEST_TRADES:
        insert_trade(conn, trade, table_cols)
        inserted_bt += 1

    # Insert main journal trades
    inserted_mj = 0
    for trade in MAIN_JOURNAL_TRADES:
        insert_trade(conn, trade, table_cols)
        inserted_mj += 1

    conn.commit()
    conn.close()

    print(f"\nInserted {inserted_bt} backtest trades.")
    print(f"Inserted {inserted_mj} main journal trade(s).")
    print(f"\nTotal trades now in database: {inserted_bt + inserted_mj}")

    print("""
------------------------------------------------------------
NEXT STEPS:
  - Open the app and check /backtest-journal to see BT trades
  - Use 'New Journal' to manually add more main journal trades
  - Or re-run this script after adding more entries to
    MAIN_JOURNAL_TRADES above
------------------------------------------------------------
""")


if __name__ == "__main__":
    main()
