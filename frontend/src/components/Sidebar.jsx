import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Activity, History, FastForward,
  PenLine, Flower2, ClipboardCheck, FlaskConical, Settings2,
  Trash2, Dna, Zap
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/',                  icon: LayoutDashboard, label: 'Overview'          },
  { path: '/live',              icon: Activity,        label: 'Live Trades'       },
  { path: '/backtest',          icon: History,         label: 'Backtest'          },
  { path: '/backtest-journal',  icon: Zap,             label: 'BT Journal'        },
  { path: '/forward-test',      icon: FastForward,     label: 'Forward Test'      },
  { path: '/journal',           icon: PenLine,         label: 'New Journal'       },
  { path: '/psychology',        icon: Flower2,         label: 'Psychology'        },
  { path: '/checklist',         icon: ClipboardCheck,  label: 'Checklist'         },
  { path: '/edge-lab',          icon: FlaskConical,    label: 'Edge Lab'          },
  { path: '/performance-dna',   icon: Dna,             label: 'Performance DNA'   },
  { path: '/trash',             icon: Trash2,          label: 'Trash'             },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Kanso mark — circle + dot */}
      <div className="sidebar-glyph">
        <div className="glyph-ring"/>
        <div className="glyph-dot-center"/>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => (
          <div key={item.path}>
            {(idx === 5 || idx === 9) && <div className="nav-divider"/>}
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon size={19} strokeWidth={1.5}/>
              <span className="tooltip">{item.label}</span>
            </NavLink>
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-item" title="Settings">
          <Settings2 size={17} strokeWidth={1.5}/>
          <span className="tooltip">Settings</span>
        </button>
      </div>
    </aside>
  );
}
