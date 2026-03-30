# KansoTrader - Quick Start Guide

## 30-Second Setup

### Prerequisites
- Python 3.7+
- MetaTrader5 installed (optional - app works in demo mode without it)

### Installation

```bash
# Navigate to project
cd /path/to/KansoTrader

# Install dependencies
pip install -r requirements.txt
```

## Running the App

### Terminal 1: Start MT5 Bridge
```bash
python mt5_bridge.py
```
Expected output:
```
🟢 MT5 Bridge running on http://127.0.0.1:5001  [DEMO MODE]
```

### Terminal 2: Start Flask App
```bash
python app.py
```
Expected output:
```
🚀 KansoTrader starting on http://localhost:5000
   Journal: Flask app on :5000
   MT5 Bridge should run separately on :5001
```

### Open in Browser
Navigate to: **http://localhost:5000**

---

## Using KansoTrader

### Tab 1: Live Dashboard 📊
View real-time MT5 account data:
- Balance, equity, P&L, free margin
- Open positions with current prices
- Equity curve (last 90 days)
- Performance stats: total trades, win rate, profit factor, expectancy
- Charts: winners vs losers, by session, by weekday, monthly calendar

Auto-refreshes every 30 seconds.

### Tab 2: New Trade ➕
Log a completed trade with 39 fields across 7 sections:

1. **Core Trade Info** - Name, date, pair (GBPUSD), session, position, type, setup, risk%, RR, result, profit%
2. **Structure & Context** - HTF/MTF weak structure, BOS, pricing, POI reaction
3. **Entry Criteria** - Entry confirmation, rejection pattern, order flow, conditions, confluences, model time
4. **Trade Management** - Stop loss type, BE criteria, re-entry, targets, news impact, time, weekday
5. **DXY Analysis** - Free-form notes on DXY
6. **Grading** - Grade (A+/A/B/C), explanation, top-down analysis
7. **Psychology & Review** - Emotional state, post-trade lessons, MT5 ticket

Multi-select fields: Click pills to toggle on/off (highlighted when selected).

### Tab 3: Journal Log 📝
View all logged trades in table format:
- Columns: Date, Name, Pair, Session, Position, Setup, RR, Risk%, Result, Grade, PnL%
- **Filters**: Result, Session, Position, Grade, Weekday, Trade Type
- **Actions**: Click row to view details, edit, or delete

### Tab 4: My Stats 📈
Analyze your trading performance:
- **Summary Cards**: Total trades, win rate, profit factor, expectancy, avg RR, total PnL%, max drawdown
- **Charts**:
  - Cumulative PnL% over time (line chart)
  - Win rate by grade (A+, A, B, C)
  - Win rate by session (London, NY, Overlap, Asian)
  - Win rate by weekday (Mon-Fri)
  - Long vs Short performance pie chart
  - Win rate by setup type
  - Grade distribution pie chart

---

## Example: Logging Your First Trade

1. **Open "New Trade" tab**
2. **Fill Section 1**:
   - Trade Name: "GU Long A+"
   - Date: 24/03/2026
   - Pair: GBPUSD (default)
   - Session: London
   - Position: Long
   - Trade Type: Target Trade
   - Setup: I/E|PS
   - Risk%: 1%
   - RR: 1.5
   - Result: Win
   - Profit%: 1.5

3. **Fill Section 2** (pick at least one for each):
   - HTF Weak: Click "4H"
   - MTF Weak: Click "1H"
   - BOS: Clean BOS
   - HTF Pricing: Decisional
   - MTF Pricing: Decisional
   - POI Reaction: Strong

4. **Fill Section 3** (multi-select - click to toggle):
   - Entry Confirmation: Click "BOS"
   - Rejection Candle: Click "Single Rej"
   - Order Flow: Click "Bullish OF"
   - Conditions: Click "HTF aligned", "DXY aligned"
   - Trade Confluences: Click "Session peak"
   - Confirmation/Risk: Click "Confirmation Entry"
   - Entry Model Time: 09:00

