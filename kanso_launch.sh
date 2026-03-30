#!/usr/bin/env bash
# KansoTrader local launcher
# Starts Flask on localhost:5000 and opens the browser.
# Safe to run multiple times — won't start a second server if one is running.

APP_DIR="/Users/mohamadkanso/Desktop/Mohamad/Projects/KansoTrader"
LOG="$HOME/.kansotrader.log"
PORT=5000

# ── Check if already running on port 5000 ────────────────────────────────────
if lsof -ti:$PORT &>/dev/null; then
  # Already up — just open the browser
  open "http://localhost:$PORT"
  exit 0
fi

# ── Kill any stale cloudflared tunnels (no longer needed) ────────────────────
pkill -f cloudflared 2>/dev/null || true

# ── Start Flask ───────────────────────────────────────────────────────────────
cd "$APP_DIR"
nohup python3 app.py > "$LOG" 2>&1 &
FLASK_PID=$!

# ── Wait until Flask responds (up to 8 seconds) ───────────────────────────────
for i in $(seq 1 16); do
  sleep 0.5
  if curl -s --max-time 1 "http://localhost:$PORT" &>/dev/null; then
    break
  fi
done

# ── Open in default browser ───────────────────────────────────────────────────
open "http://localhost:$PORT"
