"""
Import Notion CSV → KansoTrader database
Run once: python import_notion.py
"""
import csv, re, json, os, sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import database as db

CSV_PATH = "/Users/mohamadkanso/Desktop/ExportBlock-9d40f5b9-dd12-40f1-b9ae-ce26f0cb9ba7-Part-1/Database 2026 313db178473c812c9342eb9e2b0f1c74_all.csv"

# ── Cleaners ──────────────────────────────────────────────────────────────────
def clean(text):
    """Strip Notion URL references: 'Text (https://www.notion.so/...)' → 'Text'"""
    if not text: return ''
    text = re.sub(r'\s*\(https://www\.notion\.so/[^\)]*\)', '', str(text))
    text = re.sub(r'\s*\(http[^\)]*\)', '', text)
    return text.strip().rstrip(',').strip()

def clean_list(text):
    """Comma-separated multi-value field → cleaned list"""
    if not text: return []
    items = []
    # Handle items with Notion URLs inside
    for part in text.split(','):
        c = clean(part)
        if c: items.append(c)
    return [i for i in items if i]

def parse_dt(dt_str):
    """'12/02/2026 12:15 (GMT)' → ('2026-02-12', '12:15')"""
    if not dt_str: return '', ''
    s = re.sub(r'\s*\(GMT\)', '', str(dt_str)).strip()
    parts = s.split(' ')
    try:
        d, m, y = parts[0].split('/')
        date = f"{y}-{m.zfill(2)}-{d.zfill(2)}"
        time = parts[1] if len(parts) > 1 else ''
        return date, time
    except:
        return '', ''

def parse_float(s):
    if not s: return None
    try: return float(re.sub(r'[^0-9.\-]', '', str(s)))
    except: return None

def weekday(date_str):
    if not date_str: return ''
    try:
        d = datetime.strptime(date_str, '%Y-%m-%d')
        return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][d.weekday()]
    except: return ''

def map_account(text):
    t = clean(text).lower()
    if 'funded' in t:          return 'Funded Challenge'
    if 'data collection' in t: return 'Data Collection'
    if 'backtest' in t:        return 'Backtesting'
    if 'live' in t:            return 'Live'
    return clean(text)

def map_type(text):
    t = clean(text).strip()
    return {'Live':'Live','FT':'Forward Test','BT':'Backtest'}.get(t, t)

def map_grade(text):
    g = clean(text).strip()
    # "A" "A+" "B" "C" or longer Notion page name
    if g in ('A+','A','B','C','Not Valid'): return g
    # Try to extract from start
    for grade in ('A+','A','B','C'):
        if g.startswith(grade): return grade
    return g

def map_result(text):
    r = clean(text).strip()
    mapping = {
        'Take-Profit': 'Take-Profit',
        'Stop-Loss': 'Stop-Loss',
        'Breakeven': 'Breakeven',
        'Breakeven - TP': 'Breakeven - TP',
        'Breakeven - SL': 'Breakeven - SL',
        'Partial Win': 'Partial Win',
        'Partial Loss': 'Partial Loss',
    }
    return mapping.get(r, r)

def map_htf_weak(text):
    t = clean(text)
    mapping = {
        'Weekly Weak Structure': 'Weekly Weak Structure',
        'Daily Weak Structure':  'Daily Weak Structure',
        '4H Weak Structure':     '4H Weak Structure',
        'None':                  'None',
    }
    return mapping.get(t, t)

def map_mtf_weak(text):
    t = clean(text)
    mapping = {
        '1H Weak':  '1H Weak',
        '15M Weak': '15M Weak',
        '30M Weak': '30M Weak',
        'None':     'None',
    }
    return mapping.get(t, t)

def map_confluence_tags(raw):
    """Map the clean USE TRADE CONFLUENCE column."""
    items = [i.strip() for i in raw.split(',') if i.strip()]
    # Normalise known tags
    norm = {
        'Pro-Trend': 'Pro-Trend',
        'Counter-Trend': 'Counter-Trend',
        'Continuation': 'Continuation',
        'FBoS': 'FBoS',
        'LTF Weak Structure': 'LTF Weak Structure',
        'MTF Weak Structure': 'MTF Weak Structure',
        'HTF Weak Structure': 'HTF Weak Structure',
        '15M/30M Alignment': '15/30M Alignment',
        '15M DPL/H': '15M DPL/H',
        '4HR Alignment': '4HR Alignment',
        'HTF Alignment': 'HTF Alignment',
        'MTF Alignment': 'MTF Alignment',
        'DXY Alignment': 'DXY Alignment',
        'Decisional H/L': 'Decisional H/L',
        'Double Conf': 'Double Conf',
        '1H DPL/H': '1H DPL/H',
        '3M DPL/H': '3M DPL/H',
        '15 NC': '15 NC',
        'Sweep': 'Sweep',
        'Imbalance': 'Imbalance',
        'Inducement': 'Inducement',
    }
    return [norm.get(i, i) for i in items if i]

