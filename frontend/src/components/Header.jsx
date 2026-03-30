import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import './Header.css';

/* Session hours in UTC */
const SESSIONS = [
  { name: 'Asia',    start:  0, end:  9, color: '#7A6EC0' },
  { name: 'London',  start:  8, end: 17, color: '#4E85C8' },
  { name: 'New York',start: 13, end: 22, color: '#4E9168' },
];

function getActiveSession(utcH, utcM) {
  const h = utcH + utcM / 60;
  const active = SESSIONS.filter(s => h >= s.start && h < s.end);
  if (!active.length) return { name: 'Off-Session', color: '#5C544B' };
  // prefer NY > London > Asia for overlap
  return active.sort((a, b) => b.end - b.start - (a.end - a.start))[0];
}

export default function Header() {
  const { theme, toggle } = useTheme();
  const [clock, setClock] = useState({ str: '', h: 0, m: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getUTCHours();
      const m = now.getUTCMinutes();
      const s = now.getUTCSeconds();
      setClock({
        str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} UTC`,
        h, m,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const session = getActiveSession(clock.h, clock.m);

  return (
    <header className="header">
      {/* Left: Brand */}
      <div className="header-left">
        <div className="nt-logo-mark">
          <span className="nt-logo-text">KT</span>
        </div>
        <span className="app-title">KansoTrader</span>
        <span className="header-version">v2.0</span>
      </div>

      {/* Center: Live clock + active session */}
      <div className="header-center">
        <div className="live-clock">
          <span className="live-clock-dot" />
          {clock.str}
        </div>
        <div className="session-pill" style={{ '--sess-color': session.color }}>
          <span className="session-dot"/>
          <span className="session-name">{session.name}</span>
        </div>
      </div>

      {/* Right: Session timeline + theme toggle */}
      <div className="header-right">
        <div className="session-timeline">
          {SESSIONS.map(s => {
            const h = clock.h + clock.m / 60;
            const active = h >= s.start && h < s.end;
            const pct = active ? Math.round(((h - s.start) / (s.end - s.start)) * 100) : 0;
            return (
              <div key={s.name} className={`sess-bar${active ? ' active' : ''}`} title={`${s.name}: ${s.start}:00–${s.end}:00 UTC`}>
                <span className="sess-bar-label">{s.name.slice(0, 2)}</span>
                <div className="sess-bar-track">
                  {active && <div className="sess-bar-fill" style={{ width: `${pct}%`, background: s.color }}/>}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-theme-toggle" onClick={toggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon size={15}/> : <Sun size={15}/>}
        </button>
      </div>
    </header>
  );
}
