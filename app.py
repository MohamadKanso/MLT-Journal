import os, json, requests, subprocess, sys, threading, asyncio, io
from flask import Flask, render_template, request, jsonify, send_from_directory, Response
from werkzeug.utils import secure_filename
import database as db

def start_mt5_bridge():
    """Launch the MT5 bridge as a background subprocess if not already running."""
    try:
        requests.get("http://127.0.0.1:5001/status", timeout=1)
        return  # already running
    except Exception:
        pass
    bridge_path = os.path.join(os.path.dirname(__file__), "mt5_bridge.py")
    subprocess.Popen(
        [sys.executable, bridge_path],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )

threading.Thread(target=start_mt5_bridge, daemon=True).start()

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "static", "uploads")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

ALLOWED = {"png", "jpg", "jpeg", "gif", "webp", "bmp"}
def allowed(f): return "." in f and f.rsplit(".", 1)[1].lower() in ALLOWED

DEMO_MODE = os.environ.get("DEMO_MODE", "0") == "1"
def demo_block():
    return jsonify({"error": "Read-only demo — download the app locally to add your own trades.", "demo": True}), 403

MT5_BRIDGE = "http://127.0.0.1:5001"

# ── Serve React SPA ───────────────────────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # Serve actual files (JS/CSS/assets) if they exist in the dist folder
    if path:
        full = os.path.join(FRONTEND_DIST, path)
        if os.path.isfile(full):
            return send_from_directory(FRONTEND_DIST, path)
    # Everything else → index.html (React Router handles it)
    return send_from_directory(FRONTEND_DIST, "index.html")

