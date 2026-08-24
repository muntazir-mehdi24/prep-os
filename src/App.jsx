import React, { useState, useEffect } from 'react';
import { 
  Plus, Target, Layers, Trash2, Check, X, BookOpen, ClipboardList, 
  ListChecks, Activity, Download, Upload, Flame, Newspaper, Brain, 
  ArrowRight, ShieldAlert, Sparkles, Clock, AlertTriangle, Eye, EyeOff 
} from 'lucide-react';
import { getKey, setKey } from './supabaseClient';

const EXAM_DATES = { AFCAT: '2027-01-31', CDS: '2027-04-11', CAPF: '2027-07-15', CGL: '2027-08-15' };
const SUBJECTS = ['Reasoning', 'Quant', 'Polity', 'History', 'Geography', 'Science', 'Economy', 'Current Affairs', 'English', 'Writing'];
const EXAMS = ['SSC', 'CDS', 'AFCAT', 'CAPF'];
const ERROR_TYPES = ['conceptual', 'calculation', 'silly', 'time-pressure'];
const SRS_INTERVALS = [1, 3, 7, 14, 30, 60];
const STRATEGIES = ['merit', 'rank-1'];

// High-Yield Tier 1 chapters flagged with priority: true
const RESOURCES = [
  { 
    id: 'polity', 
    name: 'Laxmikant — Indian Polity', 
    chapters: [
      { name: 'Preamble & Historical Background', tier1: true },
      { name: 'Salient Features & Making', tier1: false },
      { name: 'Union, Territory & Citizenship', tier1: false },
      { name: 'Fundamental Rights', tier1: true },
      { name: 'DPSP & Fundamental Duties', tier1: true },
      { name: 'Constitutional Amendment & Basic Structure', tier1: true },
      { name: 'Parliamentary & Federal System', tier1: false },
      { name: 'President & Vice-President', tier1: true },
      { name: 'Prime Minister & COM', tier1: false },
      { name: 'Parliament', tier1: true },
      { name: 'Supreme Court & High Courts', tier1: true },
      { name: 'Emergency Provisions', tier1: true },
      { name: 'Election Commission & UPSC & CAG', tier1: true },
      { name: 'Panchayati Raj & Municipalities', tier1: true }
    ] 
  },
  { 
    id: 'history', 
    name: 'Spectrum — Modern India', 
    chapters: [
      { name: 'Advent of Europeans & British Expansion', tier1: false },
      { name: 'Revolt of 1857 & Early Resistance', tier1: true },
      { name: 'Socio-Religious Reforms', tier1: true },
      { name: 'INC Foundation & Moderate Phase', tier1: false },
      { name: 'Swadeshi & Surat Split', tier1: true },
      { name: 'Non-Cooperation & Khilafat Movement', tier1: true },
      { name: 'Civil Disobedience & Round Table Conferences', tier1: true },
      { name: 'Quit India Movement & INA', tier1: true },
      { name: 'Governor Generals, Acts & Press History', tier1: true }
    ] 
  },
  { 
    id: 'geography', 
    name: 'NCERT Geography (9-11)', 
    chapters: [
      { name: 'Physiography of India', tier1: true },
      { name: 'Drainage Systems & Rivers', tier1: true },
      { name: 'Monsoon & Climate Mechanisms', tier1: true },
      { name: 'Soils & Natural Vegetation', tier1: false },
      { name: 'Atmospheric Circulation & Oceans', tier1: true },
      { name: 'Minerals, Energy & Industrial Belts', tier1: false }
    ] 
  },
  { 
    id: 'science', 
    name: 'NCERT Science (9-10)', 
    chapters: [
      { name: 'Mechanics, Work & Energy', tier1: true },
      { name: 'Optics & Sound', tier1: true },
      { name: 'Electricity & Magnetic Effects', tier1: true },
      { name: 'Cell, Genetics & Human Organ Systems', tier1: true },
      { name: 'Chemical Reactions, Acids & Bases', tier1: true },
      { name: 'Metals, Non-Metals & Carbon Compounds', tier1: false }
    ] 
  },
  { 
    id: 'quant', 
    name: 'Quant & Aptitude', 
    chapters: [
      { name: 'Percentage, Profit & Loss', tier1: true },
      { name: 'Ratio, Mixture & Alligation', tier1: true },
      { name: 'Time, Speed, Distance & Work', tier1: true },
      { name: 'Number System & Algebra Shortcuts', tier1: true },
      { name: 'Mensuration & Geometry Fundamentals', tier1: true },
      { name: 'Data Interpretation & Trigonometry', tier1: false }
    ] 
  },
  { 
    id: 'writing', 
    name: 'CAPF & SSB Analysis / Descriptive', 
    chapters: [
      { name: 'Internal Security & Border Management', tier1: true },
      { name: 'Geopolitics & Indo-Pacific Framework', tier1: true },
      { name: 'Economic Reforms & Fiscal Trajectory', tier1: true },
      { name: 'Precis & Counter-Argument Techniques', tier1: true }
    ] 
  }
];

