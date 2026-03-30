# KansoTrader

A fully local, private trading journal web app for GBPUSD forex trading — built with Python (Flask) + SQLite.

> **All data stays on your machine. Nothing is sent externally. This app is 100% local and private.**

---

## Preview

![KansoTrader Dashboard](static/preview.png)

The app runs in your browser at `http://localhost:5000` and provides:

- **Live Dashboard** — equity curve, win rate, profit factor, session/weekday breakdowns
- **Trade Journal** — log every trade with 39+ fields across 7 sections (entry, exit, psychology, review)
- **Backtest Log** — separate table for strategy backtesting entries
- **Analytics** — performance charts, monthly calendar grid, RR distribution
- **MT5 Bridge** — optional live account data from MetaTrader 5 via local socket

---

## Run Locally

**Requirements:** Python 3.9+

```bash
# 1. Clone the repo
git clone https://github.com/MohamadKanso/KansoTrader.git
cd KansoTrader

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the app
python app.py
```

Then open **http://localhost:5000** in your browser.

> The database (`data/journal.db`) is created automatically on first run. Your trade data is stored locally and never leaves your machine.

---

## Tech Stack

- **Backend:** Python, Flask, SQLite
- **Frontend:** Vanilla HTML/CSS/JS (single-page app, no framework)
- **Charts:** Chart.js
- **MT5 Integration:** Optional — requires MetaTrader 5 desktop app running locally

---

## Privacy

This app is **fully local**. It does not:
- Connect to any external server
- Send any trade data anywhere
- Require an account or login

Your journal lives entirely on your machine at `data/journal.db`.

---

## Project Structure

```
KansoTrader/
├── app.py              # Flask backend + API routes
├── database.py         # SQLite schema + queries
├── mt5_bridge.py       # Optional MT5 socket bridge
├── requirements.txt
├── templates/          # HTML templates
├── static/             # CSS, JS, images
└── data/               # SQLite database (gitignored)
```