@app.route("/static/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ── Trades API ────────────────────────────────────────────────────────────────
@app.route("/api/trades", methods=["GET"])
def list_trades():
    filters = {k: v for k, v in request.args.items() if v and v != "all"}
    return jsonify(db.get_all_trades(filters))

@app.route("/api/trades", methods=["POST"])
def create_trade():
    if DEMO_MODE: return demo_block()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400
    tid = db.save_trade(data)
    return jsonify({"id": tid, "success": True}), 201

@app.route("/api/trades/<int:tid>", methods=["GET"])
def get_trade(tid):
    t = db.get_trade(tid)
    if not t: return jsonify({"error": "Not found"}), 404
    return jsonify(t)

@app.route("/api/trades/<int:tid>", methods=["PUT"])
def update_trade(tid):
    if DEMO_MODE: return demo_block()
    data = request.get_json()
    db.update_trade(tid, data)
    return jsonify({"success": True})

@app.route("/api/trades/<int:tid>", methods=["DELETE"])
def delete_trade(tid):
    if DEMO_MODE: return demo_block()
    db.delete_trade(tid)
    return jsonify({"success": True})

@app.route("/api/trades/bulk-delete", methods=["POST"])
def bulk_delete_trades():
    if DEMO_MODE: return demo_block()
    data = request.get_json()
    ids  = data.get("ids", [])
    for tid in ids:
        db.delete_trade(tid)
    return jsonify({"success": True, "deleted": len(ids)})

# ── Trash API ─────────────────────────────────────────────────────────────────
@app.route("/api/trash", methods=["GET"])
def list_trash():
    return jsonify(db.get_trash())

@app.route("/api/trash/restore/<int:tid>", methods=["POST"])
def restore_trade(tid):
    if DEMO_MODE: return demo_block()
    db.restore_trade(tid)
    return jsonify({"success": True})

@app.route("/api/trash/<int:tid>", methods=["DELETE"])
def permanent_delete(tid):
    if DEMO_MODE: return demo_block()
    t = db.get_trade(tid)  # get_trade reads by id regardless of deleted_at
    if t:
        for field in ["chart_images", "dxy_chart_images"]:
            imgs = json.loads(t.get(field) or "[]")
            for img in imgs:
                fname_str = img.get("filename") if isinstance(img, dict) else img
                if not fname_str: continue
                fpath = os.path.join(app.config["UPLOAD_FOLDER"], fname_str)
                if os.path.exists(fpath): os.remove(fpath)
    db.permanent_delete_trade(tid)
    return jsonify({"success": True})

@app.route("/api/trash/empty", methods=["DELETE"])
def empty_trash():
    if DEMO_MODE: return demo_block()
    trashed = db.get_trash()
    for t in trashed:
        for field in ["chart_images", "dxy_chart_images"]:
            imgs = json.loads(t.get(field) or "[]")
            for img in imgs:
                fname_str = img.get("filename") if isinstance(img, dict) else img
                if not fname_str: continue
                fpath = os.path.join(app.config["UPLOAD_FOLDER"], fname_str)
                if os.path.exists(fpath): os.remove(fpath)
        db.permanent_delete_trade(t["id"])
    return jsonify({"success": True, "deleted": len(trashed)})

@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify(db.get_stats())

# ── Neural TTS via edge-tts (Microsoft Edge neural voices) ────────────────────
@app.route("/api/tts", methods=["POST"])
def text_to_speech():
    try:
        import edge_tts
    except ImportError:
        return jsonify({"error": "edge_tts not installed — run: pip install edge-tts"}), 500

    data  = request.get_json() or {}
    text  = data.get("text", "").strip()
    voice = data.get("voice", "en-US-AriaNeural")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    async def _generate():
        communicate = edge_tts.Communicate(text, voice)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        return buf.getvalue()

    try:
        audio_bytes = asyncio.run(_generate())
        return Response(audio_bytes, mimetype="audio/mpeg",
                        headers={"Cache-Control": "no-store"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Image Upload ──────────────────────────────────────────────────────────────
@app.route("/api/upload", methods=["POST"])
def upload_image():
    if DEMO_MODE: return demo_block()
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    f = request.files["file"]
    if not f.filename or not allowed(f.filename):
        return jsonify({"error": "Invalid file"}), 400
    import uuid
    ext = f.filename.rsplit(".", 1)[1].lower()
    fname = f"{uuid.uuid4().hex}.{ext}"
    f.save(os.path.join(app.config["UPLOAD_FOLDER"], fname))
    return jsonify({"filename": fname, "url": f"/static/uploads/{fname}"})

@app.route("/api/upload/delete", methods=["POST"])
def delete_image():
    data = request.get_json()
    fname = secure_filename(data.get("filename", ""))
    fpath = os.path.join(app.config["UPLOAD_FOLDER"], fname)
    if os.path.exists(fpath):
        os.remove(fpath)
    return jsonify({"success": True})

# ── MT5 Bridge Proxy ──────────────────────────────────────────────────────────
def mt5_get(path):
    try:
        r = requests.get(f"{MT5_BRIDGE}{path}", timeout=3)
        return r.json()
    except:
        return {"error": "bridge_offline", "connected": False}

def mt5_post(path, payload):
    try:
        r = requests.post(f"{MT5_BRIDGE}{path}", json=payload, timeout=5)
        return r.json()
    except:
        return {"error": "bridge_offline", "success": False}

@app.route("/api/live/status")
def live_status(): return jsonify(mt5_get("/status"))

@app.route("/api/live/account")
def live_account(): return jsonify(mt5_get("/account"))

@app.route("/api/live/positions")
def live_positions(): return jsonify(mt5_get("/positions"))

@app.route("/api/live/trades")
def live_trades(): return jsonify(mt5_get("/trades"))

@app.route("/api/live/stats")
def live_stats(): return jsonify(mt5_get("/stats"))

@app.route("/api/live/connect", methods=["POST"])
def live_connect():
    data = request.get_json()
    result = mt5_post("/connect", data)
    return jsonify(result)

@app.route("/api/live/disconnect", methods=["POST"])
def live_disconnect():
    result = mt5_post("/disconnect", {})
    return jsonify(result)

if __name__ == "__main__":
    print("\n  ╔═══════════════════════════════╗")
    print("  ║   MLT JOURNAL  v2.0          ║")
    print("  ║   http://localhost:5000        ║")
    print("  ╚═══════════════════════════════╝\n")
    app.run(debug=False, port=5000, host="0.0.0.0")
