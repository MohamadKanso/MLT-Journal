"""
KansoTrader MT5 Bridge
Runs as a separate process. Exposes REST API on port 5001.
Supports login with credentials via POST /connect
"""
import json, os
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs

# Persist credentials across requests
CREDS_FILE = os.path.join(os.path.dirname(__file__), "data", ".mt5_creds.json")

def load_creds():
    try:
        with open(CREDS_FILE) as f:
            return json.load(f)
    except:
        return {}

def save_creds(creds):
    os.makedirs(os.path.dirname(CREDS_FILE), exist_ok=True)
    with open(CREDS_FILE, "w") as f:
        json.dump(creds, f)

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

_connected = False
_last_error = ""

def connect(login=None, password=None, server=None):
    global _connected, _last_error
    if not MT5_AVAILABLE:
        _last_error = "MetaTrader5 Python package not installed. Run: pip install MetaTrader5"
        return False, _last_error

    creds = load_creds()
    login    = login    or creds.get("login")
    password = password or creds.get("password")
    server   = server   or creds.get("server")

    if not login:
        _last_error = "No credentials provided"
        return False, _last_error

    if not mt5.initialize(login=int(login), password=str(password), server=str(server)):
        _last_error = f"MT5 init failed: {mt5.last_error()}"
        _connected = False
        return False, _last_error

    save_creds({"login": login, "password": password, "server": server})
    _connected = True
    _last_error = ""
    return True, "Connected"

def ensure_connected():
    global _connected
    if not MT5_AVAILABLE:
        return False
    if _connected:
        # Ping check
        if mt5.account_info() is not None:
            return True
        _connected = False
    # Try auto-reconnect with saved creds
    ok, _ = connect()
    return ok

# ── Data getters ────────────────────────────────────────────────────────────

def get_connection_status():
    if not MT5_AVAILABLE:
        return {"connected": False, "mode": "no_package",
                "message": "MetaTrader5 package not installed. Run: pip install MetaTrader5"}
    if ensure_connected():
        info = mt5.account_info()
        return {
            "connected": True, "mode": "live",
            "login": info.login, "name": info.name,
            "broker": info.company, "server": info.server
        }
    return {"connected": False, "mode": "offline", "message": _last_error or "Not connected"}

def get_account_info():
    if not ensure_connected():
        return demo_account_info()
    info = mt5.account_info()
    if info is None:
        return demo_account_info()
    return {
        "live": True,
        "login": info.login,
        "name": info.name,
        "broker": info.company,
        "balance": round(info.balance, 2),
        "equity": round(info.equity, 2),
        "margin": round(info.margin, 2),
        "free_margin": round(info.margin_free, 2),
        "profit": round(info.profit, 2),
        "leverage": info.leverage,
        "currency": info.currency,
        "server": info.server,
    }

def get_open_positions():
    if not ensure_connected():
        return demo_positions()
    positions = mt5.positions_get()
    if not positions:
        return []
    result = []
    for p in positions:
        result.append({
            "ticket": p.ticket,
            "symbol": p.symbol,
            "type": "BUY" if p.type == 0 else "SELL",
            "volume": p.volume,
            "open_price": p.price_open,
            "current_price": p.price_current,
            "sl": p.sl,
            "tp": p.tp,
            "profit": round(p.profit, 2),
            "swap": round(p.swap, 2),
            "open_time": datetime.fromtimestamp(p.time).strftime("%Y-%m-%d %H:%M"),
            "comment": p.comment,
        })
    return result

def get_closed_trades(days=90):
    if not ensure_connected():
        return demo_closed_trades()
    from_date = datetime.now() - timedelta(days=days)
    deals = mt5.history_deals_get(from_date, datetime.now())
    if not deals:
        return []
    trades = []
    for d in deals:
        if d.type in (0, 1) and d.entry == 1:
            trades.append({
                "ticket": d.order,
                "symbol": d.symbol,
                "type": "BUY" if d.type == 0 else "SELL",
                "volume": d.volume,
                "price": round(d.price, 5),
                "profit": round(d.profit, 2),
                "commission": round(d.commission, 2),
                "swap": round(d.swap, 2),
                "time": datetime.fromtimestamp(d.time).strftime("%Y-%m-%d %H:%M"),
                "comment": d.comment,
            })
    return sorted(trades, key=lambda x: x["time"], reverse=True)

