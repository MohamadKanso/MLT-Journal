import { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, Play, RotateCw, TrendingUp, AlertTriangle, Zap, Target } from 'lucide-react';
import './EdgeLabPage.css';

/* ─── Monte Carlo engine ─────────────────────────────────────────────────── */
function runMonteCarlo({ winRate, beRate, avgWin, avgLoss, numTrades, numSims, riskPct }) {
  const wr      = winRate / 100;
  const br      = beRate  / 100;
  // outcome thresholds: [0, wr) = Win, [wr, wr+br) = Breakeven, [wr+br, 1) = Loss
  const allFinal = [];
  const allMaxDD = [];
  let rorCount   = { 10: 0, 20: 0, 30: 0 };

  // Compute percentile band arrays
  const snapshots = Array.from({ length: numTrades + 1 }, () => []);

  for (let s = 0; s < numSims; s++) {
    let balance = 0;   // track as % change from start (0 = 100% of account)
    let peak    = 0;
    let maxDD   = 0;
    let ruined  = { 10: false, 20: false, 30: false };
    snapshots[0].push(0);

    for (let t = 0; t < numTrades; t++) {
      const roll = Math.random();
      if (roll < wr) {
        // Win: balance * (1 + risk% * avgRR) — represented as additive % change
        balance += riskPct * avgWin;
      } else if (roll < wr + br) {
        // Breakeven: no change
      } else {
        // Loss: balance * (1 - risk%)
        balance -= riskPct * Math.abs(avgLoss);
      }
      if (balance > peak) peak = balance;
      const dd = peak - balance;
      if (dd > maxDD) maxDD = dd;
      if (!ruined[10] && balance <= -10) { rorCount[10]++; ruined[10] = true; }
      if (!ruined[20] && balance <= -20) { rorCount[20]++; ruined[20] = true; }
      if (!ruined[30] && balance <= -30) { rorCount[30]++; ruined[30] = true; }
      snapshots[t + 1].push(balance);
    }
    allFinal.push(balance);
    allMaxDD.push(maxDD);
  }

  // Sort snapshots for percentiles
  const p10 = snapshots.map(arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(numSims * 0.10)]; });
  const p25 = snapshots.map(arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(numSims * 0.25)]; });
  const p50 = snapshots.map(arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(numSims * 0.50)]; });
  const p75 = snapshots.map(arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(numSims * 0.75)]; });
  const p90 = snapshots.map(arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(numSims * 0.90)]; });

  // Sample 80 ghost curves evenly from simulations
  const ghosts = [];
  const step   = Math.max(1, Math.floor(numSims / 80));
  for (let s = 0; s < numSims; s += step) {
    const curve = snapshots.map(arr => arr[s]);
    ghosts.push(curve);
  }

  const sortedFinal = [...allFinal].sort((a, b) => a - b);
  const sortedDD    = [...allMaxDD].sort((a, b) => a - b);
  const medianDD    = sortedDD[Math.floor(numSims / 2)];
  const pProfitable = Math.round(allFinal.filter(v => v > 0).length / numSims * 100);

  return {
    p10, p25, p50, p75, p90, ghosts,
    ror: {
      r10: Math.round(rorCount[10] / numSims * 100),
      r20: Math.round(rorCount[20] / numSims * 100),
      r30: Math.round(rorCount[30] / numSims * 100),
    },
    best:      sortedFinal[Math.floor(numSims * 0.95)],
    worst:     sortedFinal[Math.floor(numSims * 0.05)],
    median:    p50[numTrades],
    medianDD,
    pProfitable,
    numSims,
    numTrades,
  };
}

