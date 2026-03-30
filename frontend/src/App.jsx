import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage         from './pages/DashboardPage';
import JournalPage           from './pages/JournalPage';
import BacktestJournalPage   from './pages/BacktestJournalPage';
import PsychologyPage        from './pages/PsychologyPage';
import ChecklistPage         from './pages/ChecklistPage';
import EdgeLabPage           from './pages/EdgeLabPage';
import TrashPage             from './pages/TrashPage';
import PerformanceDNAPage    from './pages/PerformanceDNAPage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content dot-bg">
          <Routes>
            <Route path="/"                  element={<DashboardPage title="Overview"     />} />
            <Route path="/live"              element={<DashboardPage title="Live Trades"   filter={{ trade_type: 'Live' }} />} />
            <Route path="/backtest"          element={<DashboardPage title="Backtest"      filter={{ trade_type: 'Backtest' }} />} />
            <Route path="/forward-test"      element={<DashboardPage title="Forward Test"  filter={{ trade_type: 'Forward Test' }} />} />
            <Route path="/journal"           element={<JournalPage />} />
            <Route path="/backtest-journal"  element={<BacktestJournalPage />} />
            <Route path="/psychology"        element={<PsychologyPage />} />
            <Route path="/checklist"         element={<ChecklistPage />} />
            <Route path="/edge-lab"          element={<EdgeLabPage />} />
            <Route path="/trash"             element={<TrashPage />} />
            <Route path="/performance-dna"   element={<PerformanceDNAPage />} />
          </Routes>
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}

export default App;
