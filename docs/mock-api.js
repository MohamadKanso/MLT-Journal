// MLT Journal public portfolio demo.
// Every record below is generated fictionally and contains no personal trading data.
(function () {
  const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
  const SESSIONS = ['London', 'New York'];
  const RESULTS = [
    'Take-Profit', 'Stop-Loss', 'Take-Profit', 'Breakeven', 'Take-Profit',
    'Stop-Loss', 'Take-Profit', 'Take-Profit', 'Breakeven', 'Stop-Loss',
    'Take-Profit', 'Take-Profit', 'Stop-Loss', 'Breakeven', 'Take-Profit',
    'Stop-Loss', 'Take-Profit', 'Take-Profit', 'Breakeven', 'Take-Profit',
  ];
  const QUALITIES = ['A', 'B', 'A+', 'A', 'A+', 'B', 'A', 'A+', 'A', 'B'];
  const DEMO_START = Date.UTC(2024, 0, 2);

  const TRADES = RESULTS.map((result, index) => {
    const id = index + 1;
    const date = new Date(DEMO_START + index * 4 * 24 * 60 * 60 * 1000);
    const dateText = date.toISOString().slice(0, 10);
    const quality = QUALITIES[index % QUALITIES.length];
    const profit = result === 'Take-Profit' ? [1.2, 1.5, 1.8, 2.0][index % 4] : result === 'Stop-Loss' ? -0.5 : 0;

    return {
      id,
      trade_name: `Fictional demo trade ${String(id).padStart(2, '0')}`,
      date: dateText,
      weekday: date.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' }),
      time_of_trade: `${String(8 + (index % 7)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`,
      session: SESSIONS[index % SESSIONS.length],
      pairs: PAIRS[index % PAIRS.length],
      position: index % 2 ? 'Short' : 'Long',
      trade_type: index < 8 ? 'Backtest' : index < 14 ? 'Forward Test' : 'Live',
      account_type: 'Demo',
      entry_model: `Example Model ${index % 2 ? 'B' : 'A'}`,
      trade_direction_type: index % 2 ? 'Reversal' : 'Trend Continuation',
      setup_quality: quality,
      rr: result === 'Take-Profit' ? profit : 1.5,
      profit_pct: profit,
      result,
      grade: quality,
      trading_rules: 'Demo checklist complete',
      risk_pct: '0.5',
      why_grade: 'Synthetic record created solely to demonstrate the portfolio interface.',
      psycho: '',
      review_lesson: '',
      emotions: '[]',
      confluence_tags: '["Fictional data","Portfolio demo"]',
      chart_images: '[]',
      dxy_chart_images: '[]',
      deleted_at: null,
    };
  });

  function filterTrades(trades, params) {
    return trades.filter(t => {
      if (t.deleted_at) return false;
      for (const [key, value] of Object.entries(params)) {
        if (!value || value === 'all') continue;
        if (String(t[key] || '').toLowerCase() !== String(value).toLowerCase()) return false;
      }
      return true;
    });
  }

  function computeStats(trades) {
    const active = trades.filter(t => !t.deleted_at);
    const wins = active.filter(t => t.result === 'Take-Profit');
    const losses = active.filter(t => t.result === 'Stop-Loss');
    const breakevens = active.filter(t => t.result === 'Breakeven');
    const totalProfit = active.reduce((sum, trade) => sum + (trade.profit_pct || 0), 0);
    const avgRR = wins.length ? wins.reduce((sum, trade) => sum + (trade.rr || 0), 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((sum, trade) => sum + Math.abs(trade.profit_pct || 0), 0) / losses.length : 1;
    const avgWin = wins.length ? wins.reduce((sum, trade) => sum + (trade.profit_pct || 0), 0) / wins.length : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length || 1) : 0;

    return {
      total_trades: active.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      win_rate: active.length ? ((wins.length / active.length) * 100).toFixed(1) : 0,
      total_profit_pct: totalProfit.toFixed(2),
      avg_rr: avgRR.toFixed(2),
      profit_factor: profitFactor.toFixed(2),
      expectancy: active.length ? (totalProfit / active.length).toFixed(2) : 0,
      by_session: {
        London: {
          wins: wins.filter(t => t.session === 'London').length,
          losses: losses.filter(t => t.session === 'London').length,
        },
        'New York': {
          wins: wins.filter(t => t.session === 'New York').length,
          losses: losses.filter(t => t.session === 'New York').length,
        },
      },
    };
  }

  const DEMO_RESPONSE = {
    error: 'Read-only public demo. No entries are saved.',
    demo: true,
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = function (url, options) {
    const path = typeof url === 'string' ? url : url.toString();
    const method = ((options && options.method) || 'GET').toUpperCase();

    if (!path.startsWith('/api/')) return originalFetch(url, options);

    if (path === '/api/tts') {
      return Promise.resolve(new Response(JSON.stringify(DEMO_RESPONSE), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return Promise.resolve(new Response(JSON.stringify(DEMO_RESPONSE), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    let data;
    if (path === '/api/stats') {
      data = computeStats(TRADES);
    } else if (path.startsWith('/api/trades/') && path.split('/').length === 4) {
      const id = parseInt(path.split('/')[3], 10);
      data = TRADES.find(trade => trade.id === id) || null;
      if (!data) {
        return Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }));
      }
    } else if (path.startsWith('/api/trades')) {
      const query = path.includes('?') ? path.split('?')[1] : '';
      data = filterTrades(TRADES, Object.fromEntries(new URLSearchParams(query)));
    } else if (path.startsWith('/api/trash')) {
      data = [];
    } else if (path.startsWith('/api/live')) {
      data = { connected: false, error: 'Account connections are disabled in the public demo.' };
    } else {
      data = {};
    }

    return Promise.resolve(new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  };
})();
