"""Seed MLT Journal with fictional demonstration records.

The generated records are safe for screenshots, demos, and public portfolios.
They do not describe real trades, accounts, performance, or journal entries.
Run: python seed_trades.py
"""

import json
from datetime import date, timedelta

from database import get_conn, init_db


PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"]
SESSIONS = ["London", "New York"]
RESULTS = [
    "Take-Profit", "Stop-Loss", "Take-Profit", "Breakeven", "Take-Profit",
    "Stop-Loss", "Take-Profit", "Take-Profit", "Breakeven", "Stop-Loss",
    "Take-Profit", "Take-Profit", "Stop-Loss", "Breakeven", "Take-Profit",
    "Stop-Loss", "Take-Profit", "Take-Profit", "Breakeven", "Take-Profit",
]
QUALITIES = ["A", "B", "A+", "A", "A+", "B", "A", "A+", "A", "B"]


def build_demo_trades():
    """Return a deterministic set of fully fictional trade records."""
    trades = []
    start = date(2024, 1, 2)

    for index, result in enumerate(RESULTS):
        trade_id = index + 1
        trade_date = start + timedelta(days=index * 4)
        quality = QUALITIES[index % len(QUALITIES)]
        profit = [1.2, 1.5, 1.8, 2.0][index % 4] if result == "Take-Profit" else (-0.5 if result == "Stop-Loss" else 0.0)

        trades.append({
            "trade_name": f"Fictional demo trade {trade_id:02d}",
            "date": trade_date.isoformat(),
            "weekday": trade_date.strftime("%A"),
            "time_of_trade": f"{8 + index % 7:02d}:{'30' if index % 2 else '00'}",
            "session": SESSIONS[index % len(SESSIONS)],
            "pairs": PAIRS[index % len(PAIRS)],
            "position": "Short" if index % 2 else "Long",
            "trade_type": "Backtest" if index < 8 else ("Forward Test" if index < 14 else "Live"),
            "account_type": "Demo",
            "entry_model": f"Example Model {'B' if index % 2 else 'A'}",
            "trade_direction_type": "Reversal" if index % 2 else "Trend Continuation",
            "setup_quality": quality,
            "rr": profit if result == "Take-Profit" else 1.5,
            "profit_pct": profit,
            "result": result,
            "grade": quality,
            "trading_rules": "Demo checklist complete",
            "risk_pct": "0.5",
            "why_grade": "Synthetic record created solely to demonstrate the portfolio interface.",
            "psycho": "",
            "review_lesson": "",
            "emotions": json.dumps([]),
            "confluence_tags": json.dumps(["Fictional data", "Portfolio demo"]),
            "chart_images": json.dumps([]),
            "dxy_chart_images": json.dumps([]),
        })

    return trades


TRADES = build_demo_trades()


def seed():
    init_db()
    conn = get_conn()
    deleted = conn.execute("DELETE FROM trades").rowcount
    conn.commit()
    print(f"Cleared {deleted} existing trades.")

    for trade in TRADES:
        columns = ", ".join(trade.keys())
        placeholders = ", ".join(["?" for _ in trade])
        conn.execute(
            f"INSERT INTO trades ({columns}) VALUES ({placeholders})",
            list(trade.values()),
        )

    conn.commit()
    conn.close()
    print(f"Inserted {len(TRADES)} fictional demo trades successfully.")


if __name__ == "__main__":
    seed()