def map_conditions(raw):
    items = clean_list(raw)
    norm = {
        'Trending 15M/30M': 'Trending 15M/30M',
        'Trending 4HR/D':   'Trending 4HR/D',
        'Trending 1M/3M':   'Trending 1M/3M',
    }
    return [norm.get(i, i) for i in items if i]

def map_entry_confirmation(text):
    t = clean(text)
    if '1m' in t.lower() or '1M Rejection' in t: return '1M Rejection Candle'
    if '5m rejection' in t.lower(): return '1M Rejection Candle'
    return t

def map_position(text):
    t = clean(text).strip()
    if t.lower() in ('long', 'buy'): return 'Long'
    if t.lower() in ('short', 'sell'): return 'Short'
    return t

def map_trade_direction(text):
    t = clean(text).strip()
    return {'Internal':'Internal','External':'External','3SL':'3SL'}.get(t, t)

def map_session(text):
    t = clean(text).strip()
    norm = {
        'London': 'London',
        'New York': 'New York',
        'Asia': 'Asia',
        'Sydney': 'Sydney',
        'Off-Session': 'Off-Session',
    }
    return norm.get(t, t)

def map_rules(text):
    t = clean(text).strip()
    if 'not' in t.lower(): return 'Rules NOT Followed'
    if 'followed' in t.lower(): return 'Rules Followed'
    return t

def map_bos(text):
    t = clean(text).strip()
    known = ['1M','3M or less','5M and less','15M or less','30M or less','1HR or less','Was NC']
    return t if t in known else t

def map_news(text):
    t = clean(text).strip()
    norm = {
        'No News': 'No News',
        '>2 Hours Before': '>2 Hours Before',
        '>2 Hours After': '>2 Hours After',
    }
    return norm.get(t, t)

def map_sl(text):
    t = clean(text).strip().rstrip()
    norm = {
        '3 Pips': '3 Pips',
        '4 Pips': '4 Pips',
        '2 Pips': '2 Pips',
        'At the PS': 'At the PS',
        'Covering +5 Wick': 'Covering +5 Wick',
    }
    return norm.get(t, t)

def map_re_entry(text):
    t = clean(text).strip()
    if t == 'N/A': return 'N/A'
    if 'criteria #1' in t.lower() or 'first high' in t.lower() or 'externals aligned' in t.lower():
        return 'Criteria #1 — New entry model on original level after break-even'
    if 'criteria #2' in t.lower() or 'respected' in t.lower():
        return 'Criteria #2 — Respected original setup after break-even'
    return t

def map_rej_candle(text):
    t = clean(text).strip()
    norm = {
        'Rejection Candle': 'Rejection Candle',
        'Engulfing Rejection Candle': 'Engulfing Rejection Candle',
        'Double Rejection Candle': 'Double Rejection Candle',
    }
    return norm.get(t, t)

def map_target(text):
    t = clean(text).strip()
    if 'LTF' in t: return 'LTF'
    if 'Weak' in t and ('15' in t or '30' in t): return 'Weak 15/30M Structure'
    return t

def map_entry_model(text):
    """Map Setup column to entry model"""
    t = clean(text).strip()
    known = ['IPS+S','EPS+S','INC+S','ENC+S','IPS+D','EPS+D','INC+D','ENC+D']
    return t if t in known else t

# ── Column headers ────────────────────────────────────────────────────────────
# CSV header:
# Trades, <-- (USE TRADE CONFLUENCE), Account, BE Criteria, Break of Structure,
# Breakeven, Chart(3/5/15/30/1h), Conditions, Confirmation/Risk, DXY, DXY Chart,
# Date, Decisional vs. Extreme, Entry Confirmation, Entry Model Time, Grade,
# HTF Pricing, HTF Weak Structure, MTF Pricing, MTF Weak, Month, News, Order Flow,
# Outcome, POI Reaction, Pairs, Place, Position, Profit. %, Psycho, Quarter, RR,
# Re-Entry Criteria, Rejection Candle, Result, Review/Lesson, Revised, Risk. %,
# Rules, Session, Setup, Stop Loss, Target , Time, Top->Down, Trade Confluences,
# Trade Type, Type, Weekday, Why this Grade?, Year

