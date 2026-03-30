# KansoTrader

A clean, fully local trading journal for forex traders — built with Python (Flask) and React.

> **100% private. All data stays on your machine. Nothing is ever sent externally.**

---

## Live Demo

**[→ Try the demo](https://mohamadkanso.github.io/KansoTrader/)**

The demo is read-only with sample trades pre-loaded. To add your own data and use the full journal, run it locally (see below).

---

## Run Locally

**Requirements:** Python 3.9+

```bash
git clone https://github.com/MohamadKanso/KansoTrader.git
cd KansoTrader
pip install -r requirements.txt
python seed_trades.py   # optional: load sample trades
python app.py
```

Then open **http://localhost:5000** in your browser.

Your data is stored in `data/journal.db` (SQLite, local only).

---

## Features

- **Dashboard** — equity curve, win rate, profit factor, session & weekday breakdowns, monthly calendar
- **Trade Journal** — log trades with 39+ fields: entry model, psychology, screenshots, review notes
- **Analytics** — RR distribution, performance DNA, edge analysis
- **Backtest Log** — separate view for strategy backtesting
- **Trash** — soft-delete with restore
- **MT5 Bridge** — optional live account data from MetaTrader 5 (Windows only)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python, Flask |
| Database | SQLite (local file) |
| Frontend | React + Vite |
| Charts | Chart.js |

---

## Deploy Your Own Demo

To host a read-only demo of your journal:

1. Fork this repo
2. Go to [render.com](https://render.com) → New Web Service → connect your fork
3. Render auto-detects `render.yaml` and deploys with `DEMO_MODE=1`

---

## Privacy

This app has **no accounts, no cloud sync, no analytics, no external requests**.
Your trades live in a single file: `data/journal.db` — on your machine, under your control.
