import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, X, Loader2, Clipboard, Plus, ChevronDown, ArrowLeft } from 'lucide-react';
import './JournalPage.css';

// ── Option Lists (Notion Database 2026 — exact match) ────────────────────────
const PAIRS          = ['GBPUSD','EURUSD','USDJPY','XAUUSD','NASDAQ','AUDUSD'];
const SESSIONS       = ['London','New York','Asia','Off-Session'];
const TRADE_TYPES    = ['Live','BT','FT'];
const DIRECTION_TYPES= ['External','Internal','3SL'];
const ENTRY_MODELS   = ['EPS+D','EPS+S','IPS+S','IPS+D','ENC+D','ENC+S','INC+D','INC+S'];
const GRADES         = ['A+','A','B','Not Valid'];
const RISK_PCTS      = ['2%','1.5%','1%','0.8%','0.5%','0.4%','0.3%','0.2%','0.1%'];
const RESULTS        = ['Take-Profit','Stop-Loss','Breakeven','Breakeven - TP','Breakeven - SL','Partial Loss','Partial Win'];
const WEEKDAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const NEWS_OPTIONS   = ['No News','>2 Hours Before','>2 Hours After'];
const RULE_OPTIONS   = ['Rules Followed','Rules NOT Followed'];
const DURATION_OPTIONS = ['<1 Hour','1-2 Hours','2-3 Hours','3-4 Hours','4-5 Hours','5-6 Hours','6-7 Hours','7-8 Hours','8-9 Hours','9-10 Hours'];
const TIMEFRAMES     = ['1M','3M','5M','15M','30M','1H','4H','1D','W','M'];

function getWeekday(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[d.getDay()] || '';
}

