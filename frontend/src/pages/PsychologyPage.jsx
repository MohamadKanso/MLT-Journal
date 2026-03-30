import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wind, Brain, BookOpen, Leaf, AlertTriangle, CheckCircle2,
  XCircle, HelpCircle, ChevronRight, RefreshCw, Quote,
  Heart, TrendingUp, Shield, Zap, Circle,
  Sun, Target, Play, Square, Volume2, Mic
} from 'lucide-react';
import './PsychologyPage.css';

// ─── Philosopher quotes curated for trading psychology ───────────────────────
const QUOTES = [
  { text: "You have power over your mind, not outside events. Realise this, and you will find strength.", author: "Marcus Aurelius", work: "Meditations" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", work: "Meditations" },
  { text: "Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.", author: "Marcus Aurelius", work: "Meditations" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius", work: "Meditations" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus", work: "Enchiridion" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus", work: "Enchiridion" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", work: "Letters from a Stoic" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca", work: "Letters from a Stoic" },
  { text: "If you really want to escape the things that harass you, what you need is not to be in a different place but to be a different person.", author: "Seneca", work: "Letters from a Stoic" },
  { text: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", author: "Epictetus", work: "Discourses" },
  { text: "Do nothing which is of no use.", author: "Miyamoto Musashi", work: "The Book of Five Rings" },
  { text: "Think lightly of yourself and deeply of the world.", author: "Miyamoto Musashi", work: "The Book of Five Rings" },
  { text: "Today is victory over yourself of yesterday; tomorrow is your victory over lesser men.", author: "Miyamoto Musashi", work: "The Book of Five Rings" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "The Buddha", work: "Dhammapada" },
  { text: "Peace comes from within. Do not seek it without.", author: "The Buddha", work: "Dhammapada" },
  { text: "Well-being is realised by small steps, but is truly no small thing.", author: "Zeno of Citium", work: "Fragments" },
  { text: "This is the real secret of life — to be completely engaged with what you are doing in the here and now.", author: "Alan Watts", work: "The Wisdom of Insecurity" },
  { text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday", work: "The Obstacle Is the Way" },
  { text: "Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.", author: "Epictetus", work: "Enchiridion" },
  { text: "The quality of your life is determined by the quality of your attention.", author: "Jiddu Krishnamurti", work: "Freedom from the Known" },
  { text: "He who is brave is free.", author: "Seneca", work: "Letters from a Stoic" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", work: "De Beneficiis" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", work: "Discourses" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius", work: "Meditations" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus", work: "Discourses" },
  { text: "If it is not right, do not do it; if it is not true, do not say it.", author: "Marcus Aurelius", work: "Meditations" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James", work: "Principles of Psychology" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl", work: "Man's Search for Meaning" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", work: "" },
  { text: "A man who has not passed through the inferno of his passions has never overcome them.", author: "Carl Jung", work: "Memories, Dreams, Reflections" },
];

// ─── Your Bucket A/B/C system from your Trading Plan Notion page ─────────────
const BUCKETS = [
  {
    id: 'A',
    icon: CheckCircle2,
    color: 'green',
    label: 'Bucket A — System Loss',
    when: 'Losing day or week, but trades were clean.',
    criteria: ['Rules followed', 'A / A+ entries only', 'Risk correct', 'No hesitation or FOMO', 'Losses cluster normally'],
    evidence: 'Same week · 5–10 trades max',
    conclusion: 'Variance',
    action: ['Do nothing', 'Keep trading', 'Log as Valid Loss', 'Protect mental capital'],
    actionLabel: 'Continue',
  },
  {
    id: 'B',
    icon: AlertTriangle,
    color: 'amber',
    label: 'Bucket B — Execution Error',
    when: 'Losing results and mistakes are showing.',
    criteria: ['Hesitation', 'Early exits', 'Skipped valid trades', 'Forced trades', 'Emotional BE moves'],
    evidence: '2+ trades with the same mistake · Within 1 week',
    conclusion: 'This is you',
    action: ['Freeze strategy changes', 'Fix execution only', 'Add ONE constraint', 'Forward test only'],
    actionLabel: 'Adjust',
  },
  {
    id: 'C',
    icon: XCircle,
    color: 'red',
    label: 'Bucket C — Edge Mismatch',
    when: 'Clean execution but performance degrading.',
    criteria: ['Same setup failing', 'Same session underperforming', 'RR compression', 'Structure not expanding'],
    evidence: '20–30 trades · Multiple weeks · Same conditions',
    conclusion: 'Possible edge issue',
    action: ['Do NOT panic', 'Narrow rules', 'Remove one condition', 'Forward test only'],
    actionLabel: 'Review Edge',
  },
  {
    id: '?',
    icon: HelpCircle,
    color: 'muted',
    label: 'Unclassified',
    when: 'Mid-week / emotional / unclear.',
    criteria: ['Sample too small', 'Emotions high', 'Mixed signals'],
    evidence: 'Too early · Mid-week · <5 trades',
    conclusion: 'No conclusion allowed',
    action: ['Reduce activity', 'Observe only', 'Wait for review window'],
    actionLabel: 'Wait',
  },
];

// ─── Cognitive distortions from your "Less Stress" Notion page ───────────────
const DISTORTIONS = [
  { trap: 'Catastrophising',    mind: 'Jumping to the worst possible outcome', fix: "Ask: what's the most likely outcome?" },
  { trap: 'Black-and-White',    mind: 'All or nothing, no middle ground',       fix: 'Look for the grey area' },
  { trap: 'Mind Reading',       mind: 'Assuming you know what others think',     fix: 'Ask: do I have actual evidence?' },
  { trap: 'Fortune Telling',    mind: 'Predicting the future negatively',        fix: 'Feelings are not facts' },
  { trap: 'Should Statements',  mind: 'Rigid rules about how things must be',   fix: 'Replace "should" with "I\'d prefer"' },
  { trap: 'Emotional Reasoning',mind: 'Feeling it, so it must be true',          fix: "Just because I feel it doesn't make it real" },
  { trap: 'Overgeneralisation', mind: '"Always" and "never" thinking',           fix: 'Find one exception' },
  { trap: 'Personalising',      mind: "Taking blame for things that aren't yours", fix: 'Ask: is this actually about me?' },
];

// ─── Guided meditation sessions ──────────────────────────────────────────────
const MEDITATION_SESSIONS = [
  {
    id: 'grounding',
    title: 'Pre-Trade Grounding',
    duration: '2 min',
    description: 'Centre yourself before entering the market',
    icon: Target,
    script: [
      { text: 'Close your eyes. Breathe in slowly...', pause: 3800 },
      { text: 'And release. Let your shoulders drop.', pause: 3000 },
      { text: 'The market is just data. You are the one who interprets it.', pause: 3500 },
      { text: 'How are you feeling right now? Be honest.', pause: 4000 },
      { text: 'Your job today is clean execution. Not profit. Execution.', pause: 3500 },
      { text: 'One trade. One setup. One decision at a time.', pause: 3200 },
      { text: 'Breathe in...', pause: 3500 },
      { text: 'And breathe out.', pause: 3000 },
      { text: 'Your rules protect you. Follow them completely.', pause: 3500 },
      { text: 'Open your eyes. Trade with clarity.', pause: 2000 },
    ],
  },
  {
    id: 'box_breath_voice',
    title: 'Guided Box Breathing',
    duration: '4 min',
    description: 'Navy SEAL technique — 4 counts each phase',
    icon: Wind,
    script: [
      { text: 'Settle in. Relax your shoulders and soften your jaw.', pause: 2500 },
      { text: 'Box breathing. Four counts in, four hold, four out, four hold.', pause: 2500 },
      { text: 'Breathe in now... one... two... three... four.', pause: 1200 },
      { text: 'Hold... one... two... three... four.', pause: 1200 },
      { text: 'Breathe out slowly... one... two... three... four.', pause: 1200 },
      { text: 'Hold... one... two... three... four.', pause: 1500 },
      { text: 'Again. In... one... two... three... four.', pause: 1200 },
      { text: 'Hold... one... two... three... four.', pause: 1200 },
      { text: 'Out... one... two... three... four.', pause: 1200 },
      { text: 'Hold... one... two... three... four.', pause: 1500 },
      { text: 'Last round. Breathe in deeply... one... two... three... four.', pause: 1200 },
      { text: 'Hold... one... two... three... four.', pause: 1200 },
      { text: 'Breathe out completely... one... two... three... four.', pause: 1200 },
      { text: 'Hold... one... two... three... four.', pause: 2000 },
      { text: 'Your nervous system is regulated. You are calm, present, and ready.', pause: 2000 },
    ],
  },
  {
    id: 'post_loss',
    title: 'Post-Loss Reset',
    duration: '3 min',
    description: 'Clear the emotional charge and return to baseline',
    icon: Shield,
    script: [
      { text: 'Stop. Step away from the screen right now.', pause: 3000 },
      { text: 'The loss is already done. It lives in the past, not in this moment.', pause: 3500 },
      { text: 'Breathe in through your nose...', pause: 3500 },
      { text: 'And slowly out through your mouth.', pause: 3000 },
      { text: 'Ask yourself honestly — did you follow your rules on that trade?', pause: 4000 },
      { text: 'If yes, this is normal variance. You executed correctly. The loss is valid.', pause: 3500 },
      { text: 'If no, note the one specific mistake. Then let it go.', pause: 3500 },
      { text: 'Breathe in again...', pause: 3500 },
      { text: 'And release.', pause: 3000 },
      { text: 'You are not your last trade. You are your consistency over time.', pause: 3500 },
      { text: 'The market will be here tomorrow. Return only when you are neutral.', pause: 3000 },
    ],
  },
  {
    id: 'morning',
    title: 'Morning Intention',
    duration: '2 min',
    description: 'Prime your mindset before the session opens',
    icon: Sun,
    script: [
      { text: 'Good morning. Take one slow breath in... and release.', pause: 4000 },
      { text: 'Today you trade your system. Not your emotions.', pause: 3000 },
      { text: 'Your only goal today is clean execution. Not profit. Execution.', pause: 3500 },
      { text: 'The money follows the process. Trust that.', pause: 3000 },
      { text: 'What is your bias today? Lock it in.', pause: 3500 },
      { text: 'If a setup does not meet your criteria, you skip it. That is discipline.', pause: 3500 },
      { text: 'You are a professional. Measured, calm, and precise.', pause: 3000 },
      { text: 'Open your charts when you are ready.', pause: 2000 },
    ],
  },
  {
    id: 'gratitude',
    title: 'Gratitude Reset',
    duration: '2 min',
    description: 'Shift from scarcity to a growth mindset',
    icon: Heart,
    script: [
      { text: 'Sit quietly. Let your breathing slow on its own.', pause: 4000 },
      { text: 'Think of one thing that went well this week, however small.', pause: 4000 },
      { text: 'Think of one skill you have improved in your trading.', pause: 4000 },
      { text: 'The market tests your discipline. That is its only job.', pause: 3500 },
      { text: 'You chose to build this skill. That takes courage.', pause: 3500 },
      { text: 'Breathe in, and feel gratitude for being on this path.', pause: 4000 },
      { text: 'Breathe out, and release anything that does not serve you.', pause: 4000 },
      { text: 'Trust the process. You are building something real.', pause: 2500 },
    ],
  },
];

// ─── Voice Guide — Microsoft Neural TTS via edge-tts backend (en-US-AriaNeural)
const TTS_VOICE = 'en-US-AriaNeural';

function VoiceGuide() {
  const [activeSess, setActiveSess] = useState(null);
  const [status,     setStatus]     = useState('idle');   // idle | loading | playing | done
  const [phraseIdx,  setPhraseIdx]  = useState(-1);

  const statusRef  = useRef('idle');
  const audioRef   = useRef(null);
  const timerRef   = useRef(null);

  // Clean up audio + timers
  const stopAll = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
    clearTimeout(timerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => () => { stopAll(); statusRef.current = 'idle'; }, [stopAll]);

  // Web Speech API fallback — uses best available neural/Microsoft/Google voice
  const speakWebSpeech = (text) => new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = 0.88;
    utter.pitch = 1;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const best = voices.find(v => v.name.includes('Neural') && v.lang.startsWith('en'))
        || voices.find(v => v.name.includes('Microsoft') && v.lang.startsWith('en'))
        || voices.find(v => v.name === 'Google US English')
        || voices.find(v => v.lang === 'en-US')
        || voices.find(v => v.lang.startsWith('en'));
      if (best) utter.voice = best;
      utter.onend  = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    };
    // Voices may not be ready yet on first call
    if (window.speechSynthesis.getVoices().length) { pick(); }
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; pick(); }; }
  });

  // Speak one phrase: try backend edge-tts (Microsoft Aria Neural), fall back to Web Speech API
  const speakPhrase = useCallback(async (sess, idx) => {
    if (statusRef.current !== 'playing') return;
    if (idx >= sess.script.length) {
      statusRef.current = 'done';
      setStatus('done');
      setPhraseIdx(sess.script.length);
      return;
    }
    setPhraseIdx(idx);
    const { text, pause = 1800 } = sess.script[idx];

    let spoken = false;

    // 1. Try backend edge-tts (Microsoft Aria Neural — best quality)
    try {
      const res = await fetch('/api/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text, voice: TTS_VOICE }),
      });
      if (res.ok) {
        const blob = await res.blob();
        if (statusRef.current !== 'playing') return;
        const url   = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        await new Promise((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(resolve);
        });
        spoken = true;
      }
    } catch { /* fall through */ }

    // 2. Fall back to Web Speech API (works in demo / when edge-tts not installed)
    if (!spoken && 'speechSynthesis' in window) {
      if (statusRef.current !== 'playing') return;
      await speakWebSpeech(text);
      spoken = true;
    }

    if (statusRef.current !== 'playing') return;
    timerRef.current = setTimeout(() => speakPhrase(sess, idx + 1), pause);
  }, []);

  const start = (sess) => {
    stopAll();
    statusRef.current = 'playing';
    setActiveSess(sess);
    setStatus('playing');
    setPhraseIdx(0);
    speakPhrase(sess, 0);
  };

  const stop = () => {
    stopAll();
    statusRef.current = 'idle';
    setStatus('idle');
    setActiveSess(null);
    setPhraseIdx(-1);
  };

  const progress = activeSess && phraseIdx >= 0
    ? Math.round((phraseIdx / activeSess.script.length) * 100) : 0;
  const currentPhrase = activeSess && phraseIdx >= 0 && phraseIdx < activeSess.script.length
    ? activeSess.script[phraseIdx].text : null;

  if (status === 'idle') {
    return (
      <div className="voice-guide">
        <div className="vg-voice-row">
          <Volume2 size={12}/>
          <span>Microsoft Aria · Neural TTS</span>
        </div>
        <div className="voice-sessions">
          {MEDITATION_SESSIONS.map(sess => (
            <button key={sess.id} className="voice-session-card" onClick={() => start(sess)}>
              <div className="vsc-icon"><sess.icon size={18}/></div>
              <div className="vsc-body">
                <span className="vsc-title">{sess.title}</span>
                <span className="vsc-meta">{sess.duration} · {sess.description}</span>
              </div>
              <Play size={14} className="vsc-play"/>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="voice-guide">
      <div className="voice-active">
        <div className="va-header">
          <span className="va-session-name">{activeSess.title}</span>
          <span className="va-status">{status === 'done' ? 'Complete' : 'Guiding'}</span>
        </div>
        <div className="va-progress-track">
          <div className="va-progress-fill" style={{ width: `${status === 'done' ? 100 : progress}%` }}/>
        </div>
        <div className="va-orb-wrap">
          <div className={`va-orb ${status === 'playing' ? 'va-orb-pulse' : 'va-orb-done'}`}>
            {status === 'done' ? '✓' : <Volume2 size={18}/>}
          </div>
        </div>
        <div className="va-phrase-display">
          {status === 'playing' && currentPhrase && (
            <p className="va-current-phrase">"{currentPhrase}"</p>
          )}
          {status === 'done' && (
            <p className="va-done-msg">Session complete. Take a breath. You're ready.</p>
          )}
        </div>
        <div className="va-dots">
          {activeSess.script.map((_, i) => (
            <span key={i} className={`va-dot ${i < phraseIdx ? 'past' : i === phraseIdx ? 'active' : ''}`}/>
          ))}
        </div>
        <button className="va-stop-btn" onClick={stop}>
          <Square size={12}/> {status === 'done' ? 'Choose Another' : 'Stop'}
        </button>
      </div>
    </div>
  );
}

// ─── Box breathing phases ─────────────────────────────────────────────────────
const BREATH_PHASES = [
  { label: 'Inhale',  secs: 4, color: 'var(--nt-blue)',   scale: 1.0 },
  { label: 'Hold',    secs: 4, color: 'var(--nt-amber)',  scale: 1.0 },
  { label: 'Exhale',  secs: 4, color: 'var(--nt-green)',  scale: 0.7 },
  { label: 'Hold',    secs: 4, color: 'var(--nt-text-muted)', scale: 0.7 },
];

function BoxBreath() {
  const [running, setRunning]       = useState(false);
  const [phase,   setPhase]         = useState(0);
  const [tick,    setTick]          = useState(4);
  const [cycles,  setCycles]        = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTick(t => {
        if (t <= 1) {
          setPhase(p => {
            const next = (p + 1) % 4;
            if (next === 0) setCycles(c => c + 1);
            return next;
          });
          return BREATH_PHASES[(phase + 1) % 4].secs;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase]);

  const cur = BREATH_PHASES[phase];

  const stop = () => {
    setRunning(false);
    setPhase(0);
    setTick(4);
  };

  return (
    <div className="breath-container">
      <div
        className={`breath-circle ${running ? (phase === 0 || phase === 1 ? 'breath-expand' : 'breath-contract') : ''}`}
        style={{ '--breath-color': cur.color }}
      >
        <div className="breath-inner">
          <span className="breath-phase">{running ? cur.label : '◦'}</span>
          {running && <span className="breath-count">{tick}</span>}
        </div>
      </div>
      <div className="breath-controls">
        {!running
          ? <button className="btn-breath-start" onClick={() => setRunning(true)}>Begin</button>
          : <button className="btn-breath-stop"  onClick={stop}>Stop</button>
        }
        {cycles > 0 && <span className="breath-cycles">{cycles} cycle{cycles > 1 ? 's' : ''}</span>}
      </div>
      <div className="breath-legend">
        {BREATH_PHASES.map((p, i) => (
          <div key={i} className={`breath-leg-item ${running && i === phase ? 'active' : ''}`}>
            <div className="breath-leg-dot" style={{ background: p.color }}/>
            <span>{p.label} {p.secs}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PsychologyPage() {
  const [quoteIdx, setQuoteIdx] = useState(() => {
    const d = new Date();
    return (d.getDate() + d.getMonth() * 31) % QUOTES.length;
  });
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [stressInput,    setStressInput]    = useState('');
  const [stressControl,  setStressControl]  = useState(null); // 'yes' | 'no' | 'partial'
  const [activeTab,      setActiveTab]      = useState('overview'); // overview | buckets | breath | distortions | library
  const [emotionStats,   setEmotionStats]   = useState({});

  // Load emotion data from trades
  useEffect(() => {
    fetch('/api/trades')
      .then(r => r.json())
      .then(trades => {
        const counts = {};
        trades.forEach(t => {
          try {
            const ems = JSON.parse(t.emotions || '[]');
            ems.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
          } catch {}
        });
        setEmotionStats(counts);
      })
      .catch(() => {});
  }, []);

  const nextQuote = () => setQuoteIdx(i => (i + 1) % QUOTES.length);
  const q = QUOTES[quoteIdx];
  const topEmotions = Object.entries(emotionStats).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalEmotionLogs = Object.values(emotionStats).reduce((a, b) => a + b, 0);

  return (
    <div className="psych-page animate-fade-up">

      {/* ── Header ── */}
      <div className="psych-header">
        <div className="psych-title-block">
          <span className="psych-label">// mindset & philosophy</span>
          <h2>Psychology</h2>
          <p className="psych-subtitle">Your inner edge. Where mastery begins.</p>
        </div>
      </div>

      {/* ── Daily Quote ── */}
      <div className="quote-card">
        <div className="quote-glyph"><Quote size={18}/></div>
        <blockquote className="quote-text">"{q.text}"</blockquote>
        <div className="quote-attribution">
          <span className="quote-author">— {q.author}</span>
          {q.work && <span className="quote-work">{q.work}</span>}
        </div>
        <button className="btn-next-quote" onClick={nextQuote}>
          <RefreshCw size={12}/> New quote
        </button>
      </div>

      {/* ── Tab nav ── */}
      <div className="psych-tabs">
        {[
          { id: 'overview',     label: 'Overview',       icon: Leaf },
          { id: 'buckets',      label: 'Bucket Check',   icon: Brain },
          { id: 'voice',        label: 'Voice Guide',    icon: Volume2 },
          { id: 'breath',       label: 'Breathe',        icon: Wind },
          { id: 'distortions',  label: 'Cognitive Traps',icon: Zap },
          { id: 'library',      label: 'Philosophy',     icon: BookOpen },
        ].map(t => (
          <button
            key={t.id}
            className={`psych-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={14}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: OVERVIEW ═══ */}
      {activeTab === 'overview' && (
        <div className="tab-content animate-fade-up">

          <div className="psych-two-col">

            {/* Stress classifier */}
            <div className="psych-card">
              <div className="psych-card-title"><Shield size={14}/> Stress Classifier</div>
              <p className="psych-card-sub">What's on your mind right now?</p>
              <textarea
                className="stress-input"
                placeholder="Write the stressor here..."
                value={stressInput}
                onChange={e => setStressInput(e.target.value)}
                rows={3}
              />
              <div className="stress-control-q">Can I control this?</div>
              <div className="stress-control-btns">
                {['yes','partial','no'].map(v => (
                  <button
                    key={v}
                    className={`stress-btn stress-${v} ${stressControl === v ? 'active' : ''}`}
                    onClick={() => setStressControl(v)}
                  >
                    {v === 'yes' ? '✓ Yes' : v === 'partial' ? '~ Partial' : '✗ No'}
                  </button>
                ))}
              </div>
              {stressControl && (
                <div className={`stress-result stress-result-${stressControl}`}>
                  {stressControl === 'yes' && (
                    <><CheckCircle2 size={14}/> <strong>Signal.</strong> Break it into action steps and execute.</>
                  )}
                  {stressControl === 'no' && (
                    <><XCircle size={14}/> <strong>Noise.</strong> Find the distorted thought and rewrite it.</>
                  )}
                  {stressControl === 'partial' && (
                    <><HelpCircle size={14}/> <strong>Split it.</strong> Actions for what you control · Rewrite for what you don't.</>
                  )}
                </div>
              )}
            </div>

            {/* Emotion pattern */}
            <div className="psych-card">
              <div className="psych-card-title"><Heart size={14}/> Emotion Pattern</div>
              <p className="psych-card-sub">From {totalEmotionLogs} logged emotions across all trades</p>
              {topEmotions.length === 0 ? (
                <div className="emotion-empty">No emotions logged yet. Add them in the journal.</div>
              ) : (
                <div className="emotion-bars">
                  {topEmotions.map(([name, count]) => (
                    <div key={name} className="emotion-bar-row">
                      <span className="emotion-bar-label">{name}</span>
                      <div className="emotion-bar-track">
                        <div
                          className="emotion-bar-fill"
                          style={{ width: `${Math.round((count / topEmotions[0][1]) * 100)}%` }}
                        />
                      </div>
                      <span className="emotion-bar-count">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rules recap */}
          <div className="psych-card rules-recap">
            <div className="psych-card-title"><TrendingUp size={14}/> Your Non-Negotiable Rules</div>
            <div className="rules-grid">
              {[
                { rule: 'RR ≥ 1.25',           note: 'minimum to weak target' },
                { rule: '1% risk per trade',    note: 'or 0.25% when uncertain' },
                { rule: 'Max 4 trades / week',  note: 'quality over quantity' },
                { rule: 'No news trades',       note: '1H before & after major' },
                { rule: 'Score < 2.5 → no trade', note: 'grading: DXY, alignment, model, 5M OF, targets' },
                { rule: 'B+ setups only',       note: 'A/A+ is always first choice' },
                { rule: 'No target/trend gate → no trade', note: 'clean path required' },
                { rule: 'Only A/A+ on funded',  note: 'forward test when unclear' },
              ].map((r, i) => (
                <div key={i} className="rule-chip">
                  <span className="rule-text">{r.rule}</span>
                  <span className="rule-note">{r.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: BUCKET A/B/C ═══ */}
      {activeTab === 'buckets' && (
        <div className="tab-content animate-fade-up">
          <div className="bucket-intro">
            <p>Use this when you're in drawdown, on a losing streak, or feeling emotionally reactive. Classify before reacting.</p>
          </div>
          <div className="buckets-grid">
            {BUCKETS.map(b => (
              <div
                key={b.id}
                className={`bucket-card bucket-${b.color} ${selectedBucket === b.id ? 'selected' : ''}`}
                onClick={() => setSelectedBucket(selectedBucket === b.id ? null : b.id)}
              >
                <div className="bucket-header">
                  <b.icon size={18}/>
                  <div>
                    <div className="bucket-id">{b.id}</div>
                    <div className="bucket-label">{b.label.replace(/Bucket [A-Z?] — /, '')}</div>
                  </div>
                </div>
                <p className="bucket-when">{b.when}</p>
                {selectedBucket === b.id && (
                  <div className="bucket-expanded animate-fade-up">
                    <div className="bucket-section">
                      <span className="bucket-section-title">Key criteria</span>
                      <ul>{b.criteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                    <div className="bucket-section">
                      <span className="bucket-section-title">Evidence required</span>
                      <p>{b.evidence}</p>
                    </div>
                    <div className="bucket-section">
                      <span className="bucket-section-title">Conclusion</span>
                      <p className="bucket-conclusion">{b.conclusion}</p>
                    </div>
                    <div className="bucket-section">
                      <span className="bucket-section-title">What to do</span>
                      <ul>{b.action.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                    <div className={`bucket-cta bucket-cta-${b.color}`}>
                      <ChevronRight size={13}/> {b.actionLabel}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: VOICE GUIDE ═══ */}
      {activeTab === 'voice' && (
        <div className="tab-content animate-fade-up">
          <div className="voice-tab-intro">
            <div className="voice-tab-title"><Volume2 size={14}/> Voice-Guided Meditation</div>
            <p>Select a session and let the voice guide bring you into focus. These sessions are designed specifically for traders — before trades, after losses, and as daily rituals.</p>
          </div>
          <VoiceGuide/>
        </div>
      )}

      {/* ═══ TAB: BOX BREATHING ═══ */}
      {activeTab === 'breath' && (
        <div className="tab-content animate-fade-up">
          <div className="breath-page">
            <div className="breath-intro">
              <p>Box breathing (4-4-4-4) activates the parasympathetic nervous system. Use before entering a trade, after a loss, or any moment of reactive emotion.</p>
            </div>
            <BoxBreath />
            <div className="breath-tips">
              {[
                { icon: '◦', tip: 'Sit comfortably. Relax your jaw and shoulders.' },
                { icon: '◦', tip: 'Focus only on the count. Let thoughts pass.' },
                { icon: '◦', tip: 'Do 3–5 cycles before reviewing a trade setup.' },
                { icon: '◦', tip: 'Emotion is information, not instruction.' },
              ].map((t, i) => (
                <div key={i} className="breath-tip">
                  <span className="breath-tip-dot">{t.icon}</span>
                  <span>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: COGNITIVE DISTORTIONS ═══ */}
      {activeTab === 'distortions' && (
        <div className="tab-content animate-fade-up">
          <div className="distortion-intro">
            <p>These are the mental traps that cost you trades — not the market. Identify which one is running when you feel reactive.</p>
          </div>
          <div className="distortions-list">
            {DISTORTIONS.map((d, i) => (
              <div key={i} className="distortion-row">
                <div className="distortion-trap">{d.trap}</div>
                <div className="distortion-mind">{d.mind}</div>
                <ChevronRight size={13} className="distortion-arrow"/>
                <div className="distortion-fix">{d.fix}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: PHILOSOPHY LIBRARY ═══ */}
      {activeTab === 'library' && (
        <div className="tab-content animate-fade-up">
          <div className="library-grid">
            {['Marcus Aurelius','Epictetus','Seneca','Miyamoto Musashi','The Buddha','Alan Watts','Viktor Frankl','Zeno of Citium'].map(author => {
              const authorQuotes = QUOTES.filter(q => q.author === author);
              if (!authorQuotes.length) return null;
              return (
                <div key={author} className="library-card">
                  <div className="library-author">{author}</div>
                  <div className="library-works">
                    {[...new Set(authorQuotes.map(q => q.work).filter(Boolean))].join(' · ')}
                  </div>
                  <div className="library-quotes">
                    {authorQuotes.map((q, i) => (
                      <p key={i} className="library-quote">"{q.text}"</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
