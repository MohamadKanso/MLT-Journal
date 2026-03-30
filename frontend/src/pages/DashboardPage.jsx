import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, Pencil, Trash2, Eye, X, ChevronDown,
  ChevronLeft, ChevronRight, Activity, TrendingUp, Filter,
  CheckSquare, Square, Maximize2, Calendar, LayoutList,
  Target, Flame, Zap, Award
} from 'lucide-react';
import './DashboardPage.css';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (n, d = 2) => n == null ? '—' : Number(n).toFixed(d);
const pct = (n) => n == null ? '—' : `${n >= 0 ? '+' : ''}${fmt(n)}%`;

// Strip URLs, Notion links and markdown from text fields before display
const sanitize = (s) => {
  if (!s) return s;
  return String(s)
    .replace(/https?:\/\/[^\s)>\]"]+/g, '')   // bare URLs
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [text](url) markdown
    .replace(/notion\.so\/[^\s]*/g, '')        // any leftover notion paths
    .trim();
};

function resultClass(r) {
  if (!r) return 'be';
  const l = r.toLowerCase();
  if (l.includes('profit') || l.includes('win') || l === 'take-profit') return 'win';
  if (l.includes('loss') || l === 'stop-loss') return 'loss';
  return 'be';
}
function gradeClass(g) {
  if (!g) return '';
  const u = g.trim().toUpperCase();
  if (u === 'A+') return 'a-plus';
  if (u === 'A')  return 'a';
  if (u === 'B')  return 'b';
  return 'c';
}

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/* ─── insight engine ───────────────────────────────────────────────────────── */
function computeInsights(trades) {
  const insights = [];
  if (trades.length < 5) return insights;
  const wins  = trades.filter(t => resultClass(t.result) === 'win');
  const total = trades.length;
  const wr    = Math.round(wins.length / total * 100);

  // Best pair (min 3 trades)
  const byPair = {};
  trades.forEach(t => {
    if (!t.pairs) return;
    if (!byPair[t.pairs]) byPair[t.pairs] = { w: 0, n: 0 };
    byPair[t.pairs].n++;
    if (resultClass(t.result) === 'win') byPair[t.pairs].w++;
  });
  const pairArr = Object.entries(byPair).filter(([, v]) => v.n >= 3)
    .sort((a, b) => (b[1].w / b[1].n) - (a[1].w / a[1].n));
  if (pairArr.length) {
    const [pair, { w, n }] = pairArr[0];
    const pwr = Math.round(w / n * 100);
    if (pwr > wr + 5) insights.push({
      icon: Target, tone: 'green',
      text: `${pair} is your sharpest pair — ${pwr}% WR`,
      sub: `${n} trades · ${pwr - wr}pts above average`,
    });
  }

  // A+ vs B
  const ap = trades.filter(t => (t.grade || '').trim().toUpperCase() === 'A+');
  const b  = trades.filter(t => (t.grade || '').trim().toUpperCase() === 'B');
  if (ap.length >= 3 && b.length >= 3) {
    const apwr = Math.round(ap.filter(t => resultClass(t.result) === 'win').length / ap.length * 100);
    const bwr  = Math.round(b.filter(t => resultClass(t.result) === 'win').length / b.length * 100);
    if (apwr - bwr >= 10) insights.push({
      icon: Award, tone: 'green',
      text: `A+ setups win ${apwr}% vs B-grade at ${bwr}%`,
      sub: `${apwr - bwr}pt edge — grade harder, wait for A+`,
    });
  }

  // Best session
  const bySess = {};
  trades.forEach(t => {
    if (!t.session) return;
    if (!bySess[t.session]) bySess[t.session] = { w: 0, n: 0 };
    bySess[t.session].n++;
    if (resultClass(t.result) === 'win') bySess[t.session].w++;
  });
  const sessArr = Object.entries(bySess).filter(([, v]) => v.n >= 3)
    .sort((a, b) => (b[1].w / b[1].n) - (a[1].w / a[1].n));
  if (sessArr.length >= 2) {
    const [best, bv] = sessArr[0];
    const [worst, wv] = sessArr[sessArr.length - 1];
    const bswr = Math.round(bv.w / bv.n * 100);
    const wswr = Math.round(wv.w / wv.n * 100);
    if (bswr - wswr >= 10) insights.push({
      icon: TrendingUp, tone: 'blue',
      text: `${best} is your best session — ${bswr}%`,
      sub: `${bswr - wswr}pts ahead of ${worst}`,
    });
  }

  // Post-loss WR
  const sortedD = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let plw = 0, pln = 0;
  for (let i = 1; i < sortedD.length; i++) {
    if (resultClass(sortedD[i - 1].result) === 'loss') {
      pln++;
      if (resultClass(sortedD[i].result) === 'win') plw++;
    }
  }
  if (pln >= 3) {
    const plwr = Math.round(plw / pln * 100);
    const diff = plwr - wr;
    insights.push({
      icon: Zap, tone: diff >= 0 ? 'green' : 'red',
      text: `After a loss, your WR is ${plwr}%`,
      sub: diff >= 0
        ? `${diff}pts above average — trust the process`
        : `${Math.abs(diff)}pts below average — pause before next trade`,
    });
  }

  // Best weekday
  const byDay = {};
  trades.forEach(t => {
    if (!t.weekday) return;
    if (!byDay[t.weekday]) byDay[t.weekday] = { w: 0, n: 0 };
    byDay[t.weekday].n++;
    if (resultClass(t.result) === 'win') byDay[t.weekday].w++;
  });
  const dayArr = Object.entries(byDay).filter(([, v]) => v.n >= 3)
    .sort((a, b) => (b[1].w / b[1].n) - (a[1].w / a[1].n));
  if (dayArr.length >= 2) {
    const [bd, dv] = dayArr[0];
    const [wd, wdv] = dayArr[dayArr.length - 1];
    const bdwr = Math.round(dv.w / dv.n * 100);
    const wdwr = Math.round(wdv.w / wdv.n * 100);
    if (bdwr - wdwr >= 15) insights.push({
      icon: Flame, tone: 'amber',
      text: `${bd} is your strongest day — ${bdwr}%`,
      sub: `${bdwr - wdwr}pts ahead of ${wd} (${wdwr}%)`,
    });
  }

  // Rules compliance
  const ruled = trades.filter(t => t.trading_rules);
  if (ruled.length >= 5) {
    const comp = Math.round(ruled.filter(t => t.trading_rules === 'Rules Followed').length / ruled.length * 100);
    insights.push({
      icon: Activity, tone: comp >= 85 ? 'green' : 'amber',
      text: `Rule compliance: ${comp}%`,
      sub: comp >= 85
        ? 'Discipline is solid — protect it'
        : 'Review which rule keeps breaking',
    });
  }

  return insights;
}