const DEFAULT_BOOKS = [
  { title: 'Thinking in Systems', author: 'Donella Meadows' },
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'Deep Work', author: 'Cal Newport' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
  { title: 'The Elements of Style', author: 'Strunk & White' }
];

const ANALYSIS_FRAMEWORK = [
  'cause', 
  'stakeholders', 
  'mechanism', 
  'effects', 
  'counterArguments', 
  'historicalParallel', 
  'position'
];

const FRAMEWORK_LABELS = { 
  cause: 'Root Cause & Background', 
  stakeholders: 'Key Stakeholders & Interests', 
  mechanism: 'Mechanism — How it Works', 
  effects: 'Multilateral / National Effects', 
  counterArguments: 'Counter-Arguments / For vs. Against (SSB/CAPF)', 
  historicalParallel: 'Historical Parallel', 
  position: 'Your Reasoned Synthesis / Stand' 
};

function daysSince(dateStr) { if (!dateStr) return 999; return Math.floor((new Date() - new Date(dateStr)) / 86400000); }
function daysUntil(dateStr) { return Math.ceil((new Date(dateStr) - new Date()) / 86400000); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function PrepOS() {
  const [tab, setTab] = useState('dashboard');
  const [subtab, setSubtab] = useState('priority');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [books, setBooks] = useState([]);
  const [audit, setAudit] = useState([]);
  const [srs, setSrs] = useState({});
  const [analyses, setAnalyses] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(6.0);
  const [feed, setFeed] = useState({ sections: {}, error: null, loadingFeed: true });
  const [revealedSrs, setRevealedSrs] = useState({});

  useEffect(() => {
    (async () => {
      setSessions(await getKey('sessions', []));
      setTopics(await getKey('topics', []));
      setChecklist(await getKey('checklist', {}));
      const b = await getKey('books', null);
      setBooks(b || DEFAULT_BOOKS.map((x, i) => ({ id: i + 1, title: x.title, author: x.author, totalPages: 0, pagesRead: 0, status: 'not-started' })));
      setAudit(await getKey('audit', []));
      setSrs(await getKey('srs', {}));
      setAnalyses(await getKey('analyses', []));
      setDailyTarget(await getKey('dailyTarget', 6.0));
      setLoading(false);
    })();
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      const res = await fetch('/.netlify/functions/feed');
      if (!res.ok) throw new Error('feed unavailable');
      const data = await res.json();
      setFeed({ sections: data.sections || {}, error: null, loadingFeed: false });
    } catch (e) {
      setFeed({ sections: {}, error: 'Live feed unavailable. Ensure serverless function is deployed.', loadingFeed: false });
    }
  }

  function pushAudit(summary, list = audit) {
    const next = [{ ts: new Date().toISOString(), summary }, ...list].slice(0, 300);
    setAudit(next); setKey('audit', next);
  }

  // --- Daily Log Logic ---
  const [sessForm, setSessForm] = useState({ subject: SUBJECTS[0], hours: '', notes: '' });
  function addSession() {
    if (!sessForm.hours) return;
    const entry = { id: Date.now(), date: todayStr(), subject: sessForm.subject, hours: Number(sessForm.hours), notes: sessForm.notes };
    const next = [entry, ...sessions];
    setSessions(next); setKey('sessions', next);
    pushAudit(`Logged ${sessForm.hours}h — ${sessForm.subject}`);
    setSessForm({ subject: SUBJECTS[0], hours: '', notes: '' });
  }
  function deleteSession(id) { const next = sessions.filter(s => s.id !== id); setSessions(next); setKey('sessions', next); }

  function updateDailyTarget(val) {
    const num = Number(val) || 0;
    setDailyTarget(num);
    setKey('dailyTarget', num);
  }

  // --- Multi-Stage Checklist Logic (0 -> 1 -> 2 -> 3 -> 0) ---
  function cycleChapterRevision(resId, idx) {
    const key = `${resId}-${idx}`;
    const curLevel = checklist[key] || 0;
    const nextLevel = (curLevel + 1) % 4; // Cycles: Unread(0) -> R1(1) -> R2(2) -> Mastered(3)
    const next = { ...checklist, [key]: nextLevel };
    setChecklist(next); 
    setKey('checklist', next);
    pushAudit(`Updated revision level to R${nextLevel} for ${resId} [Ch ${idx + 1}]`);
  }

  // --- Mocks with Speed & Negative Bleed Logic ---
  const [tForm, setTForm] = useState({ 
    subject: SUBJECTS[0], topic: '', exams: [], 
    totalQ: '', correctQ: '', wrongQ: '', time: '', 
    predicted: '', errorType: '', isMock: false, strategy: 'merit', 
    benchmark: '', memoryTrap: '' 
  });
  const [tError, setTError] = useState('');
  
  function toggleExam(ex) { setTForm(f => ({ ...f, exams: f.exams.includes(ex) ? f.exams.filter(x => x !== ex) : [...f.exams, ex] })); }
  
  function submitTopic() {
    const total = Number(tForm.totalQ) || 0;
    const correct = Number(tForm.correctQ) || 0;
    const wrong = Number(tForm.wrongQ) || 0;
    const timeSpent = Number(tForm.time) || 0;

    if (!tForm.topic.trim() || tForm.exams.length === 0 || total === 0) { 
      setTError('Enter topic, exam(s), and valid question metrics.'); 
      return; 
    }

    const accuracy = Math.round((correct / total) * 100);
    const negativePenalty = (wrong * 0.33); // 1/3 negative marking standard
    const netScore = Math.max(0, correct - negativePenalty);
    const secPerCorrect = correct > 0 ? Math.round((timeSpent * 60) / correct) : 0;

    setTError('');
    const entry = { 
      id: Date.now(), 
      date: todayStr(), 
      subject: tForm.subject, 
      topic: tForm.topic.trim(), 
      exams: tForm.exams, 
      totalQ: total,
      correctQ: correct,
      wrongQ: wrong,
      accuracy, 
      predicted: Number(tForm.predicted) || accuracy, 
      time: timeSpent, 
      secPerCorrect,
      netScore: Number(netScore.toFixed(2)),
      errorType: tForm.errorType, 
      isMock: tForm.isMock, 
      strategy: tForm.strategy, 
      benchmark: tForm.benchmark ? Number(tForm.benchmark) : null,
      memoryTrap: tForm.memoryTrap.trim()
    };

    const next = [entry, ...topics];
    setTopics(next); setKey('topics', next);

    // Update SRS bank with Active Recall Cue
    const key = tForm.subject + '::' + entry.topic;
    const cur = srs[key] || { box: 0 };
    let box = entry.accuracy >= 80 ? Math.min(cur.box + 1, SRS_INTERVALS.length - 1) : entry.accuracy < 50 ? 0 : cur.box;
    const nextSrs = { 
      ...srs, 
      [key]: { 
        box, 
        lastSeen: entry.date, 
        subject: tForm.subject, 
        topic: entry.topic,
        memoryTrap: entry.memoryTrap || cur.memoryTrap || ''
      } 
    };
    setSrs(nextSrs); setKey('srs', nextSrs);

    pushAudit(`${entry.isMock ? 'Mock' : 'Practice'} logged — ${entry.subject}/${entry.topic} (${entry.accuracy}% acc)`);
    setTForm({ subject: SUBJECTS[0], topic: '', exams: [], totalQ: '', correctQ: '', wrongQ: '', time: '', predicted: '', errorType: '', isMock: false, strategy: 'merit', benchmark: '', memoryTrap: '' });
  }
  function deleteTopic(id) { const next = topics.filter(t => t.id !== id); setTopics(next); setKey('topics', next); }

  function updateBook(id, field, value) {
    const next = books.map(b => b.id === id ? { ...b, [field]: value, status: field === 'pagesRead' && b.totalPages && Number(value) >= b.totalPages ? 'done' : field === 'pagesRead' && Number(value) > 0 ? 'reading' : b.status } : b);
    setBooks(next); setKey('books', next);
  }

  function reviewSrs(key, correct) {
    const cur = srs[key]; if (!cur) return;
    const box = correct ? Math.min(cur.box + 1, SRS_INTERVALS.length - 1) : 0;
    const next = { ...srs, [key]: { ...cur, box, lastSeen: todayStr() } };
    setSrs(next); setKey('srs', next);
    setRevealedSrs(prev => ({ ...prev, [key]: false }));
  }

  // --- Analysis Bank & One-Click Bridge Logic ---
  const emptyAnalysis = { topic: '', source: '', cause: '', stakeholders: '', mechanism: '', effects: '', counterArguments: '', historicalParallel: '', position: '' };
  const [aForm, setAForm] = useState(emptyAnalysis);
  
  function sendFeedToAnalysis(item) {
    setAForm({
      ...emptyAnalysis,
      topic: item.title,
      source: item.link
    });
    setTab('analysis');
  }

  function submitAnalysis() {
    if (!aForm.topic.trim()) return;
    const entry = { id: Date.now(), date: todayStr(), ...aForm, topic: aForm.topic.trim() };
    const next = [entry, ...analyses];
    setAnalyses(next); setKey('analyses', next);
    pushAudit(`Structured analysis logged — ${entry.topic}`);
    setAForm(emptyAnalysis);
  }
  function deleteAnalysis(id) { const next = analyses.filter(a => a.id !== id); setAnalyses(next); setKey('analyses', next); }

  // --- Computations ---
  function computePriority() {
    const map = {};
    topics.forEach(e => {
      const key = e.subject + '::' + e.topic;
      if (!map[key]) map[key] = { subject: e.subject, topic: e.topic, exams: new Set(), accSum: 0, count: 0, lastDate: e.date };
      e.exams.forEach(x => map[key].exams.add(x));
      map[key].accSum += e.accuracy; map[key].count += 1;
      if (e.date > map[key].lastDate) map[key].lastDate = e.date;
    });
    return Object.values(map).map(v => {
      const avgAcc = v.accSum / v.count, examWeight = v.exams.size, days = daysSince(v.lastDate);
      const priority = (1 - avgAcc / 100) * (1 + examWeight * 0.3) * (1 + Math.min(days, 60) / 30);
      return { subject: v.subject, topic: v.topic, avgAcc, examWeight, days, priority };
    }).sort((a, b) => b.priority - a.priority);
  }

  function computeCalibration() {
    if (topics.length === 0) return { brier: null, rows: [] };
    const rows = topics.slice(0, 25);
    const brier = topics.reduce((s, e) => s + Math.pow((e.predicted / 100) - (e.accuracy / 100), 2), 0) / topics.length;
    return { brier, rows };
  }

  function computeDue() {
    return Object.entries(srs).map(([key, v]) => {
      const interval = SRS_INTERVALS[v.box], days = daysSince(v.lastSeen);
      return { key, subject: v.subject, topic: v.topic, box: v.box, days, interval, overdueBy: days - interval, memoryTrap: v.memoryTrap };
    }).filter(x => x.overdueBy >= 0).sort((a, b) => b.overdueBy - a.overdueBy);
  }

  function computeErrors() {
    const counts = {};
    topics.filter(t => t.errorType).forEach(t => { counts[t.errorType] = (counts[t.errorType] || 0) + 1; });
    return { counts, log: topics.filter(t => t.errorType) };
  }

  function streak() {
    const dates = new Set(sessions.map(s => s.date));
    let d = 0, cur = new Date();
    while (dates.has(cur.toISOString().slice(0, 10))) { d++; cur.setDate(cur.getDate() - 1); }
    return d;
  }

  function todayHours() {
    return sessions.filter(s => s.date === todayStr()).reduce((sum, s) => sum + s.hours, 0);
  }

  function weeklyHours() {
    const last7 = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); }).reverse();
    return last7.map(date => ({ date, hours: sessions.filter(s => s.date === date).reduce((a, s) => a + s.hours, 0) }));
  }

  function exportBackup() {
    const data = { sessions, topics, checklist, books, audit, srs, analyses, dailyTarget, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `prep-os-backup-${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const fields = { sessions: setSessions, topics: setTopics, checklist: setChecklist, books: setBooks, audit: setAudit, srs: setSrs, analyses: setAnalyses };
        Object.entries(fields).forEach(([k, setter]) => { if (data[k]) { setter(data[k]); setKey(k, data[k]); } });
        if (data.dailyTarget) { setDailyTarget(data.dailyTarget); setKey('dailyTarget', data.dailyTarget); }
      } catch { alert('Invalid backup file format.'); }
    };
    reader.readAsText(file);
  }

  if (loading) return <div className="p-6 text-slate-400 font-mono text-sm bg-slate-950 min-h-screen">loading prep-os...</div>;

  const priority = computePriority();
  const { brier, rows } = computeCalibration();
  const due = computeDue();
  const errors = computeErrors();
  const wHours = weeklyHours();
  const maxH = Math.max(1, ...wHours.map(w => w.hours));
  const tHours = todayHours();
  const targetPct = Math.min(100, Math.round((tHours / (dailyTarget || 1)) * 100));

  const totalChapters = RESOURCES.reduce((a, r) => a + r.chapters.length, 0);
  const masteredChapters = Object.values(checklist).filter(v => v >= 3).length;

  const TABS = [
    { id: 'dashboard', label: 'dashboard', icon: Activity },
    { id: 'log', label: 'daily log', icon: Plus },
    { id: 'checklist', label: 'syllabus (r1-r3)', icon: ListChecks },
    { id: 'mocks', label: 'mocks & speed', icon: ClipboardList },
    { id: 'analytics', label: 'analytics', icon: Target },
    { id: 'analysis', label: 'analysis bank', icon: Brain },
    { id: 'feed', label: 'current affairs', icon: Newspaper },
    { id: 'audit', label: 'audit log', icon: Layers },
    { id: 'books', label: 'books', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-3">
      <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 max-w-3xl mx-auto font-sans">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-2">
              <span>prep-os</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950/80 text-teal-400 border border-teal-800/60">v2.5</span>
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
              <Flame size={12} className="text-amber-500" /> {streak()} day streak
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportBackup} className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400 transition" title="Export backup"><Download size={14} /></button>
            <label className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400 transition cursor-pointer" title="Import backup">
              <Upload size={14} /><input type="file" accept=".json" onChange={importBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-none">
          {TABS.map(t => {
            const Icon = t.icon, active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${active ? 'border-teal-500 text-teal-400 bg-teal-950/20' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* TAB 1: DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-5">
              {/* Daily Target Meter */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock size={13} className="text-teal-400" />
                    <span>Daily Target: <span className="text-teal-400 font-semibold">{tHours}h</span> / {dailyTarget}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Goal:</span>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={dailyTarget} 
                      onChange={e => updateDailyTarget(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 w-12 text-center text-slate-200"
                    />
                    <span>h</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full transition-all duration-300 ${targetPct >= 100 ? 'bg-emerald-400' : 'bg-teal-500'}`} style={{ width: `${targetPct}%` }} />
                </div>
              </div>

              {/* Exam Countdowns */}
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(EXAM_DATES).map(([ex, date]) => (
                  <div key={ex} className="bg-slate-900 rounded-xl p-3.5 border border-slate-800/80">
                    <div className="text-xs text-slate-500 font-mono">{ex}</div>
                    <div className="text-lg font-mono text-teal-400">{daysUntil(date)}d</div>
                    <div className="text-[11px] text-slate-600">{date}</div>
                  </div>
                ))}
              </div>

              {/* 7-Day Velocity Chart */}
              <div>
                <div className="text-xs text-slate-500 font-mono mb-2">velocity — last 7 days</div>
                <div className="flex items-end gap-2 h-24 bg-slate-900 rounded-xl p-3 border border-slate-800/80">
                  {wHours.map(w => (
                    <div key={w.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div className="text-[10px] font-mono text-slate-500">{w.hours || ''}</div>
                      <div className="w-full bg-teal-600 rounded-t" style={{ height: `${(w.hours / maxH) * 60}px`, minHeight: w.hours ? '4px' : '0px' }} />
                      <div className="text-[10px] text-slate-600 font-mono">{w.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High-Level Counter Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{masteredChapters}/{totalChapters}</div><div className="text-[11px] text-slate-500">R3 done</div></div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{topics.filter(t => t.isMock).length}</div><div className="text-[11px] text-slate-500">mocks</div></div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{brier !== null ? brier.toFixed(2) : '—'}</div><div className="text-[11px] text-slate-500">brier</div></div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{analyses.length}</div><div className="text-[11px] text-slate-500">analyses</div></div>
              </div>

              {/* Priority Attention */}
              {priority.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 font-mono mb-2">urgent priority — weakest retained concepts</div>
                  <div className="space-y-1.5">
                    {priority.slice(0, 3).map((p, i) => (
                      <div key={i} className="bg-slate-900 rounded-lg px-3 py-2 text-xs flex justify-between border border-slate-800/60">
                        <span className="text-slate-300">{p.subject} / {p.topic}</span>
                        <span className="text-amber-400 font-mono">{p.avgAcc.toFixed(0)}% avg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAILY LOG */}
          {tab === 'log' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={sessForm.subject} onChange={e => setSessForm(f => ({ ...f, subject: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="number" step="0.5" placeholder="hours spent" value={sessForm.hours} onChange={e => setSessForm(f => ({ ...f, hours: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
              </div>
              <textarea placeholder="Core subtopics covered / key breakthroughs / traps noticed" value={sessForm.notes} onChange={e => setSessForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" rows={2} />
              <button onClick={addSession} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm transition">log study session</button>
              
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                {sessions.slice(0, 10).map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs bg-slate-900 rounded-lg px-3 py-2 border border-slate-800/60">
                    <div><span className="text-slate-300 font-mono">{s.date} · {s.subject}</span> <span className="text-slate-500 ml-1">{s.notes}</span></div>
                    <div className="flex items-center gap-3"><span className="font-mono text-teal-400 font-semibold">{s.hours}h</span><button onClick={() => deleteSession(s.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={13} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 3-STAGE REVISION CHECKLIST (R1, R2, R3) */}
          {tab === 'checklist' && (
            <div className="space-y-6">
              <div className="text-xs text-slate-500 font-mono flex items-center justify-between">
                <span>Multi-Stage Revision Flow: Click chapter to cycle [Unread] &rarr; [R1] &rarr; [R2] &rarr; [R3 Mastered]</span>
                <span className="text-teal-400 font-medium">{masteredChapters}/{totalChapters} Mastered</span>
              </div>

              {RESOURCES.map(r => {
                const total = r.chapters.length;
                const r3Count = r.chapters.filter((_, i) => (checklist[`${r.id}-${i}`] || 0) >= 3).length;
                return (
                  <div key={r.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-slate-200">{r.name}</div>
                      <div className="text-xs font-mono text-slate-500">{r3Count}/{total} R3</div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mb-3 overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${(r3Count / total) * 100}%` }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {r.chapters.map((c, i) => {
                        const level = checklist[`${r.id}-${i}`] || 0;
                        const levelStyles = [
                          'text-slate-500 border-slate-800 bg-slate-950/40',
                          'text-amber-300 border-amber-900/60 bg-amber-950/20',
                          'text-teal-300 border-teal-900/60 bg-teal-950/20',
                          'text-emerald-400 border-emerald-800/80 bg-emerald-950/30 font-medium'
                        ];
                        const levelLabels = ['Unread', 'R1 Done', 'R2 Done', 'R3 Mastered'];

                        return (
                          <button 
                            key={i} 
                            onClick={() => cycleChapterRevision(r.id, i)} 
                            className={`text-left text-xs px-2.5 py-2 rounded-lg flex items-center justify-between border transition ${levelStyles[level]}`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {c.tier1 && <span className="text-amber-400 text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950/80 border border-amber-800/60">★ Tier 1</span>}
                              <span className="truncate">{c.name}</span>
                            </div>
                            <span className="font-mono text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700/50">
                              {levelLabels[level]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: MOCKS & SPEED / ERROR ANALYSIS */}
          {tab === 'mocks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={tForm.subject} onChange={e => setTForm(f => ({ ...f, subject: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select>
                <input placeholder="topic / test series code" value={tForm.topic} onChange={e => setTForm(f => ({ ...f, topic: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
              </div>

              <div className="flex gap-2 flex-wrap">
                {EXAMS.map(ex => (
                  <button key={ex} onClick={() => toggleExam(ex)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${tForm.exams.includes(ex) ? 'bg-teal-950 border-teal-600 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                    {ex}
                  </button>
                ))}
              </div>

              {/* Quantified Question Inputs */}
              <div className="grid grid-cols-4 gap-2">
                <input type="number" placeholder="Total Qs" value={tForm.totalQ} onChange={e => setTForm(f => ({ ...f, totalQ: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-slate-200" />
                <input type="number" placeholder="Correct" value={tForm.correctQ} onChange={e => setTForm(f => ({ ...f, correctQ: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-emerald-400 font-mono" />
                <input type="number" placeholder="Wrong" value={tForm.wrongQ} onChange={e => setTForm(f => ({ ...f, wrongQ: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-red-400 font-mono" />
                <input type="number" placeholder="Time (min)" value={tForm.time} onChange={e => setTForm(f => ({ ...f, time: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Predicted Accuracy %" value={tForm.predicted} onChange={e => setTForm(f => ({ ...f, predicted: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs placeholder-slate-600 text-slate-200" />
                <input placeholder="Memory Trap / Active Recall Cue" value={tForm.memoryTrap} onChange={e => setTForm(f => ({ ...f, memoryTrap: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs placeholder-slate-600 text-slate-200" />
              </div>

              <div className="flex gap-2 flex-wrap">
                {ERROR_TYPES.map(et => (
                  <button key={et} onClick={() => setTForm(f => ({ ...f, errorType: f.errorType === et ? '' : et }))} className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition ${tForm.errorType === et ? 'bg-amber-950 border-amber-600 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                    {et}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setTForm(f => ({ ...f, isMock: !f.isMock }))} className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${tForm.isMock ? 'bg-teal-950 border-teal-600 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                  Full Mock Exam
                </button>
                {tForm.isMock && (
                  <>
                    <select value={tForm.strategy} onChange={e => setTForm(f => ({ ...f, strategy: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200">{STRATEGIES.map(s => <option key={s}>{s}</option>)}</select>
                    <input type="number" placeholder="topper benchmark %" value={tForm.benchmark} onChange={e => setTForm(f => ({ ...f, benchmark: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-36 placeholder-slate-600 text-slate-200" />
                  </>
                )}
              </div>

              {tError && <div className="text-xs text-red-400 font-mono">{tError}</div>}
              <button onClick={submitTopic} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm transition">log performance metrics</button>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                {topics.slice(0, 8).map(t => (
                  <div key={t.id} className="text-xs bg-slate-900 rounded-xl p-3 border border-slate-800/80">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <span className="font-mono text-slate-200 font-medium">{t.subject} / {t.topic}</span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {t.totalQ} Qs · {t.correctQ}C / {t.wrongQ}W {t.secPerCorrect ? `· ${t.secPerCorrect}s/correct` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono px-2 py-0.5 rounded text-xs ${t.accuracy >= 75 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                          {t.accuracy}% Acc
                        </span>
                        <button onClick={() => deleteTopic(t.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {t.memoryTrap && (
                      <div className="text-[11px] bg-slate-950 px-2.5 py-1.5 rounded text-amber-300/90 font-mono mt-1 border border-slate-800 flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
                        <span>Trap: {t.memoryTrap}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {tab === 'analytics' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['priority', 'calibration', 'srs', 'errors'].map(s => (
                  <button key={s} onClick={() => setSubtab(s)} className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${subtab === s ? 'bg-teal-950 text-teal-300 border border-teal-600' : 'bg-slate-900 text-slate-500 border border-slate-700'}`}>{s}</button>
                ))}
              </div>

              {subtab === 'priority' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-mono mb-2">priority = (1-acc) &times; (1 + 0.3&times;exam_weight) &times; (1 + days_since/30)</div>
                  {priority.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no topics logged yet</div>}
                  {priority.map((p, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg px-3 py-2.5 border border-slate-800/60">
                      <div className="flex justify-between mb-1"><span className="text-sm text-slate-200">{p.subject}/{p.topic}</span><span className="text-xs font-mono text-amber-400">{p.priority.toFixed(2)}</span></div>
                      <div className="flex gap-3 text-xs text-slate-500 font-mono"><span>avg {p.avgAcc.toFixed(0)}%</span><span>{p.examWeight} exams</span><span>{p.days}d ago</span></div>
                    </div>
                  ))}
                </div>
              )}

              {subtab === 'calibration' && (
                <div className="space-y-3">
                  {brier === null ? <div className="text-sm text-slate-500 text-center py-8">no data yet</div> : (
                    <>
                      <div className="bg-slate-900 rounded-xl px-4 py-3 flex justify-between items-center border border-slate-800">
                        <div><div className="text-xs text-slate-500 font-mono">brier calibration score</div><div className="text-xs text-slate-600">closer to 0.00 = zero overconfidence</div></div>
                        <div className="text-xl font-mono text-teal-400">{brier.toFixed(3)}</div>
                      </div>
                      {rows.map(r => (
                        <div key={r.id} className="text-xs bg-slate-900 rounded-lg px-3 py-2 border border-slate-800/60">
                          <div className="flex justify-between mb-1"><span className="text-slate-300 font-mono">{r.subject}/{r.topic}</span><span className={`font-mono ${Math.abs(r.accuracy - r.predicted) <= 10 ? 'text-teal-400' : 'text-amber-400'}`}>&Delta;{r.accuracy - r.predicted}</span></div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1"><div className="h-full bg-slate-600" style={{ width: r.predicted + '%' }} /></div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500" style={{ width: r.accuracy + '%' }} /></div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Active Recall SRS Subtab */}
              {subtab === 'srs' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-mono mb-2">active recall queue &bull; recall core trap before checking answer</div>
                  {due.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no overdue topics due for recall</div>}
                  {due.map(d => {
                    const isRevealed = revealedSrs[d.key];
                    return (
                      <div key={d.key} className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-slate-200">{d.subject} / {d.topic}</div>
                            <div className="text-[11px] text-slate-500 font-mono">Box {d.box} &bull; Overdue by {d.overdueBy}d</div>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => reviewSrs(d.key, true)} className="p-2 rounded-lg bg-teal-950 text-teal-400 border border-teal-800/60"><Check size={14} /></button>
                            <button onClick={() => reviewSrs(d.key, false)} className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-800/60"><X size={14} /></button>
                          </div>
                        </div>

                        {d.memoryTrap && (
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-mono text-slate-500">RECALL HOOK</span>
                              <button onClick={() => setRevealedSrs(prev => ({ ...prev, [d.key]: !prev[d.key] }))} className="text-slate-400 hover:text-teal-400 flex items-center gap-1 text-[10px] font-mono">
                                {isRevealed ? <><EyeOff size={11} /> hide</> : <><Eye size={11} /> reveal trap</>}
                              </button>
                            </div>
                            {isRevealed ? (
                              <p className="text-amber-300/90 font-mono text-xs">{d.memoryTrap}</p>
                            ) : (
                              <p className="text-slate-600 italic">Click reveal to verify what mistake or trap you noted...</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {subtab === 'errors' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {ERROR_TYPES.map(et => (
                      <div key={et} className="bg-slate-900 rounded-lg px-2 py-2 text-center border border-slate-800/80">
                        <div className="text-lg font-mono text-amber-400">{errors.counts[et] || 0}</div>
                        <div className="text-xs text-slate-500">{et}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {errors.log.slice(0, 15).map(e => (
                      <div key={e.id} className="text-xs bg-slate-900 rounded-lg px-3 py-2 flex justify-between border border-slate-800/60">
                        <span className="text-slate-300">{e.subject}/{e.topic}</span>
                        <span className="text-amber-400 font-mono">{e.errorType}</span>
                      </div>
                    ))}
                    {errors.log.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no errors logged yet</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ANALYSIS BANK (WITH FOR/AGAINST SSB ARGUMENTS) */}
          {tab === 'analysis' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-mono mb-1">structured analytical synthesis for descriptive papers & ssb lecturettes</div>
              <input placeholder="topic (e.g. India-Middle East Corridor, Semiconductor Mission)" value={aForm.topic} onChange={e => setAForm(f => ({ ...f, topic: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
              <input placeholder="source url" value={aForm.source} onChange={e => setAForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
              
              {ANALYSIS_FRAMEWORK.map(field => (
                <div key={field}>
                  <label className="text-xs text-slate-400 font-mono block mb-1">{FRAMEWORK_LABELS[field]}</label>
                  <textarea value={aForm[field]} onChange={e => setAForm(f => ({ ...f, [field]: e.target.value }))} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
                </div>
              ))}
              
              <button onClick={submitAnalysis} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm transition">save structured analysis</button>
              
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs text-slate-500 font-mono">saved analyses bank ({analyses.length})</div>
                {analyses.map(a => (
                  <details key={a.id} className="bg-slate-900 rounded-xl p-3 text-xs border border-slate-800">
                    <summary className="cursor-pointer text-slate-200 flex justify-between items-center font-medium">
                      <span>{a.topic} <span className="text-slate-500 font-mono text-[11px]">· {a.date}</span></span>
                      <button onClick={(e) => { e.preventDefault(); deleteAnalysis(a.id); }} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                    </summary>
                    <div className="mt-3 space-y-2 text-slate-400 border-t border-slate-800/60 pt-2">
                      {ANALYSIS_FRAMEWORK.map(f => a[f] && (
                        <div key={f}>
                          <span className="text-teal-400/90 font-mono text-[11px] block">{FRAMEWORK_LABELS[f]}:</span> 
                          <span className="text-slate-300 text-xs">{a[f]}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SECTIONED CURRENT AFFAIRS (WITH DIRECT 'ANALYZE' ACTION) */}
          {tab === 'feed' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-slate-500 font-mono mb-3">5 curated topics per domain &bull; &le;30 days old &bull; click 'analyze' to bridge directly</div>
                {feed.loadingFeed && <div className="text-sm text-slate-500 py-4">loading filtered intelligence feeds...</div>}
                {feed.error && <div className="text-xs text-amber-400 bg-amber-950/30 rounded-lg px-3 py-2">{feed.error}</div>}

                <div className="space-y-5">
                  {Object.entries(feed.sections).map(([sectionName, articles]) => (
                    <div key={sectionName} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs font-mono uppercase tracking-wider text-teal-400 font-medium">{sectionName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">top {articles.length}</div>
                      </div>
                      
                      <div className="space-y-2">
                        {articles.length === 0 ? (
                          <div className="text-xs text-slate-600 py-1">no articles found within 30 days</div>
                        ) : (
                          articles.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950/70 rounded-lg px-3 py-2.5 border border-slate-800/60 flex items-start justify-between gap-3 group"
                            >
                              <a href={item.link} target="_blank" rel="noreferrer" className="flex-1">
                                <div className="text-xs text-slate-200 group-hover:text-teal-300 line-clamp-2 leading-relaxed">
                                  {item.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                                  <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{item.source}</span>
                                  <span>•</span>
                                  <span>{item.date}</span>
                                </div>
                              </a>
                              <button 
                                onClick={() => sendFeedToAnalysis(item)}
                                className="px-2 py-1 bg-slate-900 hover:bg-teal-950 text-slate-400 hover:text-teal-300 border border-slate-700 hover:border-teal-700 rounded text-[10px] font-mono whitespace-nowrap flex items-center gap-1 transition"
                                title="Send headline directly to Analysis Bank"
                              >
                                <span>Analyze</span>
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOG */}
          {tab === 'audit' && (
            <div className="space-y-1.5">
              {audit.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no activity logged yet</div>}
              {audit.map((a, i) => (
                <div key={i} className="text-xs bg-slate-900 rounded-lg px-3 py-2 flex justify-between border border-slate-800/60">
                  <span className="text-slate-300">{a.summary}</span>
                  <span className="text-slate-600 font-mono">{new Date(a.ts).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 9: BOOKS */}
          {tab === 'books' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-mono mb-2">systems thinking and mental models library</div>
              {books.map(b => (
                <div key={b.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <div className="flex justify-between mb-2">
                    <div><div className="text-sm text-slate-200 font-medium">{b.title}</div><div className="text-xs text-slate-500">{b.author}</div></div>
                    <span className={`text-xs font-mono self-start ${b.status === 'done' ? 'text-teal-400' : b.status === 'reading' ? 'text-amber-400' : 'text-slate-600'}`}>{b.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="read" value={b.pagesRead || ''} onChange={e => updateBook(b.id, 'pagesRead', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-20 text-slate-200" />
                    <span className="text-slate-600 text-xs">/</span>
                    <input type="number" placeholder="total" value={b.totalPages || ''} onChange={e => updateBook(b.id, 'totalPages', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-20 text-slate-200" />
                    {b.totalPages > 0 && <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-2"><div className="h-full bg-teal-500" style={{ width: `${Math.min(100, (b.pagesRead / b.totalPages) * 100)}%` }} /></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}