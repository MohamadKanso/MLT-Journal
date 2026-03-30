import { useState, useEffect, useMemo } from 'react';
import { Dna, TrendingUp, TrendingDown, Trophy, AlertOctagon,
         BarChart3, Target, Calendar, Clock, Zap, ChevronRight } from 'lucide-react';
import './PerformanceDNAPage.css';

// ── helpers ───────────────────────────────────────────────────────────────────
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SESSIONS = ['London', 'New York', 'Asian', 'London/NY Overlap'];

function isWin(t)  { return ['Take-Profit','Breakeven - TP','Partial Win'].includes(t.result); }
function isLoss(t) { return ['Stop-Loss','Partial Loss'].includes(t.result); }
function isBE(t)   { return ['Breakeven','Breakeven - SL'].includes(t.result); }

function calcEdge(trades) {
  if (!trades.length) return { score: 0, label: 'No Data', color: 'muted' };
  const wins    = trades.filter(isWin).length;
  const losses  = trades.filter(isLoss).length;
  const total   = trades.length;
  const wr      = wins / total;
  const profits = trades.map(t => t.profit_pct || 0);
  const winP    = trades.filter(isWin).map(t => t.profit_pct || 0);
  const lossP   = trades.filter(isLoss).map(t => t.profit_pct || 0);
  const sumWin  = winP.reduce((a, b) => a + b, 0);
  const sumLoss = lossP.reduce((a, b) => a + b, 0);
  const pf      = sumLoss !== 0 ? Math.abs(sumWin / sumLoss) : (sumWin > 0 ? 3 : 0);
  const avgWin  = winP.length  ? sumWin  / winP.length  : 0;
  const avgLoss = lossP.length ? sumLoss / lossP.length : 0;
  const exp     = (wr * avgWin) + ((1 - wr) * avgLoss);
  // Composite score: WR 40% + PF 35% + EXP 25%
  const wrScore  = Math.min(wr * 100 * 1.25, 100);          // 80% WR = 100 pts
  const pfScore  = Math.min(pf * 25, 100);                  // PF 4.0 = 100 pts
  const expScore = Math.min(Math.max((exp + 2) * 25, 0), 100); // exp 2 = 100 pts
  const score    = Math.round(wrScore * 0.4 + pfScore * 0.35 + expScore * 0.25);
  let label, color;
  if (total < 10) { label = 'Building';  color = 'amber'; }
  else if (score >= 72) { label = 'Strong Edge';   color = 'green'; }
  else if (score >= 50) { label = 'Developing';    color = 'blue'; }
  else if (score >= 32) { label = 'Needs Work';    color = 'amber'; }
  else                   { label = 'Negative Edge'; color = 'red'; }
  return { score, label, color, wr: Math.round(wr * 100), pf: +pf.toFixed(2), exp: +exp.toFixed(2) };
}

function patternKey(session, pair) { return `${session || '?'} · ${pair || '?'}`; }

function findPatterns(trades) {
  const map = {};
  trades.forEach(t => {
    const k = patternKey(t.session, t.pairs);
    if (!map[k]) map[k] = { key: k, session: t.session, pair: t.pairs, wins: 0, losses: 0, bes: 0, total: 0, pnl: 0 };
    map[k].total++;
    map[k].pnl += t.profit_pct || 0;
    if (isWin(t))  map[k].wins++;
    if (isLoss(t)) map[k].losses++;
    if (isBE(t))   map[k].bes++;
  });
  return Object.values(map)
    .filter(p => p.total >= 4)
    .map(p => ({ ...p, wr: Math.round(p.wins / p.total * 100), pnl: +p.pnl.toFixed(2) }));
}

function todayFitness(trades) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];
  const todayTrades = trades.filter(t => t.weekday === today);
  if (todayTrades.length < 3) return null;
  const wins = todayTrades.filter(isWin).length;
  const wr   = Math.round(wins / todayTrades.length * 100);
  const pnl  = todayTrades.reduce((a, t) => a + (t.profit_pct || 0), 0);
  return { day: today, wr, total: todayTrades.length, pnl: +pnl.toFixed(2) };
}

