import { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart2, Zap } from 'lucide-react';
import './LivePage.css';

const fmt  = (n, d=2) => n==null ? '—' : Number(n).toFixed(d);
const pct  = (n)      => n==null ? '—' : `${n>=0?'+':''}${fmt(n)}%`;
const money = (n)     => n==null ? '—' : `$${Number(n).toLocaleString('en', {minimumFractionDigits:2,maximumFractionDigits:2})}`;

const HOURS = Array.from({length:24},(_,i)=>i);
const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function winRateColor(wr, total) {
  if (!total) return 'wr-none';
  if (wr >= 60) return 'wr-great';
  if (wr >= 40) return 'wr-ok';
  return 'wr-bad';
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LivePage() {
  const [status,     setStatus]     = useState(null);   // {connected, broker, account}
  const [account,    setAccount]    = useState(null);   // account info
  const [positions,  setPositions]  = useState([]);     // open positions
  const [history,    setHistory]    = useState([]);     // closed trades
  const [loading,    setLoading]    = useState(true);
  const [spinning,   setSpinning]   = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [form, setForm] = useState({ login:'', password:'', server:'', path:'' });
  const [showForm, setShowForm] = useState(false);
  const [error,  setError]  = useState('');
  const pollRef = useRef(null);

  const fetchAll = useCallback(async (quiet=false) => {
    if (!quiet) { setLoading(true); setSpinning(true); }
    else setSpinning(true);
    try {
      const [stR, acR, poR, hiR] = await Promise.all([
        fetch('/api/live/status'),
        fetch('/api/live/account'),
        fetch('/api/live/positions'),
        fetch('/api/live/trades'),
      ]);
      if (stR.ok) setStatus(await stR.json());
      if (acR.ok) setAccount(await acR.json());
      if (poR.ok) setPositions(await poR.json());
      if (hiR.ok) setHistory(await hiR.json());
    } catch(e) { console.error(e); }
    setLoading(false);
    setTimeout(() => setSpinning(false), 600);
  }, []);

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchAll]);

  const handleConnect = async (e) => {
    e.preventDefault(); setConnecting(true); setError('');
    try {
      const res = await fetch('/api/live/connect', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) { setShowForm(false); await fetchAll(); }
      else setError(data.error || data.message || 'Connection failed');
    } catch(err) { setError(err.message); }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    await fetch('/api/live/disconnect', { method:'POST' });
    await fetchAll();
  };

  // ── Analytics from history ─────────────────────────────────────────────────
  const closed = Array.isArray(history) ? history : [];
  const wins   = closed.filter(t => (t.profit||0) > 0);
  const losses = closed.filter(t => (t.profit||0) < 0);
  const bes    = closed.filter(t => (t.profit||0) === 0);
  const totalPnl = closed.reduce((a,t)=>a+(t.profit||0), 0);
  const winRate  = closed.length ? Math.round(wins.length/closed.length*100) : 0;
  const avgWin   = wins.length ? wins.reduce((a,t)=>a+(t.profit||0),0)/wins.length : 0;
  const avgLoss  = losses.length ? losses.reduce((a,t)=>a+(t.profit||0),0)/losses.length : 0;
  const grossWin = wins.reduce((a,t)=>a+Math.abs(t.profit||0),0);
  const grossLoss= losses.reduce((a,t)=>a+Math.abs(t.profit||0),0);
  const pf       = grossLoss > 0 ? (grossWin/grossLoss).toFixed(2) : wins.length ? '∞' : '—';

  // Weekday breakdown from open_time
  const byWeekday = {};
  WEEKDAYS.forEach((d,i) => byWeekday[i] = { label:d, wins:0, losses:0, total:0, pnl:0 });
  closed.forEach(t => {
    if (!t.open_time) return;
    const d = new Date(t.open_time);
    const wd = d.getDay() === 0 ? 6 : d.getDay()-1;
    if (byWeekday[wd]) {
      byWeekday[wd].total++;
      byWeekday[wd].pnl += (t.profit||0);
      if ((t.profit||0)>0) byWeekday[wd].wins++;
      else if ((t.profit||0)<0) byWeekday[wd].losses++;
    }
  });

  // Hour breakdown from open_time
  const byHour = {};
  HOURS.forEach(h => byHour[h] = { wins:0, losses:0, total:0 });
  closed.forEach(t => {
    if (!t.open_time) return;
    const h = new Date(t.open_time).getHours();
    byHour[h].total++;
    if ((t.profit||0)>0) byHour[h].wins++;
    else if ((t.profit||0)<0) byHour[h].losses++;
  });

  // Pair breakdown
  const byPair = {};
  closed.forEach(t => {
    const sym = t.symbol || t.pair || 'Unknown';
    if (!byPair[sym]) byPair[sym] = { wins:0, losses:0, total:0, pnl:0 };
    byPair[sym].total++;
    byPair[sym].pnl += (t.profit||0);
    if ((t.profit||0)>0) byPair[sym].wins++;
    else if ((t.profit||0)<0) byPair[sym].losses++;
  });
  const pairList = Object.entries(byPair)
    .map(([k,v])=>({name:k,...v,wr:v.total?Math.round(v.wins/v.total*100):0}))
    .sort((a,b)=>b.total-a.total).slice(0,8);

  // Best hour for trading
  const bestHour = HOURS.reduce((best,h) => {
    const d = byHour[h];
    if (!d.total) return best;
    const wr = Math.round(d.wins/d.total*100);
    return (!best || wr > byHour[best].wins/byHour[best].total*100) ? h : best;
  }, null);

  const isConnected = status?.connected;

  return (
    <div className="live-page animate-fade-up">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <span className="page-label">// mt5 live terminal</span>
          <h2>Live Trades</h2>
        </div>
        <div className="header-actions">
          <button className={`btn-icon${spinning?' spinning':''}`} onClick={() => fetchAll()} title="Refresh">
            <RefreshCw size={15}/>
          </button>
          {isConnected ? (
            <button className="btn-disconnect" onClick={handleDisconnect}>
              <WifiOff size={13}/> Disconnect
            </button>
          ) : (
            <button className="btn-connect" onClick={() => setShowForm(s=>!s)}>
              <Wifi size={13}/> Connect MT5
            </button>
          )}
        </div>
      </div>

      {/* ── Connect Form ── */}
      {showForm && !isConnected && (
        <div className="connect-card">
          <div className="connect-title">
            <Zap size={14}/> Connect MetaTrader 5
          </div>
          <form onSubmit={handleConnect} className="connect-form">
            <div className="cf-grid">
              <div className="cf-group">
                <label>Account Login</label>
                <input value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))}
                  placeholder="123456789" required/>
              </div>
              <div className="cf-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  placeholder="••••••••" required/>
              </div>
              <div className="cf-group">
                <label>Server</label>
                <input value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))}
                  placeholder="ICMarkets-Live" required/>
              </div>
              <div className="cf-group">
                <label>MT5 Path <span className="cf-optional">(optional)</span></label>
                <input value={form.path} onChange={e=>setForm(f=>({...f,path:e.target.value}))}
                  placeholder="C:\MT5\terminal64.exe"/>
              </div>
            </div>
            {error && <div className="cf-error">{error}</div>}
            <button type="submit" className="btn-connect-submit" disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect Account'}
            </button>
          </form>
          <div className="cf-note">// credentials are stored locally on this machine only</div>
        </div>
      )}

      {/* ── Connection status banner ── */}
      {!loading && (
        <div className={`status-banner ${isConnected?'connected':'disconnected'}`}>
          {isConnected ? <Wifi size={13}/> : <WifiOff size={13}/>}
          <span>
            {isConnected
              ? `Connected · ${status?.broker || 'MT5'} · Account ${status?.account || ''}`
              : 'Not connected to MetaTrader 5 — showing demo data'}
          </span>
          {isConnected && <span className="status-dot"/>}
        </div>
      )}

      {/* ── Account summary ── */}
      {account && (
        <div className="account-grid">
          <AccCard label="Balance"    value={money(account.balance)}  icon={<DollarSign size={16}/>} tone="neutral"/>
          <AccCard label="Equity"     value={money(account.equity)}   icon={<TrendingUp size={16}/>} tone={account.equity>=(account.balance||0)?'positive':'negative'}/>
          <AccCard label="Free Margin" value={money(account.free_margin||account.margin_free)} icon={<BarChart2 size={16}/>} tone="neutral"/>
          <AccCard label="Open P&L"   value={money(account.profit)}   icon={<Activity size={16}/>}   tone={(account.profit||0)>=0?'positive':'negative'}/>
        </div>
      )}

      {/* ── KPI row from history ── */}
      {closed.length > 0 && (
        <div className="kpi-row">
          <KPI label="Closed Trades" value={closed.length} />
          <KPI label="Win Rate"      value={`${winRate}%`} tone={winRate>=50?'positive':'negative'}/>
          <KPI label="Total PnL"     value={money(totalPnl)} tone={totalPnl>=0?'positive':'negative'}/>
          <KPI label="Profit Factor" value={pf} tone={Number(pf)>=1.5?'positive':Number(pf)<1?'negative':'neutral'}/>
          <KPI label="Avg Win"       value={money(avgWin)}  tone="positive"/>
          <KPI label="Avg Loss"      value={money(avgLoss)} tone="negative"/>
        </div>
      )}

      {/* ── Open Positions ── */}
      <Section title="// open positions" count={positions.length} badge="live">
        {positions.length === 0 ? (
          <div className="empty-state"><Activity size={22} strokeWidth={1}/>No open positions</div>
        ) : (
          <table className="live-table">
            <thead><tr>
              <th>Ticket</th><th>Symbol</th><th>Type</th><th>Lots</th>
              <th>Open Price</th><th>Current</th><th>SL</th><th>TP</th><th>Profit</th>
            </tr></thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.ticket||p.id}>
                  <td className="td-mono">{p.ticket||p.id}</td>
                  <td className="td-sym">{p.symbol||p.pair}</td>
                  <td><span className={`dir-badge ${(p.type||'').toLowerCase().includes('buy')?'buy':'sell'}`}>{p.type}</span></td>
                  <td className="td-mono">{fmt(p.volume||p.lots,2)}</td>
                  <td className="td-mono">{fmt(p.open_price||p.price_open,5)}</td>
                  <td className="td-mono">{fmt(p.current_price||p.price_current,5)}</td>
                  <td className="td-mono text-red">{p.sl||p.stop_loss||'—'}</td>
                  <td className="td-mono text-green">{p.tp||p.take_profit||'—'}</td>
                  <td className={`td-mono pnl-${(p.profit||0)>=0?'pos':'neg'}`}>{money(p.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ── Analytics row: Weekday + Hours ── */}
      {closed.length > 0 && (
        <div className="analytics-row">

          {/* Weekday performance */}
          <div className="ana-card">
            <span className="ana-title">// win rate by weekday</span>
            {bestHour != null && (
              <span className="ana-insight">
                <Clock size={11}/> Best hour: <strong>{bestHour}:00–{bestHour+1}:00</strong>
              </span>
            )}
            <div className="wd-bars">
              {Object.values(byWeekday).slice(0,5).map((d,i)=>{
                const wr = d.total ? Math.round(d.wins/d.total*100) : 0;
                return (
                  <div key={i} className="wd-col">
                    <span className="wd-pct">{d.total>0?`${wr}%`:''}</span>
                    <div className="wd-bar-track">
                      <div className={`wd-bar-fill ${wr>=60?'green':wr>=40?'amber':'red'}`} style={{height:`${d.total>0?wr:0}%`}}/>
                    </div>
                    <span className="wd-label">{d.label}</span>
                    <span className="wd-count">{d.total>0?`${d.total}t`:''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hour heatmap */}
          <div className="ana-card">
            <span className="ana-title">// activity by hour (24h)</span>
            <div className="hour-grid">
              {HOURS.map(h => {
                const d = byHour[h];
                const wr = d.total ? Math.round(d.wins/d.total*100) : -1;
                return (
                  <div key={h} className={`hour-cell ${winRateColor(wr, d.total)}`} title={`${h}:00 — ${d.total} trades${d.total?`, ${wr}% WR`:''}`}>
                    <span className="hc-hour">{h}</span>
                    {d.total>0 && <span className="hc-wr">{wr}%</span>}
                  </div>
                );
              })}
            </div>
            <div className="heatmap-legend">
              <span className="hl-item wr-none">No data</span>
              <span className="hl-item wr-bad">{'<'}40%</span>
              <span className="hl-item wr-ok">40–60%</span>
              <span className="hl-item wr-great">{'>'}60%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Pair breakdown ── */}
      {pairList.length > 0 && (
        <div className="ana-single">
          <div className="ana-card">
            <span className="ana-title">// performance by pair</span>
            <div className="pair-grid">
              {pairList.map(p=>(
                <div key={p.name} className="pair-cell">
                  <span className="pair-sym">{p.name}</span>
                  <span className={`pair-wr ${p.wr>=60?'text-green':p.wr>=40?'text-amber':'text-red'}`}>{p.wr}%</span>
                  <div className="pair-bar-track">
                    <div className={`pair-bar-fill ${p.wr>=60?'green':p.wr>=40?'amber':'red'}`} style={{width:`${p.wr}%`}}/>
                  </div>
                  <span className="pair-count">{p.total}t</span>
                  <span className={`pair-pnl ${p.pnl>=0?'text-green':'text-red'}`}>{money(p.pnl)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Trade History ── */}
      <Section title="// closed trades" count={closed.length}>
        {closed.length === 0 ? (
          <div className="empty-state"><Activity size={22} strokeWidth={1}/>No trade history</div>
        ) : (
          <div className="table-scroll">
            <table className="live-table">
              <thead><tr>
                <th>Ticket</th><th>Symbol</th><th>Type</th><th>Lots</th>
                <th>Open</th><th>Close</th><th>Open Price</th><th>Close Price</th><th>Profit</th>
              </tr></thead>
              <tbody>
                {closed.slice(0,200).map((t,i) => (
                  <tr key={t.ticket||i}>
                    <td className="td-mono">{t.ticket||'—'}</td>
                    <td className="td-sym">{t.symbol||t.pair}</td>
                    <td><span className={`dir-badge ${(t.type||'').toLowerCase().includes('buy')?'buy':'sell'}`}>{t.type}</span></td>
                    <td className="td-mono">{fmt(t.volume||t.lots,2)}</td>
                    <td className="td-mono text-muted">{t.open_time ? new Date(t.open_time).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '—'}</td>
                    <td className="td-mono text-muted">{t.close_time ? new Date(t.close_time).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '—'}</td>
                    <td className="td-mono">{fmt(t.open_price||t.price_open,5)}</td>
                    <td className="td-mono">{fmt(t.close_price||t.price_close,5)}</td>
                    <td className={`td-mono pnl-${(t.profit||0)>=0?'pos':'neg'}`}>{money(t.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function AccCard({ label, value, icon, tone }) {
  return (
    <div className={`acc-card ${tone}`}>
      <div className="acc-icon">{icon}</div>
      <span className="acc-label">{label}</span>
      <span className={`acc-value ${tone}`}>{value}</span>
    </div>
  );
}
function KPI({ label, value, tone }) {
  return (
    <div className="kpi-cell">
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value ${tone||''}`}>{value}</span>
    </div>
  );
}
function Section({ title, count, badge, children }) {
  return (
    <div className="live-section">
      <div className="live-section-header">
        <span className="ls-title">{title}</span>
        <div className="ls-right">
          {badge && <span className="ls-badge live-badge">{badge}</span>}
          <span className="ls-count">{count}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