/* ─── SVG chart ─────────────────────────────────────────────────────────── */
function SimChart({ result, numTrades }) {
  if (!result) return null;
  const W = 1000, H = 280, PX = 12, PY = 20;

  const allVals = [...result.p10, ...result.p90];
  const mn = Math.min(...allVals, 0) * 1.15;
  const mx = Math.max(...allVals, 0) * 1.15 || 1;
  const rng = mx - mn || 1;
  const xS  = i  => PX + (i / numTrades) * (W - PX * 2);
  const yS  = v  => PY + (1 - (v - mn) / rng) * (H - PY * 2);
  const y0  = yS(0);

  const pathD = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)} ${yS(v).toFixed(1)}`).join(' ');
  const areaD = (top, bot) => {
    const t = top.map((v, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)} ${yS(v).toFixed(1)}`).join(' ');
    const b = [...bot].reverse().map((v, i) => `L${xS(bot.length - 1 - i).toFixed(1)} ${yS(v).toFixed(1)}`).join(' ');
    return t + ' ' + b + ' Z';
  };

  const isPos = result.median >= 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sim-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sim-band-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPos ? '#4E9168' : '#C96B57'} stopOpacity="0.12"/>
          <stop offset="100%" stopColor={isPos ? '#4E9168' : '#C96B57'} stopOpacity="0.02"/>
        </linearGradient>
      </defs>

      {/* Zero line */}
      <line x1={PX} y1={y0.toFixed(1)} x2={W - PX} y2={y0.toFixed(1)}
        stroke="rgba(120,110,100,0.2)" strokeWidth="1" strokeDasharray="5 5"/>

      {/* Ghost curves */}
      {result.ghosts.map((g, i) => (
        <path key={i} d={pathD(g)} fill="none"
          stroke={g[numTrades] >= 0 ? '#4E9168' : '#C96B57'}
          strokeWidth="0.5" strokeOpacity="0.07"/>
      ))}

      {/* Percentile band p25-p75 */}
      <path d={areaD(result.p75, result.p25)} fill="url(#sim-band-g)"/>

      {/* p10 / p90 dashed bounds */}
      <path d={pathD(result.p90)} fill="none" stroke={isPos ? '#4E9168' : '#C96B57'} strokeWidth="1.2" strokeDasharray="4 4" strokeOpacity="0.5"/>
      <path d={pathD(result.p10)} fill="none" stroke="#C96B57" strokeWidth="1.2" strokeDasharray="4 4" strokeOpacity="0.5"/>

      {/* Median */}
      <path d={pathD(result.p50)} fill="none" stroke={isPos ? '#4E9168' : '#C96B57'} strokeWidth="2.5" strokeLinecap="round"/>

      {/* End dot */}
      <circle cx={xS(numTrades).toFixed(1)} cy={yS(result.p50[numTrades]).toFixed(1)} r="5"
        fill={isPos ? '#4E9168' : '#C96B57'}/>
    </svg>
  );
}

/* ─── Kelly Criterion ────────────────────────────────────────────────────── */
function kellyPct(winRate, avgWinR, avgLossR) {
  const wr   = winRate / 100;
  const lr   = 1 - wr;
  const b    = Math.abs(avgWinR / avgLossR);
  const k    = (wr - lr / b) * 100;
  return Math.max(0, k);
}