/* ─── streak ───────────────────────────────────────────────────────────────── */
function computeStreak(trades) {
  const sorted = [...trades].filter(t => t.result)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!sorted.length) return { count: 0, type: null };
  const first = resultClass(sorted[0].result);
  let count = 0;
  for (const t of sorted) {
    if (resultClass(t.result) === first) count++;
    else break;
  }
  return { count, type: first };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage({ title, filter: pageFilter }) {
  const navigate = useNavigate();

  const [trades,     setTrades]    = useState([]);
  const [stats,      setStats]     = useState({});
  const [loading,    setLoading]   = useState(true);
  const [spinning,   setSpinning]  = useState(false);
  const [search,     setSearch]    = useState('');
  const [activeView, setActiveView] = useState('table');
  const [viewTrade,  setViewTrade] = useState(null);
  const [lightboxImg,setLightboxImg] = useState(null);
  const [lightboxIdx,setLightboxIdx] = useState(0);
  const [deleteIds,  setDeleteIds] = useState(null);
  const [deleting,   setDeleting]  = useState(false);
  const [selected,   setSelected]  = useState(new Set());
  const [showFilters,setShowFilters] = useState(false);
  const [filters,    setFilters]   = useState({
    trade_type: '', account_type: '', session: '', pairs: '',
    result: '', grade: '', entry_model: '', position: '', weekday: '', trading_rules: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true); setSpinning(true);
    try {
      const params = new URLSearchParams();
      if (pageFilter) Object.entries(pageFilter).forEach(([k, v]) => params.append(k, v));
      const [tR, sR] = await Promise.all([
        fetch(`/api/trades?${params}`),
        fetch('/api/stats'),
      ]);
      if (tR.ok) setTrades(await tR.json());
      if (sR.ok) setStats(await sR.json());
    } catch (e) { console.error(e); }
    setLoading(false);
    setTimeout(() => setSpinning(false), 600);
  }, [pageFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ trade_type: '', account_type: '', session: '', pairs: '', result: '', grade: '', entry_model: '', position: '', weekday: '', trading_rules: '' });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const displayed = trades.filter(t => {
    if (search) {
      const q = search.toLowerCase();
      const match = [t.pairs, t.session, t.result, t.grade, t.entry_model, t.setup_quality, t.weekday, t.trade_name, t.why_grade, t.psycho]
        .some(v => v?.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filters.trade_type   && t.trade_type   !== filters.trade_type)   return false;
    if (filters.account_type && t.account_type !== filters.account_type) return false;
    if (filters.session      && t.session      !== filters.session)      return false;
    if (filters.pairs        && t.pairs        !== filters.pairs)        return false;
    if (filters.result       && t.result       !== filters.result)       return false;
    if (filters.grade        && t.grade        !== filters.grade)        return false;
    if (filters.entry_model  && t.entry_model  !== filters.entry_model)  return false;
    if (filters.position     && t.position     !== filters.position)     return false;
    if (filters.weekday      && t.weekday      !== filters.weekday)      return false;
    if (filters.trading_rules && t.trading_rules !== filters.trading_rules) return false;
    return true;
  });

  const uniq = (key) => [...new Set(trades.map(t => t[key]).filter(Boolean))].sort();

  const doDelete = async (ids) => {
    setDeleting(true);
    await fetch('/api/trades/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.isArray(ids) ? ids : [ids] }),
    });
    setDeleteIds(null); setDeleting(false);
    setSelected(new Set()); fetchData();
  };

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected  = displayed.length > 0 && displayed.every(t => selected.has(t.id));
  const toggleAll    = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(displayed.map(t => t.id)));
  };

  /* ── metrics ── */
  const wins      = displayed.filter(t => resultClass(t.result) === 'win');
  const losses    = displayed.filter(t => resultClass(t.result) === 'loss');
  const bes       = displayed.filter(t => resultClass(t.result) === 'be');
  const winRate   = displayed.length ? Math.round(wins.length / displayed.length * 100) : 0;
  const totalPnl  = displayed.reduce((a, t) => a + (t.profit_pct || 0), 0);
  const withRR    = displayed.filter(t => t.rr);
  const avgRR     = withRR.length ? (withRR.reduce((a, t) => a + (t.rr || 0), 0) / withRR.length).toFixed(2) : '—';
  const grossWin  = wins.reduce((a, t) => a + Math.abs(t.profit_pct || 0), 0);
  const grossLoss = losses.reduce((a, t) => a + Math.abs(t.profit_pct || 0), 0);
  const pf        = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : wins.length ? '∞' : '—';
  const expectancy = displayed.length ? ((grossWin - grossLoss) / displayed.length).toFixed(2) : '—';

  /* ── breakdowns ── */
  const sessionData = ['London', 'New York', 'Asia', 'Off-Session'].map(s => {
    const st = displayed.filter(t => t.session === s);
    const sw = st.filter(t => resultClass(t.result) === 'win');
    return { name: s, total: st.length, wr: st.length ? Math.round(sw.length / st.length * 100) : 0 };
  }).filter(s => s.total > 0);

  const gradeData = ['A+', 'A', 'B', 'Not Valid'].map(g => {
    const gt = displayed.filter(t => (t.grade || '').toUpperCase() === g.toUpperCase());
    const gw = gt.filter(t => resultClass(t.result) === 'win');
    return { name: g, total: gt.length, wr: gt.length ? Math.round(gw.length / gt.length * 100) : 0 };
  }).filter(g => g.total > 0);

  const pairBreak = stats.by_pair || {};
  const pairData  = Object.entries(pairBreak).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => b.total - a.total).slice(0, 6);

  const insights = computeInsights(displayed);
  const streak   = computeStreak(displayed);

  return (
    <div className="dashboard-page animate-fade-up">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <span className="page-label">// trading journal</span>
          <h2>{title}</h2>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button className={`view-btn${activeView === 'table' ? ' active' : ''}`} onClick={() => setActiveView('table')} title="Table view"><LayoutList size={14}/></button>
            <button className={`view-btn${activeView === 'calendar' ? ' active' : ''}`} onClick={() => setActiveView('calendar')} title="Calendar view"><Calendar size={14}/></button>
          </div>
          <button className={`btn-icon${spinning ? ' spinning' : ''}`} onClick={fetchData}><RefreshCw size={15}/></button>
          <button className={`btn-icon${showFilters ? ' active' : ''}`} onClick={() => setShowFilters(s => !s)}>
            <Filter size={15}/>
            {activeFilterCount > 0 && <span className="filter-dot">{activeFilterCount}</span>}
          </button>
          <div className="search-bar">
            <Search size={13} className="search-icon"/>
            <input type="text" placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      {showFilters && (
        <div className="filter-bar animate-fade-up">
          <div className="filter-bar-inner">
            <FilterSel label="Type"     val={filters.trade_type}    opts={uniq('trade_type')}    onChange={v => setFilter('trade_type', v)}/>
            <FilterSel label="Account"  val={filters.account_type}  opts={uniq('account_type')}  onChange={v => setFilter('account_type', v)}/>
            <FilterSel label="Session"  val={filters.session}       opts={uniq('session')}        onChange={v => setFilter('session', v)}/>
            <FilterSel label="Pair"     val={filters.pairs}         opts={uniq('pairs')}          onChange={v => setFilter('pairs', v)}/>
            <FilterSel label="Position" val={filters.position}      opts={uniq('position')}       onChange={v => setFilter('position', v)}/>
            <FilterSel label="Model"    val={filters.entry_model}   opts={uniq('entry_model')}    onChange={v => setFilter('entry_model', v)}/>
            <FilterSel label="Result"   val={filters.result}        opts={uniq('result')}         onChange={v => setFilter('result', v)}/>
            <FilterSel label="Grade"    val={filters.grade}         opts={uniq('grade')}          onChange={v => setFilter('grade', v)}/>
            <FilterSel label="Day"      val={filters.weekday}       opts={uniq('weekday')}        onChange={v => setFilter('weekday', v)}/>
            <FilterSel label="Rules"    val={filters.trading_rules} opts={uniq('trading_rules')}  onChange={v => setFilter('trading_rules', v)}/>
          </div>
          {activeFilterCount > 0 && (
            <button className="btn-clear-filters" onClick={clearFilters}><X size={12}/> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</button>
          )}
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <StatCard label="Win Rate"     value={`${winRate}%`}         tone={winRate >= 50 ? 'positive' : 'negative'} sub={`${wins.length}W · ${losses.length}L · ${bes.length}BE`}/>
        <StatCard label="Total PnL"    value={pct(totalPnl)}         tone={totalPnl > 0 ? 'positive' : totalPnl < 0 ? 'negative' : 'neutral'} sub={`${displayed.length} trades`}/>
        <StatCard label="Avg R:R"      value={avgRR}                 tone="neutral" sub={`Profit factor ${pf}`}/>
        <StatCard label="Expectancy"   value={expectancy !== '—' ? pct(Number(expectancy)) : '—'} tone={Number(expectancy) > 0 ? 'positive' : 'neutral'} sub={streak.count > 1 ? `${streak.count} ${streak.type} streak` : ''}/>
      </div>

      {/* ── Equity curve + Insights ── */}
      {displayed.filter(t => t.profit_pct != null).length >= 2 && (
        <div className="equity-insights-row">
          <EquityCurve trades={displayed}/>
          {insights.length > 0 && (
            <div className="insights-col">
              {insights.map((ins, i) => <InsightCard key={i} ins={ins}/>)}
            </div>
          )}
        </div>
      )}

      {/* ── Breakdowns: session · grade · pairs ── */}
      {(sessionData.length > 0 || gradeData.length > 0 || pairData.length > 0) && (
        <div className="breakdown-row breakdown-3col">
          {sessionData.length > 0 && (
            <div className="breakdown-card">
              <span className="breakdown-title">Session</span>
              <div className="breakdown-items">
                {sessionData.map(s => (
                  <div key={s.name} className="breakdown-item">
                    <span className="breakdown-item-label">{s.name}</span>
                    <div className="breakdown-bar-track"><div className="breakdown-bar-fill blue" style={{ width: `${s.wr}%` }}/></div>
                    <span className="breakdown-item-value">{s.wr}%</span>
                    <span className="breakdown-item-sub">{s.total}t</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {gradeData.length > 0 && (
            <div className="breakdown-card">
              <span className="breakdown-title">Grade</span>
              <div className="breakdown-items">
                {gradeData.map(g => {
                  const mx = Math.max(...gradeData.map(x => x.total), 1);
                  return (
                    <div key={g.name} className="breakdown-item">
                      <span className="breakdown-item-label">{g.name}</span>
                      <div className="breakdown-bar-track">
                        <div className={`breakdown-bar-fill ${g.name === 'A+' ? 'green' : g.name === 'A' ? 'blue' : g.name === 'B' ? 'amber' : 'red'}`} style={{ width: `${(g.total / mx) * 100}%` }}/>
                      </div>
                      <span className="breakdown-item-value">{g.wr}%</span>
                      <span className="breakdown-item-sub">{g.total}t</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {pairData.length > 0 && (
            <div className="breakdown-card">
              <span className="breakdown-title">Pairs</span>
              <div className="breakdown-items">
                {pairData.map(p => (
                  <div key={p.name} className="breakdown-item">
                    <span className="breakdown-item-label pair-label">{p.name}</span>
                    <div className="breakdown-bar-track">
                      <div className={`breakdown-bar-fill ${p.win_rate >= 60 ? 'green' : p.win_rate >= 40 ? 'amber' : 'red'}`} style={{ width: `${p.win_rate}%` }}/>
                    </div>
                    <span className="breakdown-item-value">{p.win_rate}%</span>
                    <span className="breakdown-item-sub">{p.total}t</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Trade Log ── */}
      <div className="trades-table-container">
        <div className="table-header">
          <div className="table-header-left">
            <span className="table-title">// trade log</span>
            <span className="table-count">{displayed.length} records</span>
            {selected.size > 0 && (
              <div className="bulk-actions">
                <span className="bulk-count">{selected.size} selected</span>
                <button className="btn-bulk-delete" onClick={() => setDeleteIds([...selected])}><Trash2 size={12}/> Delete</button>
                <button className="btn-bulk-clear" onClick={() => setSelected(new Set())}><X size={11}/></button>
              </div>
            )}
          </div>
        </div>

        {activeView === 'calendar' ? (
          <div className="calendar-wrapper-pad">
            <CalendarHeatmap trades={displayed}/>
          </div>
        ) : loading ? (
          <div className="loading-state"><div className="loading-dots"><span/><span/><span/></div>loading trades...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><Activity size={28} strokeWidth={1}/>no trades found</div>
        ) : (
          <div className="table-scroll">
            <table className="trades-table">
              <thead>
                <tr>
                  <th className="th-check">
                    <button className="check-btn" onClick={toggleAll}>
                      {allSelected ? <CheckSquare size={14}/> : <Square size={14}/>}
                    </button>
                  </th>
                  <th>Date</th><th>Pair</th><th>Dir</th><th>Session</th>
                  <th>Model</th><th>Quality</th><th>Rules</th>
                  <th>Result</th><th>RR</th><th>PnL %</th><th>Grade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(t => (
                  <tr key={t.id} className={`trade-row${selected.has(t.id) ? ' row-selected' : ''}`}>
                    <td className="td-check" onClick={e => { e.stopPropagation(); toggleSelect(t.id); }}>
                      <button className="check-btn">{selected.has(t.id) ? <CheckSquare size={13}/> : <Square size={13}/>}</button>
                    </td>
                    <td onClick={() => setViewTrade(t)}>
                      <div className="td-date">
                        <span className="td-mono">{t.date}</span>
                        {t.weekday && <span className="td-wd">{t.weekday.slice(0, 3)}</span>}
                      </div>
                    </td>
                    <td onClick={() => setViewTrade(t)}><span className="td-pair">{t.pairs}</span></td>
                    <td onClick={() => setViewTrade(t)}>
                      <span className={`pos-badge ${t.position === 'Long' || t.position === 'BUY' ? 'buy' : 'sell'}`}>
                        {t.position === 'Long' || t.position === 'BUY' ? '↑ L' : '↓ S'}
                      </span>
                    </td>
                    <td onClick={() => setViewTrade(t)} className="text-sm text-secondary">{t.session || '—'}</td>
                    <td onClick={() => setViewTrade(t)}>
                      <div className="cell-stack">
                        {t.entry_model && <span className="model-badge">{t.entry_model}</span>}
                        {t.trade_direction_type && <span className="sub">{t.trade_direction_type}</span>}
                        {!t.entry_model && !t.trade_direction_type && <span className="text-muted">—</span>}
                      </div>
                    </td>
                    <td onClick={() => setViewTrade(t)}>
                      {t.setup_quality
                        ? <span className={`quality-badge q-${t.setup_quality.replace('+', 'p').replace(/ /g, '-').toLowerCase()}`}>{t.setup_quality}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td onClick={() => setViewTrade(t)}>
                      {t.trading_rules
                        ? <span className={`rules-badge ${t.trading_rules === 'Rules Followed' ? 'rules-ok' : 'rules-bad'}`}>
                            {t.trading_rules === 'Rules Followed' ? '✓' : '✗'}
                          </span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td onClick={() => setViewTrade(t)}><span className={`result-chip ${resultClass(t.result)}`}>{t.result || '—'}</span></td>
                    <td onClick={() => setViewTrade(t)} className="td-mono">{t.rr || '—'}</td>
                    <td onClick={() => setViewTrade(t)} className={`td-mono ${t.profit_pct > 0 ? 'pnl-positive' : t.profit_pct < 0 ? 'pnl-negative' : 'pnl-neutral'}`}>
                      {t.profit_pct != null ? pct(t.profit_pct) : '—'}
                    </td>
                    <td onClick={() => setViewTrade(t)}><span className={`grade-chip ${gradeClass(t.grade)}`}>{t.grade || '—'}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="row-actions">
                        <button className="btn-row-view"   onClick={() => setViewTrade(t)}><Eye size={12}/></button>
                        <button className="btn-row-edit"   onClick={() => navigate(`/journal?id=${t.id}`)}><Pencil size={12}/></button>
                        <button className="btn-row-delete" onClick={() => setDeleteIds([t.id])}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirm ── */}
      {deleteIds && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteIds(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><Trash2 size={22}/></div>
            <h3>Delete {deleteIds.length > 1 ? `${deleteIds.length} Trades` : 'Trade'}</h3>
            <p>Permanently remove {deleteIds.length > 1 ? `${deleteIds.length} trades` : `trade #${deleteIds[0]}`}. Cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setDeleteIds(null)}>Keep</button>
              <button className="btn-modal-delete" onClick={() => doDelete(deleteIds)} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Trade View Modal — rendered via Portal to guarantee viewport centering ── */}
      {viewTrade && createPortal(
        <TradeViewModal
          trade={viewTrade}
          onClose={() => setViewTrade(null)}
          onEdit={() => { setViewTrade(null); navigate(`/journal?id=${viewTrade.id}`); }}
          onDelete={() => { setDeleteIds([viewTrade.id]); setViewTrade(null); }}
          onLightbox={(imgs, idx) => { setLightboxImg(imgs); setLightboxIdx(idx); }}
        />,
        document.body
      )}

      {/* ── Lightbox ── */}
      {lightboxImg && createPortal(
        <Lightbox images={lightboxImg} idx={lightboxIdx} setIdx={setLightboxIdx} onClose={() => setLightboxImg(null)}/>,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* Sub-components                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StreakBadge({ streak }) {
  if (!streak.count || streak.count < 2) return null;
  const isWin  = streak.type === 'win';
  const isLoss = streak.type === 'loss';
  return (
    <div className={`streak-badge ${isWin ? 'streak-win' : isLoss ? 'streak-loss' : 'streak-be'}`}>
      {isWin ? <Flame size={13}/> : <Activity size={13}/>}
      <span>{streak.count} {isWin ? 'WIN' : isLoss ? 'LOSS' : 'BE'} STREAK</span>
    </div>
  );
}

function EquityCurve({ trades }) {
  const withPnl = trades.filter(t => t.profit_pct != null);
  if (withPnl.length < 2) return null;

  const sorted = [...withPnl].sort((a, b) => {
    const da = `${a.date}T${a.time_of_trade || '00:00'}`;
    const db = `${b.date}T${b.time_of_trade || '00:00'}`;
    return da.localeCompare(db);
  });

  const pts = [0];
  sorted.forEach(t => pts.push(pts[pts.length - 1] + (t.profit_pct || 0)));

  let pk = 0;
  const peaks = [0];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i] > pk) pk = pts[i];
    peaks.push(pk);
  }

  const W = 1000, H = 180, PX = 8, PY = 16;
  const mn  = Math.min(...pts, 0) - 0.5;
  const mx  = Math.max(...pts, 0) + 0.5;
  const rng = mx - mn || 1;
  const xS  = i => PX + (i / (pts.length - 1)) * (W - PX * 2);
  const yS  = v => PY + (1 - (v - mn) / rng) * (H - PY * 2);
  const y0  = yS(0);

  const lineD  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xS(i).toFixed(1)} ${yS(p).toFixed(1)}`).join(' ');
  const aboveD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xS(i).toFixed(1)} ${Math.min(yS(p), y0).toFixed(1)}`).join(' ')
    + ` L ${xS(pts.length - 1).toFixed(1)} ${y0.toFixed(1)} L ${xS(0).toFixed(1)} ${y0.toFixed(1)} Z`;
  const belowD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xS(i).toFixed(1)} ${Math.max(yS(p), y0).toFixed(1)}`).join(' ')
    + ` L ${xS(pts.length - 1).toFixed(1)} ${y0.toFixed(1)} L ${xS(0).toFixed(1)} ${y0.toFixed(1)} Z`;

  const totalPnl = pts[pts.length - 1];
  const maxDD    = Math.min(...pts.map((p, i) => p - peaks[i]));
  const isPos    = totalPnl >= 0;

  return (
    <div className="equity-card">
      <div className="equity-header">
        <span className="equity-title">// equity curve</span>
        <div className="equity-kpis">
          <span className={`equity-kpi-val ${isPos ? 'text-green' : 'text-red'}`}>{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}%</span>
          {maxDD < -0.01 && <span className="equity-kpi-dd">DD {maxDD.toFixed(2)}%</span>}
          <span className="equity-kpi-n">{sorted.length} trades</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="equity-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eq-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3D7A56" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#3D7A56" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="eq-red" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#B85A48" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#B85A48" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <line x1={PX} y1={y0.toFixed(1)} x2={W - PX} y2={y0.toFixed(1)} stroke="rgba(28,24,20,0.15)" strokeWidth="1" strokeDasharray="4 4"/>
        <path d={aboveD} fill="url(#eq-green)"/>
        <path d={belowD} fill="url(#eq-red)"/>
        <path d={lineD} fill="none" stroke={isPos ? '#3D7A56' : '#B85A48'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={xS(pts.length - 1).toFixed(1)} cy={yS(pts[pts.length - 1]).toFixed(1)} r="4.5" fill={isPos ? '#3D7A56' : '#B85A48'}/>
      </svg>
      <div className="equity-footer">
        <span className="equity-foot-l">Start</span>
        <span className="equity-foot-l">Trade {sorted.length}</span>
      </div>
    </div>
  );
}

function InsightCard({ ins }) {
  return (
    <div className={`insight-card insight-${ins.tone}`}>
      <ins.icon size={14} className="insight-icon"/>
      <div className="insight-body">
        <span className="insight-text">{ins.text}</span>
        <span className="insight-sub">{ins.sub}</span>
      </div>
    </div>
  );
}

function HourHeatmap({ trades }) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ h, w: 0, n: 0 }));
  trades.forEach(t => {
    if (!t.time_of_trade) return;
    const h = parseInt(t.time_of_trade.split(':')[0], 10);
    if (isNaN(h) || h < 0 || h > 23) return;
    hours[h].n++;
    if (resultClass(t.result) === 'win') hours[h].w++;
  });
  return (
    <div className="hour-grid">
      {hours.map(({ h, w, n }) => {
        const wr  = n ? Math.round(w / n * 100) : null;
        const cls = !n ? 'empty' : wr >= 60 ? 'great' : wr >= 40 ? 'ok' : 'bad';
        return (
          <div key={h} className={`hour-cell hour-${cls}`}
            title={n ? `${String(h).padStart(2, '0')}:00 — ${wr}% WR (${n} trades)` : `${String(h).padStart(2, '0')}:00 — no trades`}>
            <span className="hour-h">{String(h).padStart(2, '0')}</span>
            {n > 0 && <span className="hour-wr">{wr}%</span>}
            {n > 0 && <span className="hour-n">{n}t</span>}
          </div>
        );
      })}
    </div>
  );
}

function CalendarHeatmap({ trades }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [sel,   setSel]   = useState(null);

  const byDate = {};
  trades.forEach(t => {
    if (!t.date) return;
    if (!byDate[t.date]) byDate[t.date] = { pnl: 0, trades: [] };
    byDate[t.date].pnl += (t.profit_pct || 0);
    byDate[t.date].trades.push(t);
  });

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow    = (first.getDay() + 6) % 7;
  const monthLabel  = first.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const today       = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevM = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextM = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const selTrades = sel && byDate[sel] ? byDate[sel].trades : [];

  return (
    <div className="cal-wrapper">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevM}><ChevronLeft size={14}/></button>
        <span className="cal-month-label">{monthLabel}</span>
        <button className="cal-nav-btn" onClick={nextM}><ChevronRight size={14}/></button>
      </div>
      <div className="cal-dow-row">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d} className="cal-dow">{d}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="cal-cell cal-empty"/>;
          const ds   = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const data = byDate[ds];
          const isToday = ds === today;
          const isSel   = ds === sel;
          const cls = data ? (data.pnl > 0.01 ? 'green' : data.pnl < -0.01 ? 'red' : 'amber') : 'none';
          return (
            <div key={i} className={`cal-cell cal-${cls}${isToday ? ' cal-today' : ''}${isSel ? ' cal-selected' : ''}`}
              onClick={() => setSel(isSel ? null : ds)}>
              <span className="cal-day-num">{day}</span>
              {data && <span className="cal-day-pnl">{data.pnl >= 0 ? '+' : ''}{data.pnl.toFixed(1)}%</span>}
              {data && <span className="cal-day-count">{data.trades.length}t</span>}
            </div>
          );
        })}
      </div>
      {sel && selTrades.length > 0 && (
        <div className="cal-day-detail animate-fade-up">
          <div className="cal-detail-title">Trades on {sel}</div>
          {selTrades.map(t => (
            <div key={t.id} className="cal-trade-row">
              <span className="cal-tr-pair">{t.pairs}</span>
              <span className="cal-tr-model text-muted">{t.entry_model || '—'}</span>
              <span className={`result-chip ${resultClass(t.result)}`}>{t.result || '—'}</span>
              <span className={t.profit_pct > 0 ? 'pnl-positive' : t.profit_pct < 0 ? 'pnl-negative' : 'pnl-neutral'} style={{fontFamily:'var(--font-mono)',fontSize:'0.72rem'}}>{t.profit_pct != null ? pct(t.profit_pct) : '—'}</span>
              <span className={`grade-chip ${gradeClass(t.grade)}`}>{t.grade || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TradeViewModal({ trade, onClose, onEdit, onDelete, onLightbox }) {
  let images = []; try { images = JSON.parse(trade.chart_images || '[]'); } catch {}
  let confluences = [];
  try {
    confluences = JSON.parse(trade.confluence_tags || '[]');
    if (!Array.isArray(confluences) || !confluences.length)
      confluences = (trade.trade_confluences || '').split(',').map(s => s.trim()).filter(Boolean);
  } catch { confluences = (trade.trade_confluences || '').split(',').map(s => s.trim()).filter(Boolean); }
  let emotions   = []; try { emotions   = JSON.parse(trade.emotions    || '[]'); } catch {}
  let conditions = []; try { conditions = JSON.parse(trade.condition_tags || '[]'); } catch {}

  const imgUrls = images.map(img => ({
    url: `/static/uploads/${typeof img === 'string' ? img : img.filename}`,
    tf: typeof img === 'string' ? '' : img.timeframe,
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="view-modal" onClick={e => e.stopPropagation()}>
        <div className="vm-header">
          <div className="vm-header-left">
            <span className="vm-trade-name">{trade.trade_name || `Trade #${trade.id}`}</span>
            <div className="vm-chips">
              {trade.pairs    && <span className="vm-pair">{trade.pairs}</span>}
              {trade.position && <span className={`pos-badge ${trade.position === 'Long' || trade.position === 'BUY' ? 'buy' : 'sell'}`}>{trade.position === 'Long' || trade.position === 'BUY' ? '↑ Long' : '↓ Short'}</span>}
              {trade.result   && <span className={`result-chip ${resultClass(trade.result)}`}>{trade.result}</span>}
              {trade.grade    && <span className={`grade-chip ${gradeClass(trade.grade)}`}>{trade.grade}</span>}
              {trade.profit_pct != null && <span className={trade.profit_pct > 0 ? 'pnl-positive' : 'pnl-negative'} style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'0.82rem'}}>{pct(trade.profit_pct)}</span>}
            </div>
          </div>
          <div className="vm-header-right">
            <button className="btn-vm-edit" onClick={onEdit}><Pencil size={13}/> Edit</button>
            <button className="btn-vm-delete" onClick={onDelete}><Trash2 size={13}/></button>
            <button className="btn-vm-close"  onClick={onClose}><X size={16}/></button>
          </div>
        </div>

        <div className="vm-body">
          <div className="vm-fields">
            <FieldGroup title="Identification">
              <Field label="Date"    value={trade.date}/>
              <Field label="Time"    value={trade.time_of_trade}/>
              <Field label="Weekday" value={trade.weekday}/>
              <Field label="Session" value={trade.session}/>
              <Field label="Account" value={trade.account_type}/>
              <Field label="Type"    value={trade.trade_type}/>
            </FieldGroup>
            <FieldGroup title="Structure">
              <Field label="Break of Structure" value={trade.break_of_structure}/>
              <Field label="HTF Weak Structure" value={trade.htf_weak_structure}/>
              <Field label="MTF Weak Structure" value={trade.mtf_weak_structure}/>
              <Field label="Target"             value={trade.target_type}/>
              <Field label="Entry Confirmation" value={trade.entry_confirmation_type}/>
            </FieldGroup>
            <FieldGroup title="Trade Setup">
              <Field label="Entry Model"   value={trade.entry_model}/>
              <Field label="Direction"     value={trade.trade_direction_type}/>
              <Field label="Stop Loss"     value={trade.stop_loss_type}/>
              <Field label="Setup Quality" value={trade.setup_quality}/>
              <Field label="News"          value={trade.news_type}/>
              <Field label="Rej. Candle"   value={trade.rejection_candle_type}/>
            </FieldGroup>
            <FieldGroup title="Execution">
              <Field label="Risk %"        value={trade.risk_pct ? `${trade.risk_pct}%` : null}/>
              <Field label="R:R"           value={trade.rr}/>
              <Field label="PnL %"         value={trade.profit_pct != null ? pct(trade.profit_pct) : null} tone={trade.profit_pct > 0 ? 'green' : trade.profit_pct < 0 ? 'red' : null}/>
              <Field label="Trading Rules" value={trade.trading_rules}/>
              <Field label="Re-Entry"      value={trade.re_entry_criteria}/>
            </FieldGroup>
            {confluences.length > 0 && (
              <FieldGroup title="Confluences">
                <div className="vm-pills">{confluences.map(c => <span key={c} className="vm-pill">{c}</span>)}</div>
              </FieldGroup>
            )}
            {conditions.length > 0 && (
              <FieldGroup title="Conditions">
                <div className="vm-pills">{conditions.map(c => <span key={c} className="vm-pill vm-pill-dim">{c}</span>)}</div>
              </FieldGroup>
            )}
            {(trade.dxy || trade.top_down) && (
              <FieldGroup title="Analysis">
                {trade.dxy_direction && <Field label="DXY Direction" value={trade.dxy_direction}/>}
                {trade.dxy      && <FieldText label="DXY"       value={trade.dxy}/>}
                {trade.top_down && <FieldText label="Top-Down"  value={trade.top_down}/>}
              </FieldGroup>
            )}
            {(trade.grade || trade.why_grade) && (
              <FieldGroup title="Grading">
                {trade.grade     && <Field    label="Grade" value={trade.grade}/>}
                {trade.why_grade && <FieldText label="Why?" value={trade.why_grade}/>}
              </FieldGroup>
            )}
            {(trade.psycho || trade.review_lesson || emotions.length > 0) && (
              <FieldGroup title="Psychology">
                {emotions.length > 0 && (
                  <div className="vm-pills" style={{ marginBottom: '0.5rem' }}>
                    {emotions.map(e => <span key={e} className="vm-pill vm-pill-emotion">{e}</span>)}
                  </div>
                )}
                {trade.psycho        && <FieldText label="Mindset" value={trade.psycho}/>}
                {trade.review_lesson && <FieldText label="Lessons" value={trade.review_lesson}/>}
              </FieldGroup>
            )}
          </div>

          {imgUrls.length > 0 && (
            <div className="vm-images">
              <span className="vm-img-title">// chart screenshots</span>
              <div className="vm-img-grid">
                {imgUrls.map((img, i) => (
                  <div key={i} className="vm-img-card" onClick={() => onLightbox(imgUrls, i)}>
                    <img src={img.url} alt={`chart ${i + 1}`} loading="lazy"/>
                    {img.tf && <span className="vm-img-tf">{img.tf}</span>}
                    <div className="vm-img-expand"><Maximize2 size={12}/></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Lightbox({ images, idx, setIdx, onClose }) {
  const img = images[idx];
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight')  setIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft')   setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images, onClose, setIdx]);
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
        <button className="lb-close" onClick={onClose}><X size={18}/></button>
        {images.length > 1 && <>
          <button className="lb-nav lb-prev" onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}><ChevronLeft size={22}/></button>
          <button className="lb-nav lb-next" onClick={() => setIdx(i => Math.min(i + 1, images.length - 1))} disabled={idx === images.length - 1}><ChevronRight size={22}/></button>
        </>}
        <img src={img.url} alt="chart" className="lb-img"/>
        <div className="lb-footer">
          {img.tf && <span className="lb-tf">{img.tf}</span>}
          <span className="lb-counter">{idx + 1} / {images.length}</span>
        </div>
      </div>
    </div>
  );
}

function FilterSel({ label, val, opts, onChange }) {
  return (
    <div className="filter-sel">
      <span className="filter-sel-label">{label}</span>
      <div className="select-wrapper">
        <select value={val} onChange={e => onChange(e.target.value)}>
          <option value="">All</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={11} className="select-arrow"/>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, tone }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span className="stat-label">{label}</span>
      <div className="stat-value-row"><span className={`stat-value ${tone !== 'neutral' ? tone : ''}`}>{value}</span></div>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function FieldGroup({ title, children }) {
  return (
    <div className="vm-group">
      <span className="vm-group-title">// {title}</span>
      {children}
    </div>
  );
}
function Field({ label, value, tone }) {
  const clean = sanitize(value);
  if (!clean && clean !== 0) return null;
  return (
    <div className="vm-field">
      <span className="vm-field-label">{label}</span>
      <span className={`vm-field-value${tone ? ` tone-${tone}` : ''}`}>{clean}</span>
    </div>
  );
}
function FieldText({ label, value }) {
  const clean = sanitize(value);
  if (!clean) return null;
  return (
    <div className="vm-field-text">
      <span className="vm-field-label">{label}</span>
      <p className="vm-field-body">{clean}</p>
    </div>
  );
}