const EMPTY = {
  trade_name: '',
  date: new Date().toISOString().split('T')[0],
  time_of_trade: '',
  weekday: '',
  session: '',
  pairs: 'GBPUSD',
  position: 'Long',
  trade_type: '',
  type_direction: '',
  entry_model: '',
  grade: '',
  risk_pct: '',
  rr: '',
  result: '',
  profit_pct: '',
  news: '',
  trading_rules: '',
  entry_model_time: '',
  dxy: '',
  top_down: '',
  psycho: '',
  review_lesson: '',
  why_grade: '',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const editId         = searchParams.get('id');
  const isEdit         = !!editId;

  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData,   setFormData]   = useState({ ...EMPTY, weekday: getWeekday(EMPTY.date) });
  const [images,     setImages]     = useState([]);

  // ── Load trade in edit mode ────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    setFetching(true);
    fetch(`/api/trades/${editId}`)
      .then(r => r.json())
      .then(trade => {
        const loaded = { ...EMPTY, ...trade };
        setFormData(loaded);
        let imgs = [];
        try { imgs = JSON.parse(trade.chart_images || '[]'); } catch {}
        setImages(imgs.map((img, i) => ({
          id: i + Date.now(),
          filename: img.filename || img,
          url: `/static/uploads/${img.filename || img}`,
          timeframe: img.timeframe || '5M',
          uploading: false,
        })));
      })
      .finally(() => setFetching(false));
  }, [editId]);

  // ── Field setters ──────────────────────────────────────────────────────────
  const set = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(p => ({
      ...p, [name]: value,
      ...(name === 'date' ? { weekday: getWeekday(value) } : {}),
    }));
  }, []);

  // ── Image handling ─────────────────────────────────────────────────────────
  const processFiles = useCallback(async (files, defaultTF = '5M') => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const id       = Date.now() + Math.random();
      const localUrl = URL.createObjectURL(file);
      setImages(p => [...p, { id, url: localUrl, timeframe: defaultTF, uploading: true, filename: null }]);
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res  = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok) {
          setImages(p => p.map(i => i.id===id ? { ...i, filename: data.filename, url: data.url, uploading: false } : i));
        } else {
          setImages(p => p.filter(i => i.id!==id));
        }
      } catch {
        setImages(p => p.filter(i => i.id!==id));
      }
    }
  }, []);

  useEffect(() => {
    const onPaste = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imgs  = items.filter(it => it.type.startsWith('image/')).map(it => it.getAsFile()).filter(Boolean);
      if (!imgs.length) return;
      e.preventDefault();
      processFiles(imgs, '5M');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [processFiles]);

  const removeImage = (id)     => setImages(p => p.filter(i => i.id!==id));
  const updateTF    = (id, tf) => setImages(p => p.map(i => i.id===id ? {...i, timeframe: tf} : i));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setSuccessMsg('');
    const payload = {
      ...formData,
      weekday: getWeekday(formData.date),
      chart_images: JSON.stringify(
        images.filter(i => !i.uploading && i.filename).map(i => ({ filename: i.filename, timeframe: i.timeframe }))
      ),
    };
    try {
      const url    = isEdit ? `/api/trades/${editId}` : '/api/trades';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setSuccessMsg(isEdit ? 'Trade updated!' : 'Trade journaled!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (!isEdit) {
          setTimeout(() => {
            setFormData({ ...EMPTY, weekday: getWeekday(EMPTY.date) });
            setImages([]);
            setSuccessMsg('');
          }, 2000);
        }
      } else {
        alert('Failed to save trade.');
      }
    } catch(err) { alert('Error: ' + err.message); }
    setLoading(false);
  };

  if (fetching) return (
    <div className="journal-page"><div className="loading-state"><div className="loading-dots"><span/><span/><span/></div>loading trade data...</div></div>
  );

  return (
    <div className="journal-page animate-fade-up">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <span className="page-label">// trading journal</span>
          <h2>{isEdit ? `Edit  ·  Trade #${editId}` : 'New Entry'}</h2>
        </div>
        <div className="header-right">
          {successMsg && (
            <div className="success-banner">
              <CheckCircle size={14}/> {successMsg}
            </div>
          )}
          {isEdit && (
            <button className="btn-back" onClick={() => navigate('/')}>
              <ArrowLeft size={14}/> Back
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="journal-form">

        {/* ══ 01  TRADE IDENTIFICATION ══════════════════════════════════════ */}
        <Sec num="01" title="Trade Identification" accent="red">
          <div className="fg cols-4">
            <FG label="Trade Name">
              <input name="trade_name" value={formData.trade_name} onChange={set} placeholder="e.g. Trade (5)"/>
            </FG>
            <FG label="Date">
              <input type="date" name="date" value={formData.date} onChange={set} required/>
            </FG>
            <FG label="Time">
              <input type="time" name="time_of_trade" value={formData.time_of_trade} onChange={set}/>
            </FG>
            <FG label="Weekday">
              <div className="readonly-chip">{formData.weekday || getWeekday(formData.date) || '—'}</div>
            </FG>
            <FG label="Pair">
              <Sel name="pairs" value={formData.pairs} onChange={set} opts={PAIRS}/>
            </FG>
            <FG label="Direction">
              <div className="toggle-group">
                {['Long','Short'].map(p => (
                  <button type="button" key={p}
                    className={`toggle-btn ${formData.position===p ? (p==='Long'?'active-buy':'active-sell') : ''}`}
                    onClick={() => setFormData(f => ({ ...f, position: p }))}>
                    {p === 'Long' ? '↑ Long' : '↓ Short'}
                  </button>
                ))}
              </div>
            </FG>
            <FG label="Session">
              <Sel name="session" value={formData.session} onChange={set} opts={SESSIONS} placeholder="— Select —"/>
            </FG>
            <FG label="Type">
              <Sel name="trade_type" value={formData.trade_type} onChange={set} opts={TRADE_TYPES} placeholder="— Select —"/>
            </FG>
          </div>
        </Sec>

        {/* ══ 02  SETUP ═════════════════════════════════════════════════════ */}
        <Sec num="02" title="Setup" accent="white">
          <div className="fg cols-3">
            <FG label="Trade Type">
              <Sel name="type_direction" value={formData.type_direction} onChange={set} opts={DIRECTION_TYPES} placeholder="— Select —"/>
            </FG>
            <FG label="Setup (Model)">
              <Sel name="entry_model" value={formData.entry_model} onChange={set} opts={ENTRY_MODELS} placeholder="— Select —"/>
            </FG>
            <FG label="Grade">
              <div className="grade-group">
                {GRADES.map(g => (
                  <button type="button" key={g}
                    className={`grade-btn ${formData.grade===g ? `grade-active-${g.replace('+','p').replace(' ','-').toLowerCase()}` : ''}`}
                    onClick={() => setFormData(f => ({ ...f, grade: f.grade===g ? '' : g }))}>
                    {g}
                  </button>
                ))}
              </div>
            </FG>
          </div>
        </Sec>

        {/* ══ 03  EXECUTION & RESULT ════════════════════════════════════════ */}
        <Sec num="03" title="Execution & Result" accent="green">
          <div className="fg cols-3">
            <FG label="Risk %">
              <Sel name="risk_pct" value={formData.risk_pct} onChange={set} opts={RISK_PCTS} placeholder="— Select —"/>
            </FG>
            <FG label="R:R">
              <input type="number" step="0.01" name="rr" value={formData.rr} onChange={set} placeholder="e.g. 2.5"/>
            </FG>
            <FG label="Result">
              <Sel name="result" value={formData.result} onChange={set} opts={RESULTS} placeholder="— Select —"/>
            </FG>
            <FG label="Profit / Loss %">
              <input type="number" step="0.01" name="profit_pct" value={formData.profit_pct} onChange={set} placeholder="e.g. 2.5 or -1.0"/>
            </FG>
            <FG label="News">
              <Sel name="news" value={formData.news} onChange={set} opts={NEWS_OPTIONS} placeholder="— Select —"/>
            </FG>
            <FG label="Rules">
              <Sel name="trading_rules" value={formData.trading_rules} onChange={set} opts={RULE_OPTIONS} placeholder="— Select —"/>
            </FG>
            <FG label="Duration">
              <Sel name="entry_model_time" value={formData.entry_model_time} onChange={set} opts={DURATION_OPTIONS} placeholder="— Select —"/>
            </FG>
          </div>
        </Sec>

        {/* ══ 04  ANALYSIS & PSYCHOLOGY ═════════════════════════════════════ */}
        <Sec num="04" title="Analysis & Psychology" accent="red">
          <div className="fg cols-1">
            <FG label="DXY" full>
              <textarea name="dxy" value={formData.dxy} onChange={set} rows={2} placeholder="DXY context, direction, correlation..."/>
            </FG>
            <FG label="Top-Down Analysis" full>
              <textarea name="top_down" value={formData.top_down} onChange={set} rows={3} placeholder="All timeframes assessment, structure bias, entry logic..."/>
            </FG>
            <FG label="Psychology Notes" full>
              <textarea name="psycho" value={formData.psycho} onChange={set} rows={2} placeholder="Mindset, emotional state, discipline notes..."/>
            </FG>
            <FG label="Review / Lesson" full>
              <textarea name="review_lesson" value={formData.review_lesson} onChange={set} rows={3} placeholder="What would you do differently? Key lessons learnt..."/>
            </FG>
            <FG label="Why This Grade?" full>
              <textarea name="why_grade" value={formData.why_grade} onChange={set} rows={2} placeholder="Explain your grade reasoning..."/>
            </FG>
          </div>
        </Sec>

        {/* ══ 05  TRADE CHARTS ══════════════════════════════════════════════ */}
        <Sec num="05" title="Trade Charts" accent="white">
          <div className="paste-banner">
            <Clipboard size={14}/>
            <span>Press <kbd>⌘V</kbd> / <kbd>Ctrl+V</kbd> anywhere to paste a screenshot — images appear instantly</span>
          </div>
          <label className="drop-zone">
            <Plus size={22} className="drop-icon"/>
            <span>Click to upload chart images</span>
            <p className="drop-hint">PNG · JPG · WebP · GIF — multiple files ok</p>
            <input type="file" multiple accept="image/*"
              onChange={e => processFiles(Array.from(e.target.files))}
              style={{ display: 'none' }}/>
          </label>
          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map(img => (
                <div key={img.id} className="image-card">
                  <img src={img.url} alt="chart"/>
                  {img.uploading ? (
                    <div className="uploading-overlay"><Loader2 className="spinner" size={20}/></div>
                  ) : (
                    <>
                      <button type="button" className="btn-remove-img" onClick={() => removeImage(img.id)}>
                        <X size={11}/>
                      </button>
                      <div className="image-timeframe">
                        <select value={img.timeframe} onChange={e => updateTF(img.id, e.target.value)}>
                          {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {images.length === 0 && (
            <div className="no-charts-hint">No charts yet — paste or upload above</div>
          )}
        </Sec>

        {/* ══ SUBMIT ════════════════════════════════════════════════════════ */}
        <div className="form-actions-wrapper">
          <span className="form-note">// pair & date required · all other fields optional</span>
          <div className="form-btns">
            {isEdit && (
              <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
            )}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading
                ? <><Loader2 size={13} className="spin-inline"/> Saving...</>
                : isEdit ? 'Update Trade' : 'Save Entry'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

// ── Mini components ─────────────────────────────────────────────────────────
function Sec({ num, title, accent, children }) {
  return (
    <div className={`form-section accent-${accent}`}>
      <div className="section-header">
        <span className="section-num">{num}</span>
        <span className="section-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

function FG({ label, full, children }) {
  return (
    <div className={`form-group${full ? ' full-width' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Sel({ name, value, onChange, opts, placeholder }) {
  return (
    <div className="select-wrapper">
      <select name={name} value={value} onChange={onChange}>
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="select-arrow"/>
    </div>
  );
}