/* ─── Streak probability ─────────────────────────────────────────────────── */
function pStreak(n, winRate, numTrades) {
  const lr  = 1 - winRate / 100;
  const pN  = Math.pow(lr, n);
  const exp = (numTrades - n + 1) * pN;
  return Math.min(100, Math.round(exp * 100));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function EdgeLabPage() {
  const [stats,   setStats]   = useState(null);
  const [result,  setResult]  = useState(null);
  const [running, setRunning] = useState(false);
  const [beError, setBeError] = useState('');
  const [params,  setParams]  = useState({
    winRate:   55,
    beRate:    10,
    avgWin:    2.0,
    avgLoss:  -1.0,
    numTrades: 100,
    numSims:   500,
    riskPct:   1.0,
  });

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(s => {
      setStats(s);
      if (s.total > 4) {
        setParams(p => ({
          ...p,
          winRate:   Math.round(s.win_rate),
          avgWin:    Math.abs(s.avg_win  || 2.0),
          avgLoss:  -Math.abs(s.avg_loss || 1.0),
        }));
      }
    }).catch(() => {});
  }, []);

  const lossRate = Math.max(0, 100 - params.winRate - params.beRate);

  const run = () => {
    const total = params.winRate + params.beRate;
    if (total > 100) {
      setBeError(`Win% + BE% = ${total}% — must not exceed 100%`);
      return;
    }
    setBeError('');
    setRunning(true);
    setTimeout(() => {
      const r = runMonteCarlo({ ...params });
      setResult(r);
      setRunning(false);
    }, 20);
  };

  const setP = (k, v) => {
    setBeError('');
    setParams(p => ({ ...p, [k]: v }));
  };

  const kelly    = kellyPct(params.winRate, params.avgWin, Math.abs(params.avgLoss));
  const halfK    = kelly / 2;
  // EV accounts for BE (no change) trades
  const wr = params.winRate / 100;
  const lr = lossRate / 100;
  const ev = (wr * params.avgWin + lr * params.avgLoss).toFixed(3);
  const isEdge   = Number(ev) > 0;

  return (
    <div className="edge-lab animate-fade-up">

      <div className="el-header">
        <div>
          <span className="page-label">// probability engine</span>
          <h2>Edge Lab</h2>
          <p className="el-subtitle">Monte Carlo simulation of your statistical edge across future trades.</p>
        </div>
        {stats && stats.total > 0 && (
          <div className="el-auto-tag">
            <Activity size={12}/> Auto-populated from {stats.total} journal trades
          </div>
        )}
      </div>

      {/* ── Parameter panel + Chart ── */}
      <div className="el-main-row">

        {/* Parameters */}
        <div className="el-params-panel">
          <div className="el-panel-title">// simulation parameters</div>

          <div className="el-param">
            <label>Win Rate <span className="el-val">{params.winRate}%</span></label>
            <input type="range" min="10" max="85" step="1" value={params.winRate} onChange={e => setP('winRate', +e.target.value)}/>
            <div className="el-range-hints"><span>10%</span><span>85%</span></div>
          </div>

          <div className="el-param">
            <label>Breakeven Rate <span className="el-val">{params.beRate}%</span></label>
            <input type="range" min="0" max="40" step="1" value={params.beRate} onChange={e => setP('beRate', +e.target.value)}/>
            <div className="el-range-hints"><span>0%</span><span>40%</span></div>
          </div>

          <div className="el-param">
            <label style={{display:'flex',justifyContent:'space-between'}}>
              <span>Loss Rate <span style={{color:'var(--nt-text-muted)',fontSize:'0.6rem'}}>(auto)</span></span>
              <span className={`el-val ${lossRate > params.winRate ? 'el-val-red' : ''}`}>{lossRate}%</span>
            </label>
            <div className="el-rate-bar">
              <div className="el-rate-seg green" style={{width:`${params.winRate}%`}} title={`Win ${params.winRate}%`}/>
              <div className="el-rate-seg amber" style={{width:`${params.beRate}%`}} title={`BE ${params.beRate}%`}/>
              <div className="el-rate-seg red" style={{width:`${lossRate}%`}} title={`Loss ${lossRate}%`}/>
            </div>
            <div className="el-rate-legend">
              <span className="green">W {params.winRate}%</span>
              <span className="amber">BE {params.beRate}%</span>
              <span className="red">L {lossRate}%</span>
            </div>
          </div>

          {beError && <div className="el-be-error">{beError}</div>}

          <div className="el-param">
            <label>Avg Win (R) <span className="el-val">+{params.avgWin.toFixed(1)}R</span></label>
            <input type="range" min="0.5" max="5" step="0.1" value={params.avgWin} onChange={e => setP('avgWin', +e.target.value)}/>
            <div className="el-range-hints"><span>0.5R</span><span>5R</span></div>
          </div>

          <div className="el-param">
            <label>Avg Loss (R) <span className="el-val">{params.avgLoss.toFixed(1)}R</span></label>
            <input type="range" min="-3" max="-0.5" step="0.1" value={params.avgLoss} onChange={e => setP('avgLoss', +e.target.value)}/>
            <div className="el-range-hints"><span>-3R</span><span>-0.5R</span></div>
          </div>

          <div className="el-param">
            <label>Risk per Trade <span className="el-val">{params.riskPct}%</span></label>
            <input type="range" min="0.25" max="2" step="0.25" value={params.riskPct} onChange={e => setP('riskPct', +e.target.value)}/>
            <div className="el-range-hints"><span>0.25%</span><span>2%</span></div>
          </div>

          <div className="el-param-row">
            <div className="el-param el-param-sm">
              <label>Trades <span className="el-val">{params.numTrades}</span></label>
              <select value={params.numTrades} onChange={e => setP('numTrades', +e.target.value)}>
                {[50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="el-param el-param-sm">
              <label>Simulations <span className="el-val">{params.numSims}</span></label>
              <select value={params.numSims} onChange={e => setP('numSims', +e.target.value)}>
                {[200, 500, 1000].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* EV chip */}
          <div className={`el-ev-chip ${isEdge ? 'positive' : 'negative'}`}>
            <span className="el-ev-label">Expected Value per trade</span>
            <span className="el-ev-val">{ev > 0 ? '+' : ''}{ev}%</span>
            <span className="el-ev-tag">{isEdge ? 'Positive Edge ✓' : 'No Edge — Review'}</span>
          </div>

          <button className={`el-run-btn ${running ? 'running' : ''}`} onClick={run} disabled={running}>
            {running ? <><RotateCw size={14} className="spinning"/> Simulating...</> : <><Play size={14}/> Run Simulation</>}
          </button>
        </div>

        {/* Chart */}
        <div className="el-chart-panel">
          <div className="el-chart-header">
            <span className="el-panel-title">// {params.numSims.toLocaleString()} simulations · {params.numTrades} trades</span>
            {result && (
              <div className="el-chart-legend">
                <span className="el-legend-item"><span className="el-legend-line solid green"/>Median</span>
                <span className="el-legend-item"><span className="el-legend-line dashed green"/>90th pct</span>
                <span className="el-legend-item"><span className="el-legend-line dashed red"/>10th pct</span>
              </div>
            )}
          </div>
          {!result ? (
            <div className="el-chart-empty">
              <Activity size={32} strokeWidth={1} className="el-empty-icon"/>
              <p>Configure parameters and run the simulation</p>
              <p className="el-empty-sub">Each line is one possible future for your edge</p>
            </div>
          ) : (
            <>
              <SimChart result={result} numTrades={params.numTrades}/>
              <div className="el-chart-labels">
                <span>Trade 1</span>
                <span>Trade {params.numTrades}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Projection stats ── */}
      {result && (
        <div className="el-projections animate-fade-up">
          <div className="el-proj-title">// projections over {params.numTrades} trades · at {params.riskPct}% risk per trade</div>
          <div className="el-proj-row">
            <div className="el-proj-stat">
              <span className="el-ps-label">Median Outcome</span>
              <span className={`el-ps-val ${result.median >= 0 ? 'green' : 'red'}`}>
                {result.median >= 0 ? '+' : ''}{result.median.toFixed(2)}%
              </span>
            </div>
            <div className="el-proj-stat">
              <span className="el-ps-label">Best Case (95th)</span>
              <span className="el-ps-val green">+{result.best.toFixed(2)}%</span>
            </div>
            <div className="el-proj-stat">
              <span className="el-ps-label">Worst Case (5th)</span>
              <span className={`el-ps-val ${result.worst >= 0 ? 'green' : 'red'}`}>{result.worst.toFixed(2)}%</span>
            </div>
            <div className="el-proj-stat">
              <span className="el-ps-label">Profitable Runs</span>
              <span className={`el-ps-val ${result.pProfitable >= 60 ? 'green' : result.pProfitable >= 40 ? 'amber' : 'red'}`}>
                {result.pProfitable}%
              </span>
            </div>
            <div className="el-proj-stat">
              <span className="el-ps-label">Median Max DD</span>
              <span className="el-ps-val red">-{result.medianDD.toFixed(2)}%</span>
            </div>
          </div>

          {/* Risk of ruin */}
          <div className="el-ror-section">
            <div className="el-proj-title" style={{marginTop: 0}}>// risk of ruin — probability of hitting drawdown level</div>
            <div className="el-ror-row">
              {[
                { label: '10% Drawdown', pct: result.ror.r10, color: 'amber' },
                { label: '20% Drawdown', pct: result.ror.r20, color: 'red' },
                { label: '30% Drawdown', pct: result.ror.r30, color: 'red' },
              ].map(r => (
                <div key={r.label} className="el-ror-item">
                  <div className="el-ror-gauge">
                    <div className={`el-ror-fill el-ror-${r.color}`} style={{ width: `${Math.min(100, r.pct * 3)}%` }}/>
                  </div>
                  <div className="el-ror-info">
                    <span className="el-ror-label">{r.label}</span>
                    <span className={`el-ror-pct ${r.color}`}>{r.pct}% of runs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Kelly + Streak grid ── */}
      <div className="el-bottom-row">

        {/* Kelly Criterion */}
        <div className="el-kelly-card">
          <div className="el-card-title"><Target size={13}/> Kelly Criterion</div>
          <p className="el-card-sub">Mathematically optimal position sizing for your edge</p>

          <div className="el-kelly-display">
            <div className="el-kelly-gauge">
              <div className="el-kelly-fill" style={{ width: `${Math.min(100, kelly * 2)}%` }}/>
            </div>
            <div className="el-kelly-vals">
              <div className="el-kelly-val">
                <span className="el-kv-num">{kelly.toFixed(1)}%</span>
                <span className="el-kv-label">Full Kelly</span>
                <span className="el-kv-note">Maximises growth · high variance</span>
              </div>
              <div className="el-kelly-val recommended">
                <span className="el-kv-num">{halfK.toFixed(1)}%</span>
                <span className="el-kv-label">Half Kelly ✓</span>
                <span className="el-kv-note">Recommended — lower drawdown risk</span>
              </div>
            </div>
          </div>

          <div className={`el-kelly-note ${params.riskPct <= halfK ? 'green' : params.riskPct <= kelly ? 'amber' : 'red'}`}>
            {params.riskPct <= halfK
              ? `Your ${params.riskPct}% risk is at or below Half Kelly. Optimal.`
              : params.riskPct <= kelly
              ? `Your ${params.riskPct}% risk is between Half Kelly and Full Kelly. Acceptable.`
              : `Your ${params.riskPct}% risk exceeds Full Kelly. Consider reducing.`
            }
          </div>
        </div>

        {/* Streak Probability */}
        <div className="el-streak-card">
          <div className="el-card-title"><Zap size={13}/> Losing Streak Probability</div>
          <p className="el-card-sub">Over {params.numTrades} trades at {params.winRate}% win rate</p>

          <div className="el-streak-table">
            {[3, 4, 5, 6, 7].map(n => {
              const p = pStreak(n, params.winRate, params.numTrades);
              return (
                <div key={n} className="el-streak-row">
                  <span className="el-str-n">{n} losses</span>
                  <div className="el-str-bar-track">
                    <div className={`el-str-bar ${p > 50 ? 'red' : p > 20 ? 'amber' : 'green'}`} style={{ width: `${Math.min(100, p)}%` }}/>
                  </div>
                  <span className={`el-str-pct ${p > 50 ? 'red' : p > 20 ? 'amber' : 'green'}`}>{p}% likely</span>
                </div>
              );
            })}
          </div>

          <div className="el-streak-note">
            <AlertTriangle size={11}/> A {Math.ceil(Math.log(0.01) / Math.log(1 - params.winRate / 100))}-loss streak is statistically possible even with your win rate. Sizing matters.
          </div>
        </div>

        {/* Edge Summary */}
        <div className="el-edge-card">
          <div className="el-card-title"><TrendingUp size={13}/> Edge Metrics</div>
          <p className="el-card-sub">Key numbers behind your system</p>

          <div className="el-edge-metrics">
            {[
              { label: 'Profit Factor',  val: params.avgLoss !== 0 ? ((params.winRate / 100 * params.avgWin) / Math.abs(1 - params.winRate / 100) / Math.abs(params.avgLoss)).toFixed(2) : '∞',  good: v => parseFloat(v) >= 1.5 },
              { label: 'Expectancy/R',   val: ev, good: v => parseFloat(v) > 0 },
              { label: 'Win Rate',       val: `${params.winRate}%`, good: v => parseInt(v) >= 50 },
              { label: 'Avg Win',        val: `+${params.avgWin.toFixed(1)}R`, good: () => true },
              { label: 'Avg Loss',       val: `${params.avgLoss.toFixed(1)}R`, good: () => true },
              { label: 'RR Ratio',       val: `${(params.avgWin / Math.abs(params.avgLoss)).toFixed(2)}:1`, good: v => parseFloat(v) >= 1.5 },
            ].map(m => (
              <div key={m.label} className="el-edge-row">
                <span className="el-er-label">{m.label}</span>
                <span className={`el-er-val ${m.good(m.val) ? 'green' : 'red'}`}>{m.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