function breakdownByKey(trades, key) {
  const map = {};
  trades.forEach(t => {
    const k = t[key] || 'Unknown';
    if (!map[k]) map[k] = { key: k, wins: 0, losses: 0, bes: 0, total: 0, pnl: 0 };
    map[k].total++;
    map[k].pnl += t.profit_pct || 0;
    if (isWin(t))  map[k].wins++;
    if (isLoss(t)) map[k].losses++;
    if (isBE(t))   map[k].bes++;
  });
  return Object.values(map)
    .map(d => ({ ...d, wr: d.total ? Math.round(d.wins / d.total * 100) : 0, pnl: +d.pnl.toFixed(2) }))
    .sort((a, b) => b.total - a.total);
}

// Heatmap: session (row) × weekday (col)
function buildHeatmap(trades) {
  const grid = {};
  trades.forEach(t => {
    const s = t.session || 'Unknown';
    const w = t.weekday || 'Unknown';
    if (!grid[s]) grid[s] = {};
    if (!grid[s][w]) grid[s][w] = { wins: 0, total: 0 };
    grid[s][w].total++;
    if (isWin(t)) grid[s][w].wins++;
  });
  // Compute wr per cell
  const result = {};
  Object.entries(grid).forEach(([s, days]) => {
    result[s] = {};
    Object.entries(days).forEach(([d, v]) => {
      result[s][d] = { total: v.total, wr: v.total ? Math.round(v.wins / v.total * 100) : 0 };
    });
  });
  return result;
}

