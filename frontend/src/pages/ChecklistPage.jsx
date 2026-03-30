import { useState } from 'react';
import { CheckSquare, Square, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import './ChecklistPage.css';

/* ─── Grade thresholds ──────────────────────────────────────────────────────── */
const GRADE_THRESHOLDS = [
  { grade: 'A+', min: 4.5,  color: 'green',  label: 'Elite Setup — Take it' },
  { grade: 'A',  min: 3.5,  color: 'blue',   label: 'Strong Setup — Proceed' },
  { grade: 'B',  min: 2.5,  color: 'amber',  label: 'Marginal — Reduce size' },
  { grade: 'NO', min: 0,    color: 'red',    label: 'No Trade — Step Away' },
];

/* ─── Scoring metrics (each max 1 point, can give 0.5) ─────────────────────── */
const METRICS = [
  {
    id: 'dxy',
    label: 'DXY Alignment',
    description: 'Is the Dollar confirming directional bias?',
    options: [
      { val: 1,   label: 'Fully aligned',         sub: 'DXY confirms trade direction' },
      { val: 0.5, label: 'Partially aligned',      sub: 'Mixed — DXY slightly against' },
      { val: 0,   label: 'Against or unclear',     sub: 'DXY contradicts or no read' },
    ],
  },
  {
    id: 'htf_align',
    label: '4H / 1H Alignment',
    description: 'Are higher timeframes pointing the same direction?',
    options: [
      { val: 1,   label: 'Both aligned',           sub: '4H + 1H agree on direction' },
      { val: 0.5, label: 'One aligns',             sub: 'Only 4H or only 1H confirms' },
      { val: 0,   label: 'Conflicting',            sub: 'HTF and MTF point opposite' },
    ],
  },
  {
    id: 'targets',
    label: 'Clear Targets',
    description: 'Is there a defined TP and the external path is clean?',
    options: [
      { val: 1,   label: 'Clear TP + clean path',  sub: 'No major OBs in the way' },
      { val: 0.5, label: 'TP visible but blocked', sub: 'Some resistance/support near TP' },
      { val: 0,   label: 'No clear target',        sub: 'Unclear where price is going' },
    ],
  },
  {
    id: 'model',
    label: 'Model Quality',
    description: 'How clean is the entry model (sweep, BOS, POI confluence)?',
    options: [
      { val: 1,   label: 'Textbook entry',         sub: 'Sweep + BOS + clean POI + rejection' },
      { val: 0.5, label: 'Decent but missing one', sub: 'Setup is there, one element weak' },
      { val: 0,   label: 'Forced / no model',      sub: 'Chasing, no clear trigger' },
    ],
  },
  {
    id: 'entry_5m',
    label: '5M Order Flow',
    description: 'Does 5M price action confirm the trade on entry?',
    options: [
      { val: 1,   label: 'Full confirmation',       sub: '5M BOS in direction + rejection candle' },
      { val: 0.5, label: 'Partial signal',          sub: 'Price reacted but no strong candle' },
      { val: 0,   label: 'No confirmation',         sub: 'Entered before 5M confirmed' },
    ],
  },
];

/* ─── Prerequisites ─────────────────────────────────────────────────────────── */
const PREREQS = [
  { id: 'no_news',   label: 'No high-impact news in the next 30 min' },
  { id: 'session',   label: 'Active session (London or New York open)' },
  { id: 'rr',        label: 'RR ≥ 1.25 is achievable to the TP' },
  { id: 'not_forced',label: 'Not forcing — I genuinely see the setup' },
];

/* ─── Binary checklist ──────────────────────────────────────────────────────── */
const BINARY = [
  { id: 'htf_weak',  label: 'HTF weak structure identified on 4H/1H' },
  { id: 'mtf_weak',  label: 'MTF weak structure visible on 30M/15M' },
  { id: 'ps_marked', label: 'Premium/Discount zones are marked' },
  { id: 'bos_valid', label: 'BOS is valid (body close, not wick)' },
  { id: 'path',      label: 'External path is clean to TP' },
  { id: 'rejection', label: 'Rejection candle confirmed on entry TF' },
  { id: 'sweep',     label: 'Stop hunt / liquidity sweep visible' },
  { id: 'sized',     label: 'Position sized correctly (max risk 1%)' },
  { id: 'revenge',   label: 'NOT revenge trading or emotional entry' },
];

function getGrade(score) {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

export default function ChecklistPage() {
  const [scores,    setScores]   = useState({});
  const [prereqs,   setPrereqs]  = useState({});
  const [binary,    setBinary]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  const totalScore  = METRICS.reduce((s, m) => s + (scores[m.id] ?? 0), 0);
  const maxScore    = METRICS.length;
  const scorePct    = Math.round((totalScore / maxScore) * 100);
  const grade       = getGrade(totalScore);
  const prereqsDone = PREREQS.every(p => prereqs[p.id]);
  const binaryScore = BINARY.filter(b => binary[b.id]).length;
  const binaryPct   = Math.round((binaryScore / BINARY.length) * 100);

  const setScore = (id, val) => setScores(s => ({ ...s, [id]: val }));
  const togglePre = (id) => setPrereqs(p => ({ ...p, [id]: !p[id] }));
  const toggleBin = (id) => setBinary(b => ({ ...b, [id]: !b[id] }));

  const reset = () => { setScores({}); setPrereqs({}); setBinary({}); setSubmitted(false); };

  return (
    <div className="checklist-page animate-fade-up">

      <div className="cl-header">
        <div className="cl-header-left">
          <span className="page-label">// pre-trade ritual</span>
          <h2>Trade Checklist</h2>
          <p className="cl-subtitle">Grade your setup before you pull the trigger. Honesty is your edge.</p>
        </div>
        <div className="cl-score-display">
          <div className={`cl-grade-ring cl-ring-${grade.color}`}>
            <span className="cl-grade-letter">{grade.grade}</span>
            <span className="cl-grade-score">{totalScore.toFixed(1)} / {maxScore}</span>
          </div>
          <div className="cl-grade-info">
            <span className={`cl-grade-label cl-label-${grade.color}`}>{grade.label}</span>
            {!prereqsDone && (
              <span className="cl-prereq-warn">
                <AlertTriangle size={12}/> Prerequisites incomplete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="cl-progress-track">
        <div className={`cl-progress-fill cl-pf-${grade.color}`} style={{ width: `${scorePct}%` }}/>
      </div>

      {/* ── Prerequisites ── */}
      <div className="cl-section">
        <div className="cl-section-title">
          <AlertTriangle size={13}/>
          Prerequisites — All must be ✓ before trading
        </div>
        <div className="cl-prereq-grid">
          {PREREQS.map(p => (
            <button key={p.id} className={`cl-prereq-btn${prereqs[p.id] ? ' checked' : ''}`}
              onClick={() => togglePre(p.id)}>
              {prereqs[p.id] ? <CheckSquare size={14}/> : <Square size={14}/>}
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Scoring metrics ── */}
      <div className="cl-section">
        <div className="cl-section-title">
          <TrendingUp size={13}/>
          Setup Scoring — Be ruthlessly honest
        </div>
        <div className="cl-metrics">
          {METRICS.map(m => (
            <div key={m.id} className="cl-metric-card">
              <div className="cl-metric-header">
                <span className="cl-metric-label">{m.label}</span>
                <span className="cl-metric-desc">{m.description}</span>
              </div>
              <div className="cl-metric-options">
                {m.options.map(opt => (
                  <button
                    key={opt.val}
                    className={`cl-opt${scores[m.id] === opt.val ? ' selected' : ''} cl-opt-${opt.val >= 1 ? 'full' : opt.val >= 0.5 ? 'half' : 'zero'}`}
                    onClick={() => setScore(m.id, opt.val)}
                  >
                    <span className="cl-opt-score">{opt.val}</span>
                    <div className="cl-opt-body">
                      <span className="cl-opt-label">{opt.label}</span>
                      <span className="cl-opt-sub">{opt.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Binary checklist ── */}
      <div className="cl-section">
        <div className="cl-section-title">
          <Zap size={13}/>
          Structure Verification — {binaryScore}/{BINARY.length} confirmed ({binaryPct}%)
        </div>
        <div className="cl-binary-grid">
          {BINARY.map(b => (
            <button key={b.id} className={`cl-binary-btn${binary[b.id] ? ' checked' : ''}`}
              onClick={() => toggleBin(b.id)}>
              {binary[b.id] ? <CheckSquare size={13}/> : <Square size={13}/>}
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Final verdict ── */}
      <div className={`cl-verdict cl-verdict-${grade.color}`}>
        <div className="cl-verdict-left">
          <span className="cl-verdict-grade">{grade.grade}</span>
          <div className="cl-verdict-text">
            <span className="cl-verdict-label">{grade.label}</span>
            <span className="cl-verdict-sub">Score {totalScore.toFixed(1)} / {maxScore} · {binaryPct}% structure confirmed</span>
          </div>
        </div>
        <div className="cl-verdict-actions">
          {!prereqsDone && (
            <span className="cl-verdict-warn"><AlertTriangle size={12}/> Check prerequisites</span>
          )}
          <button className="cl-btn-reset" onClick={reset}>Reset</button>
        </div>
      </div>

      {/* ── Reminder card ── */}
      <div className="cl-reminder">
        <p>"The discipline of waiting for the right trade is what separates professionals from amateurs."</p>
        <p className="cl-reminder-note">If it's not A+, it's B-grade. If it's B-grade, cut size in half. If it's below 2.5, do not trade.</p>
      </div>

    </div>
  );
}