def get_performance_stats(days=90):
    trades = get_closed_trades(days)
    if not trades:
        return {}
    profits = [t["profit"] for t in trades]
    wins = [p for p in profits if p > 0]
    losses = [p for p in profits if p < 0]
    total = len(profits)
    win_rate = round(len(wins) / total * 100, 1) if total else 0
    avg_win = round(sum(wins) / len(wins), 2) if wins else 0
    avg_loss = round(sum(losses) / len(losses), 2) if losses else 0
    pf = round(abs(sum(wins) / sum(losses)), 2) if losses and sum(losses) != 0 else 0

    # Cumulative balance
    cum = []
    running = 0
    for t in sorted(trades, key=lambda x: x["time"]):
        running += t["profit"]
        cum.append({"time": t["time"], "balance": round(running, 2)})

    return {
        "total_trades": total, "wins": len(wins), "losses": len(losses),
        "win_rate": win_rate, "total_profit": round(sum(profits), 2),
        "avg_win": avg_win, "avg_loss": avg_loss, "profit_factor": pf,
        "best_trade": round(max(profits), 2), "worst_trade": round(min(profits), 2),
        "cum_balance": cum,
    }

# ── Demo data ────────────────────────────────────────────────────────────────

def demo_account_info():
    return {
        "live": False, "login": "—", "name": "Not Connected",
        "broker": "—", "balance": 0, "equity": 0,
        "margin": 0, "free_margin": 0, "profit": 0,
        "leverage": "—", "currency": "USD", "server": "—",
    }

def demo_positions():
    return []

def demo_closed_trades():
    import random; random.seed(42)
    trades = []
    base = datetime(2026, 1, 1)
    for i in range(43):
        win = random.random() > 0.62
        profit = round(random.uniform(25, 160), 2) if win else round(random.uniform(-120, -15), 2)
        t = base + timedelta(days=random.randint(0, 82), hours=random.randint(8, 17))
        trades.append({
            "ticket": 9800000+i, "symbol": "GBPUSD",
            "type": random.choice(["BUY","SELL"]), "volume": 0.10,
            "price": round(1.25 + random.uniform(-0.02, 0.02), 5),
            "profit": profit, "commission": -2.50,
            "swap": round(random.uniform(-1,1), 2),
            "time": t.strftime("%Y-%m-%d %H:%M"), "comment": "",
        })
    return sorted(trades, key=lambda x: x["time"], reverse=True)

# ── HTTP Handler ────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def send_json(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        routes = {
            "/status":    get_connection_status,
            "/account":   get_account_info,
            "/positions": get_open_positions,
            "/trades":    get_closed_trades,
            "/stats":     get_performance_stats,
        }
        handler = routes.get(path)
        if handler:
            self.send_json(handler())
        else:
            self.send_json({"error": "not found"}, 404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if self.path == "/connect":
            ok, msg = connect(
                login=body.get("login"),
                password=body.get("password"),
                server=body.get("server"),
            )
            self.send_json({"success": ok, "message": msg})
        elif self.path == "/disconnect":
            global _connected
            if MT5_AVAILABLE:
                mt5.shutdown()
            _connected = False
            self.send_json({"success": True})
        else:
            self.send_json({"error": "not found"}, 404)

if __name__ == "__main__":
    # Try auto-connect on startup
    ok, msg = connect()
    mode = "LIVE" if ok else ("DEMO — no credentials saved" if not load_creds().get("login") else f"OFFLINE — {msg}")
    print(f"🟢 MT5 Bridge → http://127.0.0.1:5001  [{mode}]")
    server = HTTPServer(("127.0.0.1", 5001), Handler)
    server.serve_forever()
