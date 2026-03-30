# KansoTrader - Documentation Index

## Quick Navigation

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - 30-second setup, first trade example, tab overview
- **[README.md](README.md)** - Complete project documentation, architecture, features

### Reference Materials
- **[REFERENCE.md](REFERENCE.md)** - Quick reference card, all field options, troubleshooting
- **[COMPLETION_SUMMARY.txt](COMPLETION_SUMMARY.txt)** - Detailed project completion report

---

## File Overview

### Application Files

#### Flask Backend
**`app.py`** (153 lines)
- Main Flask application
- 7 REST API endpoints for journal CRUD
- 4 MT5 Bridge proxy endpoints
- Stats aggregation
- Error handling and fallback

```bash
# Start on port 5000
python app.py
```

#### Web Interface
**`templates/index.html`** (2,202 lines)
- Single-page responsive web application
- 4 tabs: Dashboard, New Trade, Journal Log, Stats
- 39-field form across 7 sections
- 6 performance charts
- Dark theme (#0a0a0f background, green/red accents)
- Fully functional JavaScript with Plotly.js

#### Database Module
**`database.py`** (224 lines) - Existing file
- SQLite database with 39-field schema
- CRUD operations (create, read, update, delete)
- Statistics aggregation functions

#### MT5 Bridge
**`mt5_bridge.py`** (199 lines) - Existing file
- Local REST API on port 5001
- Real MT5 integration (if installed)
- Demo mode fallback with mock data

### Configuration
**`requirements.txt`** - Python dependencies
```
Flask==3.0.0
Werkzeug==3.0.1
requests==2.31.0
MetaTrader5==5.0.45
```

**`.gitignore`** - Standard Python/Flask ignores

---

## The 4 Main Tabs

### 1. Live Dashboard 📊
**Path:** Flask app serves on http://localhost:5000

**Features:**
- Account cards: Balance, Equity, P&L, Free Margin, Win Rate
- Open positions table with real-time pricing
- Equity curve (last 90 days)
- Stats: Total Trades, Profit Factor, Expectancy, Avg RR
- Charts: Winners vs Losers, by Session, by Weekday, Monthly Calendar
- Auto-refresh every 30 seconds

**Data Source:** MT5 Bridge (port 5001)

---

### 2. New Trade ➕
**Purpose:** Log a completed trade with complete analysis

**39 Fields across 7 Sections:**

**Section 1: Core Trade Info** (11 fields)
- trade_name, date, pair, session, position, trade_type, setup
- risk_pct, rr, result, profit_pct

**Section 2: Structure & Context** (7 fields)
- htf_weak, mtf_weak, bos, htf_pricing, mtf_pricing
- decisional_extreme, poi_reaction

**Section 3: Entry Criteria** (7 fields)
- entry_confirmation, rejection_candle, order_flow, conditions
- trade_confluences, confirmation_risk, entry_model_time

**Section 4: Trade Management** (7 fields)
- stop_loss, be_criteria, re_entry, target, news
- time_of_trade, weekday

**Section 5: DXY Analysis** (1 field)
- dxy (free-form notes)

**Section 6: Grading** (3 fields)
- grade (A+/A/B/C), why_grade, top_down

**Section 7: Psychology & Review** (3 fields)
- psycho, review_lesson, mt5_ticket

**UI Features:**
- Multi-select pills (click to toggle)
- Form reset button
- Save button with feedback
- Auto-save to SQLite

---

### 3. Journal Log 📝
**Purpose:** View all logged trades with filtering and search

**Columns:**
- Date, Name, Pair, Session, Position, Setup, RR, Risk%, Result, Grade, PnL%

**Filters (6 total):**
- Result (Win/Loss/BE)
- Session (London/New York/Overlap/Asian)
- Position (Long/Short)
- Grade (A+/A/B/C)
- Weekday (Mon-Fri)
- Trade Type (Target/Trend/FT)

**Actions:**
- Click row to view full details
- View button (👁)
- Delete button (🗑)
- Modal dialog for trade details
- Edit button (future feature)

---

### 4. My Stats 📈
**Purpose:** Analyze trading performance with analytics

**Summary Cards (7):**
- Total Trades
- Win Rate
- Profit Factor
- Expectancy
- Average RR
- Total PnL%
- Max Drawdown

**Charts (6):**
1. **Cumulative PnL% Chart** - Line chart of account growth
2. **Win Rate by Grade** - Bar chart (A+/A/B/C)
3. **Win Rate by Session** - Bar chart (London/NY/Overlap/Asian)
4. **Win Rate by Weekday** - Bar chart (Mon-Fri)
5. **Long vs Short** - Pie chart
6. **Grade Distribution** - Pie chart

All charts built with Plotly.js, styled for dark theme.

---

## Database Schema (39 Fields)

### Primary Key & Timestamps
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `created_at` (TIMESTAMP DEFAULT)

### Core Trade Fields (11)
```
trade_name TEXT, date TEXT, pair TEXT (default 'GBPUSD')
session TEXT, position TEXT, trade_type TEXT, setup TEXT
risk_pct TEXT, rr REAL, result TEXT, profit_pct REAL
```

### Structure & Context (7)
```
htf_weak TEXT (multi), mtf_weak TEXT (multi), bos TEXT
htf_pricing TEXT, mtf_pricing TEXT, decisional_extreme TEXT, poi_reaction TEXT
```

### Entry Criteria (7)
```
entry_confirmation TEXT (multi), rejection_candle TEXT (multi)
order_flow TEXT (multi), conditions TEXT (multi)
trade_confluences TEXT (multi), confirmation_risk TEXT (multi)
entry_model_time TEXT
```

### Trade Management (7)
```
stop_loss TEXT, be_criteria TEXT, re_entry TEXT
target TEXT (multi), news TEXT, time_of_trade TEXT, weekday TEXT
```

### Analysis & Grading (8)
```
dxy TEXT, grade TEXT, why_grade TEXT, top_down TEXT
psycho TEXT, review_lesson TEXT, breakeven INTEGER (default 0)
mt5_ticket INTEGER
```

**Multi-select fields** stored as comma-separated: `"Option1, Option2, Option3"`

---

## API Endpoints

### Journal CRUD (5 endpoints)
```
GET    /api/trades                List all (with optional filters)
POST   /api/trades                Create new trade
GET    /api/trades/<id>           Get single trade
PUT    /api/trades/<id>           Update trade
DELETE /api/trades/<id>           Delete trade
```

### Analytics (1 endpoint)
```
GET    /api/stats                 Aggregated statistics
```

### MT5 Bridge Proxies (4 endpoints)
```
GET    /api/live/account          Account info
GET    /api/live/positions        Open positions
GET    /api/live/trades           Closed trades
GET    /api/live/stats            MT5 stats
```

---

## Startup Instructions

### Step 1: Install Dependencies
```bash
cd /path/to/KansoTrader
pip install -r requirements.txt
```

### Step 2: Start MT5 Bridge (Terminal 1)
```bash
python mt5_bridge.py
```
Expected: `🟢 MT5 Bridge running on http://127.0.0.1:5001 [DEMO/LIVE MODE]`

### Step 3: Start Flask App (Terminal 2)
```bash
python app.py
```
Expected: `🚀 KansoTrader starting on http://localhost:5000`

### Step 4: Open Browser
Navigate to: **http://localhost:5000**

---

## Usage Workflow

### Typical Session
1. **Check Live Dashboard** - View current account status
2. **Log a Trade** - Fill "New Trade" form with all details
3. **Review in Journal** - View in "Journal Log" tab, use filters
4. **Analyze Stats** - Check "My Stats" for patterns

### First Trade Entry
1. Click "New Trade" tab
2. Fill Section 1 (core info)
3. Fill Sections 2-7 (analysis)
4. Click multi-select pills to toggle options
5. Click "✓ Save Trade"
6. Trade appears in "Journal Log" immediately

### Filtering Trades
1. Go to "Journal Log" tab
2. Use filter dropdowns at top
3. Change any filter → table updates instantly
4. Click row to view full details

### Analyzing Performance
1. Go to "My Stats" tab
2. Review summary cards
3. Study the 6 performance charts
4. Identify best grades/sessions/setups

---

## Troubleshooting

### Dashboard Shows "MT5 Bridge not running"
- Check Terminal 1 has `python mt5_bridge.py` running
- Verify port 5001 is free: `lsof -i :5001`
- App will show demo data if bridge unavailable

### "Address already in use" Error
- Port 5000 or 5001 already in use
- Kill process: `pkill -f "python app.py"` or `pkill -f "python mt5_bridge.py"`
- Or change port in code

### Trades Won't Save
- Check Flask console (Terminal 2) for errors
- Verify database permissions: `ls -l data/journal.db`
- Check browser console (F12) for JavaScript errors

### Charts Not Showing
- Wait 30 seconds for auto-refresh
- Ensure you have ≥1 logged trade
- Refresh browser: Ctrl+R
- Check browser console for JavaScript errors

---

## Design Details

### Color Scheme
```
Background:    #0a0a0f (deep dark)
Card BG:       #111118 (slightly lighter)
Accent Green:  #00ff88 (wins, success)
Accent Red:    #ff3355 (losses, risk)
Accent Blue:   #00d4ff (neutral, breakeven)
Text Primary:  #ffffff
Text Secondary:#999999
Border:        #222228
```

### Responsive Layout
- **Desktop** (1200px+): Full sidebar + content
- **Tablet** (768-1200px): Adjusted grid sizing
- **Mobile** (<768px): Sidebar becomes top nav

### Key Components
- Sidebar (280px fixed width)
- Top bar (70px height, title + status)
- Stat cards (responsive grid)
- Form sections (organized by category)
- Multi-select pills (click to toggle)
- Tables (filterable)
- Modals (for trade details)
- Charts (Plotly.js, 300-350px height)

---

## Mohamad's Trading System

### System Rules Captured
- **Pair**: GBPUSD only (hardcoded)
- **Sessions**: 08:00–17:00 (London, NY, Overlap, Asian)
- **Minimum Grade**: B (skip Grade C trades)
- **Risk:Reward**: ≥ 1.25 minimum
- **Risk Size**: 1% per trade (select from dropdown)
- **Stop Loss**: PS or rejection wick + buffer
- **Score < 2.5**: Don't trade (grade guidance)

### Setup Patterns
I/E|PS, I/E|NC, +S, +D, EPS+D, NC+S, NC+D

### Multi-Timeframe Structure
- HTF: 1W, 1D, 4H, 1H, 15M
- MTF: 4H, 1H, 15M, 5M

### Grade System
- **A+**: Excellent (green, trade aggressively)
- **A**: Good (blue, trade normally)
- **B**: Minimum (orange, be careful)
- **C**: Skip (red, don't trade)

---

## Documentation Files

| File | Size | Purpose |
|------|------|---------|
| README.md | 9.0 KB | Complete feature & architecture documentation |
| QUICKSTART.md | 7.2 KB | 30-second setup, first trade example |
| REFERENCE.md | 8.4 KB | Quick reference card, all fields/options |
| COMPLETION_SUMMARY.txt | 14+ KB | Detailed project completion report |
| INDEX.md | This file | Documentation index and navigation |

---

## File Locations

All files in: `/sessions/blissful-vigilant-newton/mnt/Desktop/Mohamad/Projects/KansoTrader/`

```
KansoTrader/
├── app.py                  ← Flask backend (start here for API)
├── templates/
│   └── index.html          ← Web UI (the entire frontend)
├── database.py             ← SQLite module
├── mt5_bridge.py           ← MT5 REST bridge
├── data/
│   └── journal.db          ← SQLite database (auto-created)
├── requirements.txt        ← Python dependencies
├── .gitignore             ← Git configuration
├── README.md              ← Full documentation
├── QUICKSTART.md          ← Setup & usage
├── REFERENCE.md           ← Quick reference
├── COMPLETION_SUMMARY.txt ← Project summary
└── INDEX.md               ← This file
```

---

## Version Information

- **Version**: KansoTrader v1.0
- **Date**: March 24, 2026
- **Status**: ✓ Complete & Ready
- **Lines of Code**: 2,776
- **Documentation**: 40+ KB

---

## Getting Help

1. **For setup**: See QUICKSTART.md
2. **For reference**: See REFERENCE.md
3. **For details**: See README.md
4. **For overview**: See COMPLETION_SUMMARY.txt
5. **For troubleshooting**: See REFERENCE.md section 6
6. **For architecture**: See README.md section 2

---

**Happy Trading! Start with QUICKSTART.md to get up and running in 30 seconds.**
