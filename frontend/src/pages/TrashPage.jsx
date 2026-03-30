import { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import './TrashPage.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)   return 'just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)   return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30)  return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function resultColor(result) {
  if (!result) return 'muted';
  const r = result.toLowerCase();
  if (r.includes('profit') || r.includes('win'))  return 'green';
  if (r.includes('stop') || r.includes('loss'))   return 'red';
  if (r.includes('breakeven'))                    return 'amber';
  return 'muted';
}

export default function TrashPage() {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [confirm,    setConfirm]    = useState(null); // 'empty' | trade id
  const [toastMsg,   setToastMsg]   = useState('');
  const [toastType,  setToastType]  = useState('ok'); // ok | warn

  const toast = (msg, type = 'ok') => {
    setToastMsg(msg); setToastType(type);
    setTimeout(() => setToastMsg(''), 2800);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/trash')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (tid) => {
    await fetch(`/api/trash/restore/${tid}`, { method: 'POST' });
    toast('Trade restored to journal');
    load();
  };

  const permanentDelete = async (tid) => {
    await fetch(`/api/trash/${tid}`, { method: 'DELETE' });
    setConfirm(null);
    toast('Permanently deleted', 'warn');
    load();
  };

  const emptyTrash = async () => {
    await fetch('/api/trash/empty', { method: 'DELETE' });
    setConfirm(null);
    toast('Trash emptied', 'warn');
    load();
  };

  return (
    <div className="trash-page">
      {/* Toast */}
      {toastMsg && (
        <div className={`trash-toast trash-toast-${toastType}`}>
          {toastType === 'ok' ? <CheckCircle2 size={13}/> : <AlertTriangle size={13}/>}
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="trash-header">
        <div className="trash-header-left">
          <Trash2 size={16} className="trash-icon-title"/>
          <span className="trash-title">TRASH</span>
          {items.length > 0 && (
            <span className="trash-count-badge">{items.length}</span>
          )}
        </div>
        {items.length > 0 && (
          <button
            className="btn-empty-trash"
            onClick={() => setConfirm('empty')}
          >
            <Trash2 size={12}/> Empty Trash
          </button>
        )}
      </div>

      <p className="trash-sub">
        Items in trash are not permanently deleted until you choose to remove them.
      </p>

      {/* Content */}
      {loading ? (
        <div className="trash-empty-state">
          <div className="trash-spinner"/>
        </div>
      ) : items.length === 0 ? (
        <div className="trash-empty-state">
          <Trash2 size={32} className="trash-empty-icon"/>
          <p className="trash-empty-title">Trash is empty</p>
          <p className="trash-empty-sub">Deleted trades will appear here before permanent removal.</p>
        </div>
      ) : (
        <div className="trash-list">
          {items.map(t => (
            <div key={t.id} className="trash-item">
              {/* Left: trade info */}
              <div className="trash-item-info">
                <div className="trash-item-top">
                  <span className="trash-item-name">{t.trade_name || `Trade #${t.id}`}</span>
                  <span className={`trash-item-result trash-result-${resultColor(t.result)}`}>
                    {t.result || '—'}
                  </span>
                </div>
                <div className="trash-item-meta">
                  <span className="trash-meta-chip">{t.pairs || '—'}</span>
                  <span className="trash-meta-chip">{t.session || '—'}</span>
                  <span className="trash-meta-chip">{t.date || '—'}</span>
                  {t.profit_pct != null && (
                    <span className={`trash-meta-pnl ${t.profit_pct >= 0 ? 'pos' : 'neg'}`}>
                      {t.profit_pct >= 0 ? '+' : ''}{t.profit_pct}%
                    </span>
                  )}
                </div>
                <div className="trash-item-deleted-at">
                  <Clock size={10}/>
                  Deleted {timeAgo(t.deleted_at)}
                </div>
              </div>

              {/* Right: actions */}
              <div className="trash-item-actions">
                <button
                  className="btn-trash-restore"
                  onClick={() => restore(t.id)}
                  title="Restore trade"
                >
                  <RotateCcw size={13}/> Restore
                </button>
                <button
                  className="btn-trash-delete"
                  onClick={() => setConfirm(t.id)}
                  title="Delete forever"
                >
                  <Trash2 size={13}/> Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="trash-modal-overlay" onClick={() => setConfirm(null)}>
          <div className="trash-confirm-modal" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={22} className="trash-confirm-icon"/>
            <p className="trash-confirm-title">
              {confirm === 'empty' ? 'Empty entire trash?' : 'Delete this trade forever?'}
            </p>
            <p className="trash-confirm-sub">
              This action is permanent and cannot be undone. All associated chart images will also be removed.
            </p>
            <div className="trash-confirm-actions">
              <button className="btn-confirm-cancel" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className="btn-confirm-delete"
                onClick={() => confirm === 'empty' ? emptyTrash() : permanentDelete(confirm)}
              >
                <Trash2 size={12}/>
                {confirm === 'empty' ? 'Empty Trash' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
