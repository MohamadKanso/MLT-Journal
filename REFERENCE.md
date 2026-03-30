# KansoTrader - Quick Reference Card

## Startup Commands

```bash
# Terminal 1: MT5 Bridge
python mt5_bridge.py

# Terminal 2: Flask App
python app.py

# Browser
http://localhost:5000
```

## 4 Main Tabs

| Tab | Purpose | Key Actions |
|-----|---------|-------------|
| **Live Dashboard** 📊 | Real-time MT5 account view | View balance, positions, equity curve, stats. Auto-refreshes every 30 sec |
| **New Trade** ➕ | Log a completed trade | Fill 39 fields across 7 sections, click "Save Trade" |
| **Journal Log** 📝 | View all logged trades | Filter by result/session/grade/etc, click to view details, edit/delete |
| **My Stats** 📈 | Performance analytics | View 7 summary cards + 6 performance charts |

## The 39 Journal Fields

### Section 1: Core Trade Info (11 fields)
```
trade_name, date, pair, session, position, trade_type, setup,
risk_pct, rr, result, profit_pct
```

### Section 2: Structure & Context (7 fields)
```
htf_weak (multi), mtf_weak (multi), bos, htf_pricing, mtf_pricing,
decisional_extreme, poi_reaction
```

### Section 3: Entry Criteria (7 fields)
```
entry_confirmation (multi), rejection_candle (multi), order_flow (multi),
conditions (multi), trade_confluences (multi), confirmation_risk (multi),
entry_model_time
```

### Section 4: Trade Management (7 fields)
```
stop_loss, be_criteria, re_entry, target (multi), news,
time_of_trade, weekday
```

### Section 5: DXY Analysis (1 field)
```
dxy
```

### Section 6: Grading (3 fields)
```
grade, why_grade, top_down
```

### Section 7: Psychology & Review (3 fields)
```
psycho, review_lesson, mt5_ticket
```

## Field Definitions & Options

### Core Info
- **trade_name**: User-defined label (e.g., "GU Long A+")
- **date**: DD/MM/YYYY format
- **pair**: GBPUSD (fixed)
- **session**: London | New York | London/NY Overlap | Asian
- **position**: Long | Short
- **trade_type**: Target Trade | Trend Trade | FT (First Touch)
- **setup**: I/E|PS | I/E|NC | +S | +D | EPS+D | NC+S | NC+D
- **risk_pct**: 2% | 1.5% | 1% | 0.8% | 0.5% | 0.4% | 0.3% | 0.2% | 0.1%
- **rr**: Number (e.g., 1.5)
- **result**: Win | Loss | BE
- **profit_pct**: Number (e.g., 1.5 for +1.5%)

### Structure & Context
- **htf_weak**: 1W | 1D | 4H | 1H | 15M (multi-select)
- **mtf_weak**: 4H | 1H | 15M | 5M (multi-select)
- **bos**: Clean BOS | Marginal BOS | Internal | No BOS
- **htf_pricing**: Decisional | Extreme | Premium | Discount
- **mtf_pricing**: Decisional | Extreme | Premium | Discount
- **decisional_extreme**: Decisional | Extreme
- **poi_reaction**: Strong | Moderate | Weak | Failed

### Entry Criteria
- **entry_confirmation**: OFS | Shift | IPS Break | BOS | SMS | Continuation (multi)
- **rejection_candle**: Single Rej | Double Rej | Engulf | Wicky | Strong Body (multi)
- **order_flow**: Bullish OF | Bearish OF | Neutral | Mixed (multi)
- **conditions**: HTF aligned | MTF aligned | LTF aligned | DXY aligned | Clean path (multi)
- **trade_confluences**: News clear | Session peak | External target | Internal target | HTF target (multi)
- **confirmation_risk**: Risk Entry | Confirmation Entry (multi)
- **entry_model_time**: 08:00 | 09:00 | 10:00 | ... | 16:00 | Other

### Trade Management
- **stop_loss**: Below PS | Above PS | Below Wick | Above Wick | Below Structure
- **be_criteria**: BOS in favor | HTF+DXY aligned | External aligned | Not moved
- **re_entry**: Yes | No
- **target**: 1H Weak | 4H Weak | HTF Weak | Internal Liq | External Liq | Daily Target (multi)
- **news**: None | Low Impact | Medium Impact | High Impact (NFP)
- **time_of_trade**: HH:MM format (e.g., 14:30)
- **weekday**: Monday | Tuesday | Wednesday | Thursday | Friday

### Analysis Fields
- **dxy**: Free-form text (DXY direction, strength, alignment)
- **grade**: A+ | A | B | C (A+ = best, B = minimum to trade, C = too risky)
- **why_grade**: Score explanation (1-5 scale, DXY alignment, 4H/1H alignment, targets, model quality)
- **top_down**: HTF context, structure, pricing, confluence of reasons
- **psycho**: Emotional state, discipline, reactions, confidence
- **review_lesson**: What went right/wrong, improvements, lessons learned
- **mt5_ticket**: MT5 order ticket number (optional, for linking to live trades)