// Gauge arc SVG
function GaugeArc({ score, color }) {
  const r = 52, cx = 64, cy = 64;
  const circumference = Math.PI * r; // half circle
  const offset = circumference - (score / 100) * circumference;
  const colorMap = {
    green: 'var(--nt-green)', blue: 'var(--nt-blue)',
    amber: 'var(--nt-amber)', red: 'var(--nt-red)', muted: 'var(--nt-text-muted)',
  };
  const stroke = colorMap[color] || 'var(--nt-text-muted)';
  return (
    <svg width="128" height="72" viewBox="0 0 128 80">
      {/* track */}
      <path d={`M 12 68 A 52 52 0 0 1 116 68`} fill="none"
        stroke="var(--nt-surface-3)" strokeWidth="8" strokeLinecap="round"/>
      {/* fill */}
      <path d={`M 12 68 A 52 52 0 0 1 116 68`} fill="none"
        stroke={stroke} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      {/* score text */}
      <text x="64" y="62" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="20" fontWeight="700" fill="var(--nt-text-primary)">
        {score}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PerformanceDNAPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trades')
      .then(r => r.json())
      .then(data => { setTrades(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const edge     = useMemo(() => calcEdge(trades), [trades]);
  const patterns = useMemo(() => findPatterns(trades), [trades]);
  const golden   = useMemo(() => [...patterns].sort((a, b) => b.wr - a.wr).slice(0, 5), [patterns]);
  const traps    = useMemo(() => [...patterns].sort((a, b) => a.wr - b.wr).slice(0, 5), [patterns]);
  const byPair   = useMemo(() => breakdownByKey(trades, 'pairs'), [trades]);
  const bySess   = useMemo(() => breakdownByKey(trades, 'session'), [trades]);
  const byGrade  = useMemo(() => breakdownByKey(trades, 'grade'), [trades]);
  const heatmap  = useMemo(() => buildHeatmap(trades), [trades]);
  const fitness  = useMemo(() => todayFitness(trades), [trades]);
  const heatSessions = useMemo(() => Object.keys(heatmap).sort(), [heatmap]);

  const total  = trades.length;
  const wins   = trades.filter(isWin).length;
  const losses = trades.filter(isLoss).length;

  if (loading) {
    return (
      <div className="dna-page">
        <div className="dna-loading"><div className="dna-spinner"/></div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="dna-page">
        <div className="dna-header">
          <Dna size={16} className="dna-icon-title"/>
          <span className="dna-title">PERFORMANCE DNA</span>
        </div>
        <div className="dna-empty">
          <BarChart3 size={32} className="dna-empty-icon"/>
          <p className="dna-empty-title">No trades to analyse</p>
          <p className="dna-empty-sub">Add at least 10 trades to unlock your statistical edge profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dna-page">
      {/* ── Page header ── */}
      <div className="dna-header">
        <div className="dna-header-left">
          <Dna size={16} className="dna-icon-title"/>
          <span className="dna-title">PERFORMANCE DNA</span>
          <span className="dna-badge">PRO</span>
        </div>
        <span className="dna-sub">Statistical pattern analysis · {total} trades</span>
      </div>

      {/* ── Row 1: Edge Score + Today Fitness ── */}
      <div className="dna-top-row">

        {/* Edge Score card */}
        <div className={`dna-edge-card dna-edge-${edge.color}`}>
          <div className="dna-edge-top">
            <span className="dna-section-label">EDGE SCORE</span>
            <span className={`dna-edge-badge dna-badge-${edge.color}`}>{edge.label}</span>
          </div>
          <div className="dna-gauge-wrap">
            <GaugeArc score={edge.score} color={edge.color}/>
          </div>
          <div className="dna-edge-metrics">
            <div className="dna-em-item">
              <span className="dna-em-label">Win Rate</span>
              <span className="dna-em-val">{edge.wr}%</span>
            </div>
            <div className="dna-em-div"/>
            <div className="dna-em-item">
              <span className="dna-em-label">Prof. Factor</span>
              <span className="dna-em-val">{edge.pf}×</span>
            </div>
            <div className="dna-em-div"/>
            <div className="dna-em-item">
              <span className="dna-em-label">Expectancy</span>
              <span className={`dna-em-val ${edge.exp >= 0 ? 'pos' : 'neg'}`}>
                {edge.exp >= 0 ? '+' : ''}{edge.exp}%
              </span>
            </div>
          </div>
          <div className="dna-edge-bar-row">
            <div className="dna-edge-bar-track">
              <div className={`dna-edge-bar-fill dna-fill-${edge.color}`} style={{ width: `${edge.score}%` }}/>
            </div>
          </div>
          <p className="dna-edge-hint">
            {total < 10 ? `Add ${10 - total} more trades for a reliable score.` :
             edge.score >= 72 ? 'Your statistical edge is confirmed. Keep executing your system.' :
             edge.score >= 50 ? 'Edge is developing. Focus on A+ setups only.' :
             'Review your risk management and avoid low-probability setups.'}
          </p>
        </div>

        {/* Right column: today fitness + summary */}
        <div className="dna-right-col">

          {/* Today Fitness */}
          <div className="dna-fitness-card">
            <div className="dna-fitness-header">
              <Calendar size={13} className="dna-icon-accent"/>
              <span className="dna-section-label">TODAY'S TRADING FITNESS</span>
            </div>
            {fitness ? (
              <>
                <div className="dna-fitness-day">{fitness.day}</div>
                <div className="dna-fitness-metrics">
                  <div className="dna-fit-metric">
                    <span className="dna-fit-val">{fitness.wr}%</span>
                    <span className="dna-fit-lbl">Historical WR</span>
                  </div>
                  <div className="dna-fit-metric">
                    <span className="dna-fit-val">{fitness.total}</span>
                    <span className="dna-fit-lbl">Trades logged</span>
                  </div>
                  <div className="dna-fit-metric">
                    <span className={`dna-fit-val ${fitness.pnl >= 0 ? 'pos' : 'neg'}`}>
                      {fitness.pnl >= 0 ? '+' : ''}{fitness.pnl}%
                    </span>
                    <span className="dna-fit-lbl">Avg PnL</span>
                  </div>
                </div>
                <div className="dna-fitness-bar-track">
                  <div
                    className={`dna-fitness-bar-fill ${fitness.wr >= 60 ? 'fit-green' : fitness.wr >= 45 ? 'fit-amber' : 'fit-red'}`}
                    style={{ width: `${fitness.wr}%` }}
                  />
                </div>
                <p className="dna-fitness-verdict">
                  {fitness.wr >= 60 ? <><Zap size={11}/> Historically your best day — trade your system.</>
                  : fitness.wr >= 45 ? <><Target size={11}/> Average day — A+ setups only.</>
                  : <><AlertOctagon size={11}/> Historically tough day — reduce size or sit out.</>}
                </p>
              </>
            ) : (
              <p className="dna-fitness-nodata">
                Log at least 3 trades on today's weekday to unlock fitness scoring.
              </p>
            )}
          </div>

          {/* Quick summary strip */}
          <div className="dna-summary-strip">
            <div className="dna-sum-item">
              <span className="dna-sum-val">{total}</span>
              <span className="dna-sum-lbl">Total</span>
            </div>
            <div className="dna-sum-item">
              <span className="dna-sum-val pos">{wins}</span>
              <span className="dna-sum-lbl">Wins</span>
            </div>
            <div className="dna-sum-item">
              <span className="dna-sum-val neg">{losses}</span>
              <span className="dna-sum-lbl">Losses</span>
            </div>
            <div className="dna-sum-item">
              <span className="dna-sum-val">{total - wins - losses}</span>
              <span className="dna-sum-lbl">BE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Golden + Trap Patterns ── */}
      {patterns.length >= 2 && (
        <div className="dna-pattern-row">
          {/* Golden patterns */}
          <div className="dna-pattern-card">
            <div className="dna-pc-header">
              <Trophy size={13} className="dna-icon-green"/>
              <span className="dna-section-label">GOLDEN PATTERNS</span>
              <span className="dna-pc-hint">Highest win-rate combos (min. 4 trades)</span>
            </div>
            <div className="dna-pattern-list">
              {golden.filter(p => p.wr >= 50).slice(0, 5).map((p, i) => (
                <div key={p.key} className="dna-pattern-item">
                  <span className="dna-pattern-rank">#{i + 1}</span>
                  <div className="dna-pattern-info">
                    <span className="dna-pattern-name">{p.key}</span>
                    <span className="dna-pattern-meta">{p.total} trades</span>
                  </div>
                  <div className="dna-pattern-bar-wrap">
                    <div className="dna-pattern-bar-track">
                      <div className="dna-pattern-bar-fill golden" style={{ width: `${p.wr}%` }}/>
                    </div>
                    <span className="dna-pattern-wr golden-text">{p.wr}%</span>
                  </div>
                  <span className={`dna-pattern-pnl ${p.pnl >= 0 ? 'pos' : 'neg'}`}>
                    {p.pnl >= 0 ? '+' : ''}{p.pnl}%
                  </span>
                </div>
              ))}
              {golden.filter(p => p.wr >= 50).length === 0 && (
                <p className="dna-pattern-empty">Need more trades per session/pair combo.</p>
              )}
            </div>
          </div>

          {/* Trap patterns */}
          <div className="dna-pattern-card">
            <div className="dna-pc-header">
              <AlertOctagon size={13} className="dna-icon-red"/>
              <span className="dna-section-label">TRAP PATTERNS</span>
              <span className="dna-pc-hint">Combos dragging your edge down</span>
            </div>
            <div className="dna-pattern-list">
              {traps.filter(p => p.wr < 50).slice(0, 5).map((p, i) => (
                <div key={p.key} className="dna-pattern-item">
                  <span className="dna-pattern-rank red-text">#{i + 1}</span>
                  <div className="dna-pattern-info">
                    <span className="dna-pattern-name">{p.key}</span>
                    <span className="dna-pattern-meta">{p.total} trades</span>
                  </div>
                  <div className="dna-pattern-bar-wrap">
                    <div className="dna-pattern-bar-track">
                      <div className="dna-pattern-bar-fill trap" style={{ width: `${p.wr}%` }}/>
                    </div>
                    <span className="dna-pattern-wr trap-text">{p.wr}%</span>
                  </div>
                  <span className={`dna-pattern-pnl ${p.pnl >= 0 ? 'pos' : 'neg'}`}>
                    {p.pnl >= 0 ? '+' : ''}{p.pnl}%
                  </span>
                </div>
              ))}
              {traps.filter(p => p.wr < 50).length === 0 && (
                <p className="dna-pattern-empty">No underperforming combos found — great consistency.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Row 3: Session × Weekday Heatmap ── */}
      {heatSessions.length > 0 && (
        <div className="dna-card">
          <div className="dna-card-header">
            <BarChart3 size={13} className="dna-icon-accent"/>
            <span className="dna-section-label">SESSION × WEEKDAY HEATMAP</span>
            <span className="dna-pc-hint">Win rate by time slot — darker = better</span>
          </div>
          <div className="dna-heatmap-wrap">
            <table className="dna-heatmap">
              <thead>
                <tr>
                  <th className="dna-heat-th dna-heat-label"/>
                  {WEEKDAYS.map(d => (
                    <th key={d} className="dna-heat-th">{d.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatSessions.map(sess => (
                  <tr key={sess}>
                    <td className="dna-heat-session">{sess}</td>
                    {WEEKDAYS.map(d => {
                      const cell = heatmap[sess]?.[d];
                      if (!cell || cell.total === 0) {
                        return <td key={d} className="dna-heat-cell dna-heat-empty">—</td>;
                      }
                      const wr = cell.wr;
                      const intensity = wr >= 70 ? 'h4' : wr >= 55 ? 'h3' : wr >= 40 ? 'h2' : 'h1';
                      return (
                        <td key={d} className={`dna-heat-cell dna-heat-${intensity}`}>
                          <span className="dna-heat-wr">{wr}%</span>
                          <span className="dna-heat-n">{cell.total}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="dna-heat-legend">
              <span>Low WR</span>
              <div className="dna-heat-leg-bar">
                <div className="dna-heat-h1"/>
                <div className="dna-heat-h2"/>
                <div className="dna-heat-h3"/>
                <div className="dna-heat-h4"/>
              </div>
              <span>High WR</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 4: Pair + Session + Grade breakdown ── */}
      <div className="dna-breakdown-row">
        <BreakdownTable label="BY PAIR" icon={TrendingUp} data={byPair}/>
        <BreakdownTable label="BY SESSION" icon={Clock} data={bySess}/>
        <BreakdownTable label="BY GRADE" icon={Target} data={byGrade}/>
      </div>
    </div>
  );
}

// ── Reusable breakdown table ──────────────────────────────────────────────────
function BreakdownTable({ label, icon: Icon, data }) {
  return (
    <div className="dna-bt-card">
      <div className="dna-bt-header">
        <Icon size={12} className="dna-icon-accent"/>
        <span className="dna-section-label">{label}</span>
      </div>
      <div className="dna-bt-rows">
        {data.slice(0, 8).map(row => (
          <div key={row.key} className="dna-bt-row">
            <span className="dna-bt-key">{row.key}</span>
            <div className="dna-bt-bar-wrap">
              <div className="dna-bt-bar-track">
                <div
                  className={`dna-bt-bar-fill ${row.wr >= 60 ? 'bt-green' : row.wr >= 45 ? 'bt-amber' : 'bt-red'}`}
                  style={{ width: `${row.wr}%` }}
                />
              </div>
              <span className="dna-bt-wr">{row.wr}%</span>
            </div>
            <span className="dna-bt-total">{row.total}t</span>
            <span className={`dna-bt-pnl ${row.pnl >= 0 ? 'pos' : 'neg'}`}>
              {row.pnl >= 0 ? '+' : ''}{row.pnl}%
            </span>
          </div>
        ))}
        {data.length === 0 && <p className="dna-bt-empty">No data yet.</p>}
      </div>
    </div>
  );
}