5. **Fill Section 4**:
   - Stop Loss: Below PS
   - BE Criteria: BOS in favor
   - Re-entry: No
   - Target: Click "HTF Weak"
   - News: None
   - Time of Trade: 09:15
   - Weekday: Monday

6. **Fill Section 5**:
   - DXY Notes: "DXY weak, aligned short. GU strong structure."

7. **Fill Section 6**:
   - Grade: A
   - Why Grade: "Clean structure, DXY aligned, 3/3 timeframes aligned. Strong entry confirmation on BOS. Perfect RR setup."
   - Top-Down: "4H in uptrend, HTF targeting 1.2750. Entry at POI with rejection."

8. **Fill Section 7**:
   - Psychology: "Confident, disciplined entry. Followed plan exactly."
   - Review: "Excellent execution. Trade closed at target. Learned importance of waiting for confirmation."
   - MT5 Ticket: 9900001 (optional)

9. **Click "✓ Save Trade"**

✅ Trade appears instantly in Journal Log!

---

## Tips & Best Practices

### For the Form
- **Multi-select fields**: Click pills to toggle. Selected ones highlight in green.
- **Auto-refresh**: Dashboard updates every 30 seconds (no manual refresh needed).
- **Incomplete trades**: Leave fields blank - no required validation.
- **Save frequently**: Each trade saved immediately to SQLite.

### For Analysis
- **Use filters**: Isolate wins/losses by session, position, grade to find patterns.
- **Watch your stats**: Win rate, expectancy, profit factor show your edge.
- **Track drawdown**: Monitor max drawdown - know your risk tolerance.
- **Grade trends**: High win rate on A+ grades? Trade more of them!

### For Compliance
- **One trade per entry**: Log each trade separately with its own details.
- **Honest grading**: Be harsh on yourself - Grade C = Don't trade again.
- **Psychology notes**: Track emotional patterns - essential for discipline.
- **MT5 linking**: Correlate journal with live account via ticket numbers.

---

## Troubleshooting

### "Connection refused" on Dashboard
- Check MT5 Bridge is running on Terminal 1
- Verify port 5001 is free: `lsof -i :5001`
- Restart MT5 Bridge

### "MT5 not running" message
- This is normal in DEMO mode - app shows mock data
- To use LIVE mode, install MetaTrader5 and start it

### Trades not saving
- Check Flask app is running (Terminal 2)
- Check browser console (F12) for JavaScript errors
- Verify SQLite database permissions: `ls -l data/journal.db`

### Charts not showing
- Wait for dashboard to load (auto-refresh happens every 30 seconds)
- Check you have at least 1 logged trade for stats
- Refresh browser (Ctrl+R)

### Port conflicts
- Port 5000 (Flask): Check `lsof -i :5000`
- Port 5001 (MT5): Check `lsof -i :5001`
- Kill conflicting processes or change ports in code

---

## Common Commands

```bash
# View database directly
sqlite3 data/journal.db "SELECT trade_name, date, result, grade FROM trades;"

# Backup database
cp data/journal.db data/journal_backup_$(date +%s).db

# Check MT5 connection
curl http://127.0.0.1:5001/account

# Kill processes if stuck
pkill -f "python mt5_bridge.py"
pkill -f "python app.py"
```

---

## Next Steps

1. **Start logging**: Use New Trade tab to record your next 5 trades
2. **Review patterns**: Check Journal Log tab with filters
3. **Analyze performance**: View My Stats tab after 10+ trades
4. **Optimize grades**: Increase A+ trades, reduce C grades
5. **Track psychology**: Keep detailed notes for pattern analysis

---

## System Overview

```
Browser (http://localhost:5000)
    ↓
Flask App (app.py on :5000)
    ├─ Serves HTML UI
    ├─ REST API for trades
    └─ Proxies MT5 Bridge
         ↓
    MT5 Bridge (mt5_bridge.py on :5001)
         ├─ Real MT5 connection (if available)
         └─ Demo mode data (if MT5 not installed)

    SQLite Database (data/journal.db)
    └─ All 39 fields per trade
```

---

**Happy trading! 📈**

For detailed documentation, see `README.md`
