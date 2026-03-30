// KansoTrader Demo Mode — intercepts /api/ calls and returns sample data
// This file is only loaded on the GitHub Pages demo, not in local mode.
(function () {
  const TRADES = [
    { id: 1, trade_name: 'GBPUSD London Sweep + CHOCH', date: '2025-10-07', weekday: 'Tuesday', time_of_trade: '08:22', session: 'London', pairs: 'GBPUSD', position: 'Short', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'CHOCH', trade_direction_type: 'Trend Continuation', setup_quality: 'A+', rr: 2.4, profit_pct: 2.4, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', break_of_structure: 'Internal', why_grade: 'Clean sweep of BSL, immediate CHOCH, DXY confirmed bearish, perfect 5M OFC entry.', psycho: 'Very calm. Waited for all confluences.', review_lesson: 'This is what A+ looks like. Patience at key zone.', emotions: '["Focused","Confident"]', confluence_tags: '["BSL Swept","HTF Bearish","DXY Rising","London Open"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 2, trade_name: 'EURUSD NY Session BOS', date: '2025-10-09', weekday: 'Thursday', time_of_trade: '13:45', session: 'New York', pairs: 'EURUSD', position: 'Short', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'BOS', trade_direction_type: 'Trend Continuation', setup_quality: 'A', rr: 1.8, profit_pct: 1.8, result: 'Take-Profit', grade: 'A', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', why_grade: 'Good BOS on 15M, external path clear, RR met TP1.', psycho: 'Slightly anxious at entry but held the plan.', review_lesson: 'Trust the structure. External path was obvious on higher TF.', emotions: '["Focused","Slight Anxiety"]', confluence_tags: '["BOS Valid","External Path Clear","NY Killzone"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 3, trade_name: 'XAUUSD Asian Range Break', date: '2025-10-14', weekday: 'Tuesday', time_of_trade: '09:10', session: 'London', pairs: 'XAUUSD', position: 'Long', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'MSB', trade_direction_type: 'Reversal', setup_quality: 'B', rr: 1.3, profit_pct: -1.0, result: 'Stop-Loss', grade: 'B', trading_rules: 'Rules Followed', risk_pct: '0.5', why_grade: 'B-grade setup, one TF missing confluence. System loss.', psycho: 'Accepted the loss quickly. It was a valid B setup.', review_lesson: 'B setups lose more. Cut size on B entries.', emotions: '["Neutral","Accepting"]', confluence_tags: '["Asian Range","Partial Confluence"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 4, trade_name: 'GBPJPY London BOS Internal', date: '2025-10-16', weekday: 'Thursday', time_of_trade: '10:05', session: 'London', pairs: 'GBPJPY', position: 'Short', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'BOS', trade_direction_type: 'Trend Continuation', setup_quality: 'A+', rr: 3.1, profit_pct: 3.1, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', mtf_weak_structure: 'Yes', why_grade: 'A+ criteria all met. Swing high swept, internal BOS, clean run to target.', psycho: 'Completely calm throughout. No temptation to exit early.', review_lesson: 'Let winners run. Target was clear on 1H.', emotions: '["Focused","Disciplined"]', confluence_tags: '["SSL Swept","HTF Bearish","Internal BOS","Trend Day"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 5, trade_name: 'USDJPY NY Close CHOCH', date: '2025-10-21', weekday: 'Tuesday', time_of_trade: '14:30', session: 'New York', pairs: 'USDJPY', position: 'Long', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'CHOCH', trade_direction_type: 'Reversal', setup_quality: 'A', rr: 2.0, profit_pct: 2.0, result: 'Take-Profit', grade: 'A', trading_rules: 'Rules Followed', risk_pct: '1', why_grade: 'Clean CHOCH on 15M after HTF OB mitigation. DXY bullish aligning.', psycho: 'Confident in the setup. Held through minor pullback.', review_lesson: 'USDJPY respects DXY well. Use it more as confluence.', emotions: '["Confident","Focused"]', confluence_tags: '["HTF OB Mitigation","CHOCH","DXY Bullish"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 6, trade_name: 'EURUSD B-Grade Early Exit', date: '2025-10-23', weekday: 'Thursday', time_of_trade: '08:50', session: 'London', pairs: 'EURUSD', position: 'Long', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'CHOCH', setup_quality: 'B', rr: 1.4, profit_pct: 0.0, result: 'Breakeven', grade: 'B', trading_rules: 'Rules Broken', risk_pct: '1', why_grade: 'Moved to BE too early out of fear. Setup was valid, hit TP afterwards.', psycho: 'Impatient. Broke the BE rule early.', review_lesson: 'Do not move to BE unless criteria is met. Cost 1.4R.', emotions: '["Anxious","Impatient"]', confluence_tags: '["Partial Setup","Early BE"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 7, trade_name: 'GBPUSD NY Killzone Sweep', date: '2025-10-28', weekday: 'Tuesday', time_of_trade: '14:15', session: 'New York', pairs: 'GBPUSD', position: 'Long', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'Sweep', trade_direction_type: 'Reversal', setup_quality: 'A+', rr: 2.8, profit_pct: 2.8, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', mtf_weak_structure: 'Yes', why_grade: 'Perfect liquidity sweep at NY open, instant rejection, all TFs aligned.', psycho: 'In the zone. Process-driven.', review_lesson: 'NY killzone sweeps on GBPUSD are a high-probability setup.', emotions: '["In-the-zone","Confident"]', confluence_tags: '["SSL Swept","NY Killzone","HTF Bullish","Rejection Candle"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 8, trade_name: 'XAUUSD London Valid Loss', date: '2025-11-04', weekday: 'Tuesday', time_of_trade: '08:30', session: 'London', pairs: 'XAUUSD', position: 'Long', trade_type: 'Backtest', account_type: 'Demo', entry_model: 'BOS', setup_quality: 'A', rr: 2.0, profit_pct: -1.0, result: 'Stop-Loss', grade: 'A', trading_rules: 'Rules Followed', risk_pct: '1', why_grade: 'Valid A-grade. Price respected structure but DXY reversed against.', psycho: 'No emotional reaction. Accepted as system loss.', review_lesson: 'Bucket A loss. Do nothing. Edge is still intact.', emotions: '["Neutral","Disciplined"]', confluence_tags: '["BOS Valid","DXY Reversed","System Loss"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 9, trade_name: 'EURUSD Forward CHOCH Setup', date: '2025-11-11', weekday: 'Tuesday', time_of_trade: '08:45', session: 'London', pairs: 'EURUSD', position: 'Short', trade_type: 'Forward Test', account_type: 'Demo', entry_model: 'CHOCH', trade_direction_type: 'Trend Continuation', setup_quality: 'A+', rr: 2.2, profit_pct: 2.2, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', why_grade: 'Edge confirmed in forward test. Setup played out identically to backtest criteria.', psycho: 'More nervous than backtest, but held the plan.', review_lesson: 'Forward test builds real confidence. Edge is valid.', emotions: '["Focused","Slightly Nervous"]', confluence_tags: '["BSL Swept","CHOCH","DXY Bullish"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 10, trade_name: 'GBPJPY Forward BOS Internal', date: '2025-11-13', weekday: 'Thursday', time_of_trade: '09:30', session: 'London', pairs: 'GBPJPY', position: 'Short', trade_type: 'Forward Test', account_type: 'Demo', entry_model: 'BOS', trade_direction_type: 'Trend Continuation', setup_quality: 'A', rr: 1.9, profit_pct: -1.0, result: 'Stop-Loss', grade: 'A', trading_rules: 'Rules Followed', risk_pct: '1', why_grade: 'Valid execution. Price reversed from external TP zone unexpectedly.', psycho: 'Frustrated briefly, then reviewed objectively.', review_lesson: 'Bucket A. External liquidity was slightly misread. Review targeting.', emotions: '["Frustrated","Neutral after review"]', confluence_tags: '["BOS","Partial TP Miss"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 11, trade_name: 'GBPUSD Forward A+ Sweep NY', date: '2025-11-18', weekday: 'Tuesday', time_of_trade: '13:55', session: 'New York', pairs: 'GBPUSD', position: 'Long', trade_type: 'Forward Test', account_type: 'Demo', entry_model: 'Sweep', trade_direction_type: 'Reversal', setup_quality: 'A+', rr: 2.9, profit_pct: 2.9, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', mtf_weak_structure: 'Yes', why_grade: 'Cleanest forward trade yet. All 5 criteria met.', psycho: 'No hesitation. Trusted the checklist.', review_lesson: 'Checklist approach removing doubt at entry.', emotions: '["Confident","Focused"]', confluence_tags: '["SSL Swept","HTF Bullish","NY Open","Rejection Candle","DXY Bearish"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 12, trade_name: 'EURUSD Forward B Grade', date: '2025-11-20', weekday: 'Thursday', time_of_trade: '10:20', session: 'London', pairs: 'EURUSD', position: 'Long', trade_type: 'Forward Test', account_type: 'Demo', entry_model: 'CHOCH', setup_quality: 'B', rr: 1.5, profit_pct: 1.5, result: 'Take-Profit', grade: 'B', trading_rules: 'Rules Followed', risk_pct: '0.5', why_grade: 'B-grade, reduced size. Setup valid but one TF missing.', psycho: 'Disciplined with reduced size.', review_lesson: 'B wins at half size. Better than nothing.', emotions: '["Neutral","Disciplined"]', confluence_tags: '["Partial Confluence","Reduced Size"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 13, trade_name: 'USDJPY Forward Breakeven', date: '2025-11-25', weekday: 'Tuesday', time_of_trade: '08:10', session: 'London', pairs: 'USDJPY', position: 'Short', trade_type: 'Forward Test', account_type: 'Demo', entry_model: 'BOS', setup_quality: 'A', rr: 2.0, profit_pct: 0.0, result: 'Breakeven', grade: 'A', trading_rules: 'Rules Followed', risk_pct: '1', why_grade: 'Moved to BE at correct criteria. News spike invalidated trade.', psycho: 'Good BE management. Protected capital correctly.', review_lesson: 'Breakeven saved 1%. BE criteria working as intended.', emotions: '["Focused","Satisfied"]', confluence_tags: '["News Event","BE Managed"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 14, trade_name: 'GBPUSD Live A+ London Open', date: '2025-12-02', weekday: 'Tuesday', time_of_trade: '08:18', session: 'London', pairs: 'GBPUSD', position: 'Short', trade_type: 'Live', account_type: 'Funded', entry_model: 'CHOCH', trade_direction_type: 'Trend Continuation', setup_quality: 'A+', rr: 2.6, profit_pct: 2.6, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', mtf_weak_structure: 'Yes', why_grade: 'All 5 scoring criteria met. Best trade of the month. Clean execution.', psycho: 'No emotional interference. This is what execution mastery feels like.', review_lesson: 'A+ on funded means trusting the process under real pressure.', emotions: '["Focused","Disciplined","In-the-zone"]', confluence_tags: '["BSL Swept","CHOCH","DXY Bullish","London Open","Rejection Candle"]', dxy_direction: 'Bullish', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 15, trade_name: 'EURUSD Live Valid System Loss', date: '2025-12-04', weekday: 'Thursday', time_of_trade: '09:05', session: 'London', pairs: 'EURUSD', position: 'Long', trade_type: 'Live', account_type: 'Funded', entry_model: 'BOS', trade_direction_type: 'Reversal', setup_quality: 'A', rr: 2.0, profit_pct: -1.0, result: 'Stop-Loss', grade: 'A', trading_rules: 'Rules Followed', risk_pct: '1', why_grade: 'Full A criteria met. DXY reversed intraday invalidating setup.', psycho: 'Stayed calm. Did not revenge trade.', review_lesson: 'Bucket A. The process was correct. Variance is part of the game.', emotions: '["Calm","Accepting"]', confluence_tags: '["A-Grade Loss","DXY Reversed","Bucket A"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 16, trade_name: 'XAUUSD Live A+ NY Session', date: '2025-12-09', weekday: 'Tuesday', time_of_trade: '14:22', session: 'New York', pairs: 'XAUUSD', position: 'Long', trade_type: 'Live', account_type: 'Funded', entry_model: 'Sweep', trade_direction_type: 'Reversal', setup_quality: 'A+', rr: 3.2, profit_pct: 3.2, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', mtf_weak_structure: 'Yes', why_grade: 'Perfect trap on Gold. SSH swept, instant reversal, clean run.', psycho: 'Held the full position. No premature TP.', review_lesson: 'Gold sweeps at NY session open are high probability.', emotions: '["Focused","Patient","Disciplined"]', confluence_tags: '["SSH Swept","NY Open","HTF Bullish","DXY Bearish","Rejection Candle"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 17, trade_name: 'GBPJPY Live Execution Error', date: '2025-12-11', weekday: 'Thursday', time_of_trade: '08:55', session: 'London', pairs: 'GBPJPY', position: 'Short', trade_type: 'Live', account_type: 'Funded', entry_model: 'CHOCH', setup_quality: 'B', rr: 1.5, profit_pct: -1.0, result: 'Stop-Loss', grade: 'B', trading_rules: 'Rules Broken', risk_pct: '1', why_grade: 'Entered B-grade at full size. Broke the rule. Setup was marginal.', psycho: 'Overconfident after last win. Forced entry.', review_lesson: 'Bucket B error. B setups need half size. This was an execution error.', emotions: '["Overconfident","Regret"]', confluence_tags: '["B-Grade Full Size","Rules Broken","Bucket B"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 18, trade_name: 'EURUSD Live Clean A+', date: '2025-12-16', weekday: 'Tuesday', time_of_trade: '08:35', session: 'London', pairs: 'EURUSD', position: 'Short', trade_type: 'Live', account_type: 'Funded', entry_model: 'CHOCH', trade_direction_type: 'Trend Continuation', setup_quality: 'A+', rr: 2.4, profit_pct: 2.4, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', why_grade: 'Textbook A+. Waited 2 days for this setup. Patience rewarded.', psycho: 'Patient, composed, no FOMO the whole week.', review_lesson: 'Quality > quantity. Waiting is trading.', emotions: '["Patient","Focused","Satisfied"]', confluence_tags: '["BSL Swept","CHOCH","London Open","DXY Bullish"]', dxy_direction: 'Bullish', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 19, trade_name: 'GBPUSD Live BE Trade', date: '2025-12-18', weekday: 'Thursday', time_of_trade: '13:40', session: 'New York', pairs: 'GBPUSD', position: 'Long', trade_type: 'Live', account_type: 'Funded', entry_model: 'BOS', setup_quality: 'A', rr: 2.0, profit_pct: 0.0, result: 'Breakeven', grade: 'A', trading_rules: 'Rules Followed', risk_pct: '1', why_grade: 'BE on correct criteria. NFP was approaching, stopped out at 0.', psycho: 'Managed risk correctly. Protected capital.', review_lesson: 'Good risk management. BE when news approaching.', emotions: '["Neutral","Disciplined"]', confluence_tags: '["News Risk","BE Managed","Capital Protected"]', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
    { id: 20, trade_name: 'USDJPY Live Final Win of Year', date: '2025-12-23', weekday: 'Tuesday', time_of_trade: '09:00', session: 'London', pairs: 'USDJPY', position: 'Long', trade_type: 'Live', account_type: 'Funded', entry_model: 'MSB', trade_direction_type: 'Reversal', setup_quality: 'A+', rr: 2.7, profit_pct: 2.7, result: 'Take-Profit', grade: 'A+', trading_rules: 'Rules Followed', risk_pct: '1', htf_weak_structure: 'Yes', mtf_weak_structure: 'Yes', why_grade: 'Perfect close to the year. Disciplined, patient, executed perfectly.', psycho: 'End of year calmness. No pressure. Pure execution.', review_lesson: 'End the year the same way you want to trade all year.', emotions: '["Peaceful","Disciplined","Grateful"]', confluence_tags: '["MSB","HTF Reversal","DXY Bullish","Trend Shift"]', dxy_direction: 'Bullish', chart_images: '[]', dxy_chart_images: '[]', deleted_at: null },
  ];

  function filterTrades(trades, params) {
    return trades.filter(t => {
      if (t.deleted_at) return false;
      for (const [k, v] of Object.entries(params)) {
        if (!v || v === 'all') continue;
        if (String(t[k] || '').toLowerCase() !== String(v).toLowerCase()) return false;
      }
      return true;
    });
  }

  function computeStats(trades) {
    const active = trades.filter(t => !t.deleted_at);
    const wins = active.filter(t => t.result === 'Take-Profit');
    const losses = active.filter(t => t.result === 'Stop-Loss');
    const be = active.filter(t => t.result === 'Breakeven');
    const totalProfit = active.reduce((s, t) => s + (t.profit_pct || 0), 0);
    const avgRR = wins.length ? (wins.reduce((s, t) => s + (t.rr || 0), 0) / wins.length) : 0;
    const avgLoss = losses.length ? (losses.reduce((s, t) => s + Math.abs(t.profit_pct || 0), 0) / losses.length) : 1;
    const avgWin = wins.length ? (wins.reduce((s, t) => s + (t.profit_pct || 0), 0) / wins.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length || 1) : 0;
    return {
      total_trades: active.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: be.length,
      win_rate: active.length ? ((wins.length / active.length) * 100).toFixed(1) : 0,
      total_profit_pct: totalProfit.toFixed(2),
      avg_rr: avgRR.toFixed(2),
      profit_factor: profitFactor.toFixed(2),
      expectancy: active.length ? (totalProfit / active.length).toFixed(2) : 0,
      by_session: {
        London: { wins: wins.filter(t => t.session === 'London').length, losses: losses.filter(t => t.session === 'London').length },
        'New York': { wins: wins.filter(t => t.session === 'New York').length, losses: losses.filter(t => t.session === 'New York').length },
      },
    };
  }

  const DEMO_RESP = { error: 'Read-only demo. Download the app locally to add your own trades.', demo: true };

  const _fetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    const path = typeof url === 'string' ? url : url.toString();
    const method = (opts && opts.method || 'GET').toUpperCase();

    if (!path.startsWith('/api/')) return _fetch(url, opts);

    // Block writes
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return Promise.resolve(new Response(JSON.stringify(DEMO_RESP), { status: 403, headers: { 'Content-Type': 'application/json' } }));
    }

    let data;
    if (path === '/api/stats') {
      data = computeStats(TRADES);
    } else if (path.startsWith('/api/trades/') && path.split('/').length === 4) {
      const id = parseInt(path.split('/')[3]);
      data = TRADES.find(t => t.id === id) || null;
      if (!data) return Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }));
    } else if (path.startsWith('/api/trades')) {
      const qStr = path.includes('?') ? path.split('?')[1] : '';
      const params = Object.fromEntries(new URLSearchParams(qStr));
      data = filterTrades(TRADES, params);
    } else if (path.startsWith('/api/trash')) {
      data = [];
    } else if (path.startsWith('/api/live')) {
      data = { connected: false, error: 'MT5 not available in demo' };
    } else {
      data = {};
    }

    return Promise.resolve(new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };
})();
