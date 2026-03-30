import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, ChevronDown, Loader2, CheckCircle, Zap } from 'lucide-react';
import './BacktestJournalPage.css';

// ── Backtest Trade Log — Notion exact options ─────────────────────────────
const BT_MODELS      = ['EPS+D','EPS+S','IPS+S','IPS+D','ENC+D','ENC+S','INC+D','INC+S'];
const BT_STRUCTURE   = ['External','Internal'];
const BT_BOS         = ['5M and less','15M and less','Was a NC'];
const BT_HTF         = ['MTF Target','MTF & HTF Target','Trending'];
const BT_REJ         = ['Single Rej','Double Rejection','Engulf Candle'];
const BT_BE          = ['BE after first structure reached','BE after first BOS','SL'];
const BT_CONF        = ['Imbalance','Liquidity','Divergence'];
const BT_NEWS        = ['No News','2H Before 🔴','2H After 🔴','2H After 🟠','2H Before 🟠'];
const BT_RESULTS     = ['Win','Loss','BE win','BE loss','Win early cuz of news','Loss early cuz of news','Win early cuz of spreads at 10'];

// Map backtest results to main journal results
function mapResult(btResult) {
  const map = {
    'Win':                          'Take-Profit',
    'Loss':                         'Stop-Loss',
    'BE win':                       'Breakeven - TP',
    'BE loss':                      'Breakeven - SL',
    'Win early cuz of news':        'Take-Profit',
    'Loss early cuz of news':       'Stop-Loss',
    'Win early cuz of spreads at 10': 'Take-Profit',
  };
  return map[btResult] || btResult;
}

function isWin(result)   { return result && (result.startsWith('Win') || result === 'Win'); }
function isLoss(result)  { return result && (result.startsWith('Loss') || result === 'Loss'); }
function isBE(result)    { return result && result.startsWith('BE'); }

function computeProfit(result, rr) {
  const r = parseFloat(rr) || 0;
  if (isWin(result))  return r;
  if (isLoss(result)) return -1.0;
  return 0;
}

function nowDateStr()   { return new Date().toISOString().split('T')[0]; }
function nowTimeStr()   { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }

const EMPTY_FORM = {
  trade_name:   '',
  date:         nowDateStr(),
  time_of_trade:'',
  entry_model:  '',
  type_direction: '',
  break_of_structure: [],
  htf_weak:     [],
  rejection_candle: '',
  be_criteria:  '',
  trade_confluences: [],
  news:         'No News',
  bt_result:    '',
  rr:           '',
  review_lesson:'',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function BacktestJournalPage() {
  const [trades,     setTrades]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [formData,   setFormData]   = useState({ ...EMPTY_FORM, time_of_trade: nowTimeStr() });
  const [submitting, setSubmitting] = useState(false);
  const [successId,  setSuccessId]  = useState(null);
  const tradeNameRef = useRef(null);

  // ── Fetch backtest trades ─────────────────────────────────────────────────
  const fetchTrades = useCallback(() => {
    setLoading(true);
    fetch('/api/trades?trade_type=Backtest')
      .then(r => r.json())
      .then(data => {
        const sorted = (data || []).sort((a, b) => {
          const da = a.date || '', db = b.date || '';
          if (db !== da) return db.localeCompare(da);
          return (b.id || 0) - (a.id || 0);
        });
        setTrades(sorted);
      })
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // ── Auto-increment trade name ─────────────────────────────────────────────
  useEffect(() => {
    if (!showForm) return;
    const nums = trades
      .map(t => parseInt((t.trade_name || '').replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    setFormData(p => ({ ...p, trade_name: String(next), time_of_trade: nowTimeStr(), date: nowDateStr() }));
    setTimeout(() => tradeNameRef.current?.focus(), 100);
  }, [showForm, trades]);

  // ── Field handlers ────────────────────────────────────────────────────────
  const set = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  }, []);

  const toggleArr = useCallback((field, val) => {
    setFormData(p => ({
      ...p,
      [field]: p[field].includes(val)
        ? p[field].filter(x => x !== val)
        : [...p[field], val],
    }));
  }, []);

  const clickChip = useCallback((field, val) => {
    setFormData(p => ({ ...p, [field]: p[field] === val ? '' : val }));
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const mappedResult = mapResult(formData.bt_result);
    const profitPct    = computeProfit(formData.bt_result, formData.rr);
    const rrVal        = isLoss(formData.bt_result) ? -1 : (parseFloat(formData.rr) || null);

    const payload = {
      trade_name:        formData.trade_name,
      date:              formData.date,
      time_of_trade:     formData.time_of_trade,
      entry_model:       formData.entry_model,
      type_direction:    formData.type_direction,
      break_of_structure: formData.break_of_structure.join(', '),
      htf_weak:          formData.htf_weak.join(', '),
      rejection_candle:  formData.rejection_candle,
      be_criteria:       formData.be_criteria,
      trade_confluences: formData.trade_confluences.join(', '),
      news:              formData.news,
      result:            mappedResult,
      rr:                rrVal,
      profit_pct:        profitPct,
      review_lesson:     formData.review_lesson,
      // Always set for backtest
      trade_type:        'Backtest',
      pairs:             'GBPUSD',
      risk_pct:          '1%',
      session:           'London',
    };

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newTrade = await res.json();
        setSuccessId(newTrade.id || true);
        setShowForm(false);
        fetchTrades();
        setTimeout(() => setSuccessId(null), 3000);
      } else {
        alert('Failed to save trade.');
      }
    } catch(err) {
      alert('Error: ' + err.message);
    }
    setSubmitting(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({ ...EMPTY_FORM, time_of_trade: nowTimeStr() });
  };

  // ── Result chip color ─────────────────────────────────────────────────────
  function resultClass(result) {
    if (!result) return 'chip-neutral';
    const r = mapResult(result);
    if (r === 'Take-Profit') return 'chip-win';
    if (r === 'Stop-Loss')   return 'chip-loss';
    return 'chip-be';
  }

  function resultLabel(result) {
    if (!result) return '—';
    const r = mapResult(result);
    if (r === 'Take-Profit')     return 'Win';
    if (r === 'Stop-Loss')       return 'Loss';
    if (r === 'Breakeven - TP')  return 'BE+';
    if (r === 'Breakeven - SL')  return 'BE-';
    return r;
  }

  // ── Stats summary ─────────────────────────────────────────────────────────
  const wins   = trades.filter(t => t.result === 'Take-Profit').length;
  const losses = trades.filter(t => t.result === 'Stop-Loss').length;
  const bes    = trades.filter(t => t.result?.startsWith('Breakeven')).length;
  const winRate = trades.length > 0 ? Math.round(wins / trades.length * 100) : 0;
  const totalRR = trades.reduce((sum, t) => sum + (t.profit_pct || 0), 0);

  return (
    <div className="bt-page animate-fade-up">

      {/* ── Header ── */}
      <div className="bt-header">
        <div>
          <span className="page-label">// backtest journal</span>
          <h2>Backtest Log</h2>
        </div>
        <div className="bt-header-right">
          {successId && (
            <div className="bt-success"><CheckCircle size={13}/> Trade saved</div>
          )}
          <button className="bt-new-btn" onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus size={15}/> New Trade
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {trades.length > 0 && (
        <div className="bt-stats-bar">
          <div className="bt-stat">
            <span className="bt-stat-val">{trades.length}</span>
            <span className="bt-stat-label">Trades</span>
          </div>
          <div className="bt-stat">
            <span className="bt-stat-val green">{wins}</span>
            <span className="bt-stat-label">Wins</span>
          </div>
          <div className="bt-stat">
            <span className="bt-stat-val red">{losses}</span>
            <span className="bt-stat-label">Losses</span>
          </div>
          <div className="bt-stat">
            <span className="bt-stat-val amber">{bes}</span>
            <span className="bt-stat-label">BE</span>
          </div>
          <div className="bt-stat">
            <span className={`bt-stat-val ${winRate >= 50 ? 'green' : 'red'}`}>{winRate}%</span>
            <span className="bt-stat-label">Win Rate</span>
          </div>
          <div className="bt-stat">
            <span className={`bt-stat-val ${totalRR >= 0 ? 'green' : 'red'}`}>{totalRR >= 0 ? '+' : ''}{totalRR.toFixed(2)}R</span>
            <span className="bt-stat-label">Total P&amp;L</span>
          </div>
        </div>
      )}

      {/* ── Quick Entry Form ── */}
      {showForm && (
        <div className="bt-form-card">
          <div className="bt-form-header">
            <span className="bt-form-title"><Zap size={13}/> Quick Entry</span>
            <button className="bt-form-close" onClick={cancelForm}><X size={14}/></button>
          </div>

          <form onSubmit={handleSubmit} className="bt-form">

            {/* Row 1: meta */}
            <div className="bt-form-row">
              <div className="bt-fg">
                <label>Trade #</label>
                <input ref={tradeNameRef} name="trade_name" value={formData.trade_name} onChange={set} placeholder="1"/>
              </div>
              <div className="bt-fg">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={set}/>
              </div>
              <div className="bt-fg">
                <label>Time</label>
                <input type="time" name="time_of_trade" value={formData.time_of_trade} onChange={set}/>
              </div>
              <div className="bt-fg">
                <label>R:R</label>
                <input type="number" step="0.01" name="rr" value={formData.rr} onChange={set} placeholder="e.g. 2.5"/>
              </div>
            </div>

            {/* Model chips */}
            <div className="bt-chip-group">
              <label>Model</label>
              <div className="bt-chips">
                {BT_MODELS.map(m => (
                  <button type="button" key={m}
                    className={`bt-chip ${formData.entry_model === m ? 'selected' : ''}`}
                    onClick={() => clickChip('entry_model', m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Structure Type chips */}
            <div className="bt-chip-group">
              <label>Structure Type</label>
              <div className="bt-chips">
                {BT_STRUCTURE.map(s => (
                  <button type="button" key={s}
                    className={`bt-chip ${formData.type_direction === s ? 'selected' : ''}`}
                    onClick={() => clickChip('type_direction', s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* BOS multi */}
            <div className="bt-chip-group">
              <label>BOS</label>
              <div className="bt-chips">
                {BT_BOS.map(b => (
                  <button type="button" key={b}
                    className={`bt-chip ${formData.break_of_structure.includes(b) ? 'selected' : ''}`}
                    onClick={() => toggleArr('break_of_structure', b)}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* HTF Setting multi */}
            <div className="bt-chip-group">
              <label>HTF Setting</label>
              <div className="bt-chips">
                {BT_HTF.map(h => (
                  <button type="button" key={h}
                    className={`bt-chip ${formData.htf_weak.includes(h) ? 'selected' : ''}`}
                    onClick={() => toggleArr('htf_weak', h)}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Rejection + BE + News selects */}
            <div className="bt-form-row">
              <div className="bt-fg">
                <label>Rejection Candle</label>
                <BtSel name="rejection_candle" value={formData.rejection_candle} onChange={set} opts={BT_REJ} placeholder="— Select —"/>
              </div>
              <div className="bt-fg">
                <label>Break Even</label>
                <BtSel name="be_criteria" value={formData.be_criteria} onChange={set} opts={BT_BE} placeholder="— Select —"/>
              </div>
              <div className="bt-fg">
                <label>News</label>
                <BtSel name="news" value={formData.news} onChange={set} opts={BT_NEWS} placeholder="— Select —"/>
              </div>
            </div>

            {/* CONF multi */}
            <div className="bt-chip-group">
              <label>CONF (if NC)</label>
              <div className="bt-chips">
                {BT_CONF.map(c => (
                  <button type="button" key={c}
                    className={`bt-chip ${formData.trade_confluences.includes(c) ? 'selected' : ''}`}
                    onClick={() => toggleArr('trade_confluences', c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Result chips */}
            <div className="bt-chip-group">
              <label>Result</label>
              <div className="bt-chips">
                {BT_RESULTS.map(r => (
                  <button type="button" key={r}
                    className={`bt-chip bt-result-chip ${formData.bt_result === r ? `result-selected ${isWin(r) ? 'win' : isLoss(r) ? 'loss' : 'be'}` : ''}`}
                    onClick={() => clickChip('bt_result', r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bt-fg bt-fg-full">
              <label>Notes</label>
              <textarea name="review_lesson" value={formData.review_lesson} onChange={set} rows={2} placeholder="Quick notes on this trade..."/>
            </div>

            {/* Actions */}
            <div className="bt-form-actions">
              <button type="button" className="bt-cancel-btn" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="bt-submit-btn" disabled={submitting}>
                {submitting ? <><Loader2 size={12} className="bt-spin"/> Saving...</> : 'Save Trade'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ── Trade List ── */}
      {loading ? (
        <div className="bt-loading">
          <div className="loading-dots"><span/><span/><span/></div>
          loading trades...
        </div>
      ) : trades.length === 0 ? (
        <div className="bt-empty">
          <Zap size={28} strokeWidth={1}/>
          <p>No backtest trades yet</p>
          <p className="bt-empty-sub">Click "New Trade" to log your first backtest</p>
        </div>
      ) : (
        <div className="bt-table-wrap">
          <table className="bt-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Model</th>
                <th>Structure</th>
                <th>BOS</th>
                <th>HTF</th>
                <th>News</th>
                <th>Result</th>
                <th>R:R</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id} className="bt-row">
                  <td className="bt-td-num">{t.trade_name || t.id}</td>
                  <td className="bt-td-date">{t.date || '—'}</td>
                  <td><span className="bt-model-chip">{t.entry_model || '—'}</span></td>
                  <td className="bt-td-muted">{t.type_direction || '—'}</td>
                  <td className="bt-td-muted bt-td-sm">{t.break_of_structure || '—'}</td>
                  <td className="bt-td-muted bt-td-sm">{t.htf_weak || '—'}</td>
                  <td className="bt-td-muted bt-td-sm">{t.news || '—'}</td>
                  <td>
                    {t.result ? (
                      <span className={`bt-result-badge ${t.result === 'Take-Profit' ? 'badge-win' : t.result === 'Stop-Loss' ? 'badge-loss' : 'badge-be'}`}>
                        {t.result === 'Take-Profit' ? 'Win' : t.result === 'Stop-Loss' ? 'Loss' : t.result.replace('Breakeven', 'BE')}
                      </span>
                    ) : <span className="bt-td-muted">—</span>}
                  </td>
                  <td className={`bt-td-rr ${(t.profit_pct || 0) >= 0 ? 'green' : 'red'}`}>
                    {t.profit_pct != null ? `${t.profit_pct > 0 ? '+' : ''}${Number(t.profit_pct).toFixed(2)}R` : '—'}
                  </td>
                  <td className="bt-td-notes">{t.review_lesson ? (t.review_lesson.length > 60 ? t.review_lesson.slice(0, 60) + '...' : t.review_lesson) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BtSel({ name, value, onChange, opts, placeholder }) {
  return (
    <div className="bt-select-wrap">
      <select name={name} value={value} onChange={onChange}>
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={11} className="bt-sel-arrow"/>
    </div>
  );
}
