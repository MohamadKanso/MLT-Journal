#!/bin/bash
cd "$(dirname "$0")"

# Install dependencies if needed
pip3 install flask requests --break-system-packages -q 2>/dev/null

echo "🟢 Starting KansoTrader..."
echo ""
echo "  Live Dashboard:  http://localhost:5000"
echo "  MT5 Bridge:      Start mt5_bridge.py separately if needed"
echo ""

# Start MT5 bridge in background
python3 mt5_bridge.py &
BRIDGE_PID=$!
sleep 1

# Start main app
python3 app.py &
APP_PID=$!
sleep 1

# Open in browser
open http://localhost:5000

echo ""
echo "  Press Ctrl+C to stop all services"
wait $APP_PID

# Cleanup
kill $BRIDGE_PID 2>/dev/null