def import_csv():
    imported = 0
    skipped  = 0

    with open(CSV_PATH, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for raw in reader:
            # Skip non-trade rows (first col may have BOM stripped by utf-8-sig)
            first_val = str(list(raw.values())[0] if raw else '').strip().lower()
            if first_val != 'trade':
                skipped += 1
                continue

            date, time_of_trade = parse_dt(raw.get('Date',''))
            if not date:
                skipped += 1
                continue

            # Build profit_pct: Profit. % may look like "3%" or "3.0" or "-1%"
            profit_pct_raw = str(raw.get('Profit. %','')).strip()
            profit_pct = parse_float(profit_pct_raw)

            # RR: might be "3" or "2.44"
            rr_raw = str(raw.get('RR','')).strip()
            rr = parse_float(rr_raw)

            # Risk
            risk_raw = str(raw.get('Risk. %','')).strip()
            risk_pct = parse_float(risk_raw)

            # Confluence tags (clean column)
            conf_raw = str(raw.get('<-- (USE TRADE CONFLUENCE)',''))
            confluence_tags = map_confluence_tags(conf_raw)

            # Condition tags
            cond_raw = str(raw.get('Conditions',''))
            condition_tags = map_conditions(cond_raw)

            # Long trade confluences text (for legacy field)
            tc_raw = str(raw.get('Trade Confluences',''))
            trade_confluences_text = ', '.join(clean_list(tc_raw)) if tc_raw else ''

            trade = {
                'date':                   date,
                'time_of_trade':          time_of_trade,
                'weekday':                str(raw.get('Weekday','')).strip() or weekday(date),
                'pairs':                  clean(raw.get('Pairs','')),
                'position':               map_position(raw.get('Position','')),
                'session':                map_session(raw.get('Session','')),
                'account_type':           map_account(raw.get('Account','')),
                'trade_type':             map_type(raw.get('Type','')),
                'trade_direction_type':   map_trade_direction(raw.get('Trade Type','')),
                'entry_model':            map_entry_model(raw.get('Setup','')),
                'break_of_structure':     map_bos(raw.get('Break of Structure','')),
                'htf_weak_structure':     map_htf_weak(raw.get('HTF Weak Structure','')),
                'mtf_weak_structure':     map_mtf_weak(raw.get('MTF Weak','')),
                'entry_confirmation_type':map_entry_confirmation(raw.get('Entry Confirmation','')),
                'stop_loss_type':         map_sl(raw.get('Stop Loss','')),
                'target_type':            map_target(raw.get('Target ','')),
                'news_type':              map_news(raw.get('News','')),
                'rejection_candle_type':  map_rej_candle(raw.get('Rejection Candle','')),
                'risk_pct':               str(risk_pct) if risk_pct is not None else '',
                'rr':                     rr,
                'result':                 map_result(raw.get('Result','')),
                'profit_pct':             profit_pct,
                'trading_rules':          map_rules(raw.get('Rules','')),
                're_entry_criteria':      map_re_entry(raw.get('Re-Entry Criteria','')),
                'grade':                  map_grade(raw.get('Grade','')),
                'why_grade':              raw.get('Why this Grade?','').strip(),
                'dxy':                    raw.get('DXY','').strip(),
                'top_down':               raw.get('Top->Down','').strip(),
                'psycho':                 raw.get('Psycho','').strip(),
                'review_lesson':          raw.get('Review/Lesson','').strip(),
                'be_criteria':            clean(raw.get('BE Criteria','')),
                'order_flow':             clean(raw.get('Order Flow','')),
                'conditions':             ', '.join(condition_tags),
                'trade_confluences':      trade_confluences_text,
                'confluence_tags':        json.dumps(confluence_tags),
                'condition_tags':         json.dumps(condition_tags),
                'emotions':               '[]',
                'chart_images':           '[]',
                'dxy_chart_images':       '[]',
            }

            # Set trade_name
            pair = trade.get('pairs','').replace('/','')
            trade['trade_name'] = f"{pair}-{date.replace('-','')}".upper()

            # Remove None values and empty strings that would conflict with DB types
            if trade['rr'] is None: del trade['rr']
            if trade['profit_pct'] is None: del trade['profit_pct']

            db.save_trade(trade)
            imported += 1

    return imported, skipped


if __name__ == '__main__':
    print("📥 Importing Notion trades...")
    imported, skipped = import_csv()
    print(f"✅ Imported: {imported} trades")
    print(f"⏭  Skipped:  {skipped} rows (headers/empty)")