## Multi-Select Behavior

Fields marked "multi" allow multiple selections:
- Click a **pill** to toggle it on (highlights green)
- Click again to toggle it off
- Selected values stored as comma-separated strings
- e.g., "HTF aligned, DXY aligned, Clean path"

## Filter Bar (Journal Log Tab)

Available filters:
```
Result:    All | Win | Loss | BE
Session:   All | London | New York | London/NY Overlap | Asian
Position:  All | Long | Short
Grade:     All | A+ | A | B | C
Weekday:   All | Monday | Tuesday | Wednesday | Thursday | Friday
Type:      All | Target Trade | Trend Trade | FT
```

Change any filter → table updates instantly

## Stats Page Cards

| Card | Formula |
|------|---------|
| **Total Trades** | Count of all trades with result |
| **Win Rate** | (Wins / Total) × 100 |
| **Profit Factor** | Total Win PnL / Abs(Total Loss PnL) |
| **Expectancy** | (Win% × Avg Win) + (Loss% × Avg Loss) |
| **Avg RR** | Average of all RR values |
| **Total PnL%** | Sum of all profit_pct |
| **Max Drawdown** | Peak-to-trough decline in equity curve |

## Stats Charts (6 Total)

1. **Cumulative PnL% Chart** - Line chart of account growth over time
2. **Win Rate by Grade** - Bar: A+, A, B, C grades
3. **Win Rate by Session** - Bar: London, NY, Overlap, Asian
4. **Win Rate by Weekday** - Bar: Mon, Tue, Wed, Thu, Fri
5. **Long vs Short** - Pie: Position type breakdown
6. **Grade Distribution** - Pie: Proportion of each grade

## API Endpoints Reference

### Journal CRUD
```
GET  /api/trades                    - List all trades (with filters)
POST /api/trades                    - Create new trade
GET  /api/trades/<id>               - Get single trade
PUT  /api/trades/<id>               - Update trade
DELETE /api/trades/<id>             - Delete trade
```

### Analytics
```
GET  /api/stats                     - Journal statistics
```

### Live MT5 (Proxied from port 5001)
```
GET  /api/live/account              - Account info
GET  /api/live/positions            - Open positions
GET  /api/live/trades               - Closed trades
GET  /api/live/stats                - Performance stats
```

## Keyboard Shortcuts

| Action | How |
|--------|-----|
| Save trade | Tab to last field, Enter OR Click "✓ Save Trade" |
| Clear form | Click "↻ Clear Form" button |
| View details | Click any trade row in Journal Log |
| Close modal | Click ✕ or click outside modal |
| Filter journal | Change dropdown → auto-updates |

## Color Coding

| Color | Meaning |
|-------|---------|
| 🟢 Green `#00ff88` | Wins, success, good trades, selected options |
| 🔴 Red `#ff3355` | Losses, risk, drawdown |
| 🔵 Blue `#00d4ff` | Breakeven, neutral, secondary |
| ⚪ Gray `#999999` | Secondary text, disabled |

## Grading Guidelines

| Grade | Meaning | Trade? | RR Requirement | Example |
|-------|---------|--------|---------------|---------|
| **A+** | Excellent setup | YES | ≥ 1.5 | Clean HTF+MTF+DXY alignment, strong entry confirmation |
| **A** | Good setup | YES | ≥ 1.25 | 2/3 timeframes aligned, decent confluence |
| **B** | Minimum viable | YES | ≥ 1.25 | Acceptable setup, some confluence missing |
| **C** | Below minimum | NO | — | Poor alignment, weak entry, skip this trade |

## Trading System Rules (Mohamad)

✅ **DO:**
- Trade GBPUSD only
- Trade 08:00–17:00 sessions only
- Risk exactly 1% per trade
- Require RR ≥ 1.25
- Trade B+ grades only (skip C)
- Use PS (Previous Support) or rejection wick + buffer for SL

❌ **DON'T:**
- Trade Grade C (score < 2.5)
- Risk more than 1% per position
- Enter without RR ≥ 1.25
- Trade outside session hours
- Chase trades without confirmation
- Ignore DXY alignment on HTF

## Database Location

```
KansoTrader/
└── data/
    └── journal.db          ← SQLite file (all trades stored here)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MT5 Bridge won't start | Check port 5001 free: `lsof -i :5001` |
| Flask won't start | Check port 5000 free: `lsof -i :5000` |
| No dashboard data | Make sure MT5 Bridge running (Terminal 1) |
| Trades won't save | Check Flask app running (Terminal 2) |
| Charts not showing | Need ≥1 trade. Refresh browser or wait 30 sec. |
| Database corrupted | Restore from backup or delete & restart |

---

**Last Updated**: March 24, 2026
**Version**: KansoTrader v1.0
