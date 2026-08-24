import React, { useState, useEffect } from 'react';
import { Plus, Target, Layers, Trash2, Check, X, BookOpen, ClipboardList, ListChecks, Activity, Download, Upload, Flame, Newspaper, Brain } from 'lucide-react';
import { getKey, setKey } from './supabaseClient';

const EXAM_DATES = { AFCAT: '2027-01-31', CDS: '2027-04-11', CAPF: '2027-07-15', CGL: '2027-08-15' };
const SUBJECTS = ['Reasoning', 'Quant', 'Polity', 'History', 'Geography', 'Science', 'Economy', 'Current Affairs', 'English', 'Writing'];
const EXAMS = ['SSC', 'CDS', 'AFCAT', 'CAPF'];
const ERROR_TYPES = ['conceptual', 'calculation', 'silly', 'time-pressure'];
const SRS_INTERVALS = [1, 3, 7, 14, 30, 60];
const STRATEGIES = ['merit', 'rank-1'];

const RESOURCES = [
  { id: 'polity', name: 'Laxmikant — Indian Polity', chapters: ['Historical Background', 'Making of the Constitution', 'Salient Features', 'Preamble', 'Union & Territory', 'Citizenship', 'Fundamental Rights', 'DPSP', 'Fundamental Duties', 'Constitutional Amendment', 'Basic Structure', 'Parliamentary System', 'Federal System', 'Centre-State Relations', 'President', 'Vice-President', 'Prime Minister', 'Council of Ministers', 'Parliament', 'Supreme Court', 'High Courts', 'Subordinate Courts', 'Election Commission', 'UPSC', 'CAG', 'Panchayati Raj', 'Municipalities'] },
  { id: 'history', name: 'Spectrum — Modern India', chapters: ['Advent of Europeans', 'British Expansion', 'Administrative Structure', 'Economic Impact', 'Socio-Religious Reforms', 'Revolt of 1857', 'Press & Education', 'INC: Foundation', 'Moderate Phase', 'Extremist Phase', 'Partition of Bengal', 'Home Rule Movement', 'Gandhi Era Begins', 'Non-Cooperation Movement', 'Civil Disobedience', 'Revolutionary Movements', 'Communalism & Partition', 'Quit India Movement', 'INA & Subhas Bose', 'Independence & Partition'] },
  { id: 'geography', name: 'NCERT Geography (9-11)', chapters: ['Location & Physiography', 'Drainage Systems', 'Climate', 'Natural Vegetation', 'Population', 'Agriculture', 'Resources & Minerals', 'Manufacturing Industries', 'Transport & Trade', 'World Physical Features', 'Biosphere & Ecosystem'] },
  { id: 'science', name: 'NCERT Science (9-10)', chapters: ['Matter & Its Nature', 'Atoms & Molecules', 'Structure of Atom', 'Motion', 'Force & Laws of Motion', 'Gravitation', 'Work & Energy', 'Sound', 'Light', 'Electricity', 'Magnetic Effects', 'Cell Structure', 'Life Processes', 'Heredity & Evolution', 'Carbon Compounds', 'Periodic Classification', 'Acids, Bases & Salts'] },
  { id: 'economy', name: 'NCERT Economics + IED', chapters: ['GDP & Inflation Basics', 'Fiscal Policy & Budget', 'Monetary Policy & Banking', '1991 Reforms', 'Poverty & Employment', 'Agriculture Economy', 'Industrial Policy', 'External Sector & Trade', 'Current Schemes'] },
  { id: 'quant', name: 'Quant — Number System to DI', chapters: ['Number System', 'Percentage', 'Ratio & Proportion', 'Averages', 'SI & CI', 'Profit, Loss & Discount', 'Time, Speed & Distance', 'Time & Work', 'Mixture & Alligation', 'Basic Algebra', 'Elementary Geometry', 'Mensuration', 'Trigonometry Basics', 'Data Interpretation', 'SSC Shortcut Layer'] },
  { id: 'reasoning', name: 'RS Aggarwal — Reasoning', chapters: ['Analogy', 'Classification', 'Series', 'Coding-Decoding', 'Blood Relations', 'Direction Sense', 'Ranking & Order', 'Syllogism', 'Statement-Conclusion', 'Seating Arrangement', 'Puzzles', 'Mirror & Water Images', 'Paper Folding & Cutting', 'Embedded Figures', 'Figure Series'] },
  { id: 'english', name: 'English — Grammar & Vocab', chapters: ['Tenses', 'Subject-Verb Agreement', 'Articles & Prepositions', 'Active-Passive Voice', 'Direct-Indirect Speech', 'Error Spotting', 'Sentence Improvement', 'Para Jumbles', 'Cloze Test', 'Reading Comprehension', 'Vocabulary (ongoing)'] },
  { id: 'writing', name: 'CAPF Writing — Essay/Precis/Report', chapters: ['Essay: Internal Security', 'Essay: Social Issues', 'Essay: Economy Themes', 'Precis Writing Technique', 'Report Writing Format', 'Comprehension — Subjective', 'For/Against Arguments', 'Grammar in Descriptive Context'] },
];

const DEFAULT_BOOKS = [
  { title: 'Thinking in Systems', author: 'Donella Meadows' },
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'Deep Work', author: 'Cal Newport' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
  { title: 'The Almanack of Naval Ravikant', author: 'Eric Jorgenson' },
  { title: 'Sapiens', author: 'Yuval Noah Harari' },
  { title: 'How to Read a Book', author: 'Mortimer Adler' },
  { title: 'The Elements of Style', author: 'Strunk & White' },
  { title: 'Factfulness', author: 'Hans Rosling' },
  { title: 'Range', author: 'David Epstein' },
];

const SOURCES = [
  { name: 'PIB — Press Releases', url: 'https://www.pib.gov.in', note: 'Primary govt-source current affairs' },
  { name: 'The Hindu — Editorial', url: 'https://www.thehindu.com/opinion/editorial/', note: 'Daily, structured opinion writing model' },
  { name: 'PRS India', url: 'https://prsindia.org', note: 'Bill & policy analysis — best model for structured thinking' },
  { name: 'MP-IDSA', url: 'https://www.idsa.in', note: 'Defence & strategic affairs depth (CDS/CAPF relevant)' },
  { name: 'Mrunal — Economy', url: 'https://mrunal.org', note: 'The "why" behind economic policy, not just definitions' },
  { name: 'Drishti IAS — Mains Answer Writing', url: 'https://www.drishtiias.com', note: 'Structural templates for essay/precis, free' },
];

const ANALYSIS_FRAMEWORK = ['cause', 'stakeholders', 'mechanism', 'effects', 'historicalParallel', 'globalComparison', 'position'];
const FRAMEWORK_LABELS = { cause: 'Cause', stakeholders: 'Key stakeholders', mechanism: 'Mechanism — how it actually works', effects: 'Effects (economic/social/political/security)', historicalParallel: 'Historical parallel', globalComparison: 'How other countries handle this', position: 'Your reasoned position' };

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
  const [feed, setFeed] = useState({ items: [], error: null, loadingFeed: true });

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
      setLoading(false);
    })();
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      const res = await fetch('/.netlify/functions/feed');
      if (!res.ok) throw new Error('feed unavailable');
      const data = await res.json();
      setFeed({ items: data.items || [], error: null, loadingFeed: false });
    } catch (e) {
      setFeed({ items: [], error: 'Live feed only works once deployed on Netlify (needs the serverless function).', loadingFeed: false });
    }
  }

  function pushAudit(summary, list = audit) {
    const next = [{ ts: new Date().toISOString(), summary }, ...list].slice(0, 300);
    setAudit(next); setKey('audit', next);
  }

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

  const [tForm, setTForm] = useState({ subject: SUBJECTS[0], topic: '', exams: [], accuracy: '', predicted: '', time: '', errorType: '', isMock: false, strategy: 'merit', benchmark: '' });
  const [tError, setTError] = useState('');
  function toggleExam(ex) { setTForm(f => ({ ...f, exams: f.exams.includes(ex) ? f.exams.filter(x => x !== ex) : [...f.exams, ex] })); }
  function submitTopic() {
    if (!tForm.topic.trim() || tForm.exams.length === 0 || tForm.accuracy === '' || tForm.predicted === '') { setTError('Fill topic, exam(s), accuracy and predicted confidence.'); return; }
    setTError('');
    const entry = { id: Date.now(), date: todayStr(), subject: tForm.subject, topic: tForm.topic.trim(), exams: tForm.exams, accuracy: Number(tForm.accuracy), predicted: Number(tForm.predicted), time: Number(tForm.time) || 0, errorType: tForm.errorType, isMock: tForm.isMock, strategy: tForm.strategy, benchmark: tForm.benchmark ? Number(tForm.benchmark) : null };
    const next = [entry, ...topics];
    setTopics(next); setKey('topics', next);
    const key = tForm.subject + '::' + entry.topic;
    const cur = srs[key] || { box: 0 };
    let box = entry.accuracy >= 80 ? Math.min(cur.box + 1, SRS_INTERVALS.length - 1) : entry.accuracy < 50 ? 0 : cur.box;
    const nextSrs = { ...srs, [key]: { box, lastSeen: entry.date, subject: tForm.subject, topic: entry.topic } };
    setSrs(nextSrs); setKey('srs', nextSrs);
    pushAudit(`${entry.isMock ? 'Mock' : 'Practice'} logged — ${entry.subject}/${entry.topic} (${entry.accuracy}%)`);
    setTForm({ subject: SUBJECTS[0], topic: '', exams: [], accuracy: '', predicted: '', time: '', errorType: '', isMock: false, strategy: 'merit', benchmark: '' });
  }
  function deleteTopic(id) { const next = topics.filter(t => t.id !== id); setTopics(next); setKey('topics', next); }

  function toggleChapter(resId, idx) {
    const key = `${resId}-${idx}`;
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next); setKey('checklist', next);
  }

  function updateBook(id, field, value) {
    const next = books.map(b => b.id === id ? { ...b, [field]: value, status: field === 'pagesRead' && b.totalPages && Number(value) >= b.totalPages ? 'done' : field === 'pagesRead' && Number(value) > 0 ? 'reading' : b.status } : b);
    setBooks(next); setKey('books', next);
  }

  function reviewSrs(key, correct) {
    const cur = srs[key]; if (!cur) return;
    const box = correct ? Math.min(cur.box + 1, SRS_INTERVALS.length - 1) : 0;
    const next = { ...srs, [key]: { ...cur, box, lastSeen: todayStr() } };
    setSrs(next); setKey('srs', next);
  }

  const emptyAnalysis = { topic: '', source: '', cause: '', stakeholders: '', mechanism: '', effects: '', historicalParallel: '', globalComparison: '', position: '' };
  const [aForm, setAForm] = useState(emptyAnalysis);
  function submitAnalysis() {
    if (!aForm.topic.trim()) return;
    const entry = { id: Date.now(), date: todayStr(), ...aForm, topic: aForm.topic.trim() };
    const next = [entry, ...analyses];
    setAnalyses(next); setKey('analyses', next);
    pushAudit(`Analysis logged — ${entry.topic}`);
    setAForm(emptyAnalysis);
  }
  function deleteAnalysis(id) { const next = analyses.filter(a => a.id !== id); setAnalyses(next); setKey('analyses', next); }

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
      return { key, subject: v.subject, topic: v.topic, box: v.box, days, interval, overdueBy: days - interval };
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
  function weeklyHours() {
    const last7 = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); }).reverse();
    return last7.map(date => ({ date, hours: sessions.filter(s => s.date === date).reduce((a, s) => a + s.hours, 0) }));
  }

  function exportBackup() {
    const data = { sessions, topics, checklist, books, audit, srs, analyses, exportedAt: new Date().toISOString() };
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
      } catch { alert('Invalid backup file.'); }
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
  const totalChapters = RESOURCES.reduce((a, r) => a + r.chapters.length, 0);
  const doneChapters = Object.values(checklist).filter(Boolean).length;

  const TABS = [
    { id: 'dashboard', label: 'dashboard', icon: Activity },
    { id: 'log', label: 'daily log', icon: Plus },
    { id: 'checklist', label: 'checklists', icon: ListChecks },
    { id: 'mocks', label: 'mocks', icon: ClipboardList },
    { id: 'analytics', label: 'analytics', icon: Target },
    { id: 'analysis', label: 'analysis bank', icon: Brain },
    { id: 'feed', label: 'current affairs', icon: Newspaper },
    { id: 'audit', label: 'audit log', icon: Layers },
    { id: 'books', label: 'books', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-3">
      <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 max-w-3xl mx-auto font-sans">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-100">prep-os</div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1"><Flame size={12} className="text-amber-500" /> {streak()} day streak</div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportBackup} className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400" title="Export backup"><Download size={14} /></button>
            <label className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400 cursor-pointer" title="Import backup">
              <Upload size={14} /><input type="file" accept=".json" onChange={importBackup} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex border-b border-slate-800 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon, active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${active ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {tab === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(EXAM_DATES).map(([ex, date]) => (
                  <div key={ex} className="bg-slate-900 rounded-lg px-4 py-3">
                    <div className="text-xs text-slate-500 font-mono">{ex}</div>
                    <div className="text-lg font-mono text-teal-400">{daysUntil(date)}d</div>
                    <div className="text-xs text-slate-600">{date}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono mb-2">last 7 days</div>
                <div className="flex items-end gap-2 h-24 bg-slate-900 rounded-lg p-3">
                  {wHours.map(w => (
                    <div key={w.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div className="text-xs font-mono text-slate-500">{w.hours || ''}</div>
                      <div className="w-full bg-teal-600 rounded-t" style={{ height: `${(w.hours / maxH) * 60}px`, minHeight: w.hours ? '4px' : '0px' }} />
                      <div className="text-xs text-slate-600 font-mono">{w.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900 rounded-lg px-3 py-3"><div className="text-lg font-mono text-slate-100">{doneChapters}/{totalChapters}</div><div className="text-xs text-slate-500">chapters</div></div>
                <div className="bg-slate-900 rounded-lg px-3 py-3"><div className="text-lg font-mono text-slate-100">{topics.filter(t => t.isMock).length}</div><div className="text-xs text-slate-500">mocks</div></div>
                <div className="bg-slate-900 rounded-lg px-3 py-3"><div className="text-lg font-mono text-slate-100">{brier !== null ? brier.toFixed(2) : '—'}</div><div className="text-xs text-slate-500">brier</div></div>
                <div className="bg-slate-900 rounded-lg px-3 py-3"><div className="text-lg font-mono text-slate-100">{analyses.length}</div><div className="text-xs text-slate-500">analyses</div></div>
              </div>
              {priority.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 font-mono mb-2">top 3 priority right now</div>
                  <div className="space-y-1.5">
                    {priority.slice(0, 3).map((p, i) => (
                      <div key={i} className="bg-slate-900 rounded-lg px-3 py-2 text-xs flex justify-between">
                        <span className="text-slate-300">{p.subject} / {p.topic}</span>
                        <span className="text-amber-400 font-mono">{p.avgAcc.toFixed(0)}% avg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'log' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={sessForm.subject} onChange={e => setSessForm(f => ({ ...f, subject: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="number" step="0.5" placeholder="hours today" value={sessForm.hours} onChange={e => setSessForm(f => ({ ...f, hours: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
              </div>
              <textarea placeholder="what you covered / notes" value={sessForm.notes} onChange={e => setSessForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" rows={2} />
              <button onClick={addSession} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm">log today</button>
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                {sessions.slice(0, 10).map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs bg-slate-900 rounded-lg px-3 py-2">
                    <div><span className="text-slate-300 font-mono">{s.date} · {s.subject}</span> <span className="text-slate-600">{s.notes}</span></div>
                    <div className="flex items-center gap-3"><span className="font-mono text-teal-400">{s.hours}h</span><button onClick={() => deleteSession(s.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={13} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'checklist' && (
            <div className="space-y-5">
              {RESOURCES.map(r => {
                const done = r.chapters.filter((_, i) => checklist[`${r.id}-${i}`]).length;
                return (
                  <div key={r.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-slate-200">{r.name}</div>
                      <div className="text-xs font-mono text-slate-500">{done}/{r.chapters.length}</div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mb-2 overflow-hidden"><div className="h-full bg-teal-500" style={{ width: `${(done / r.chapters.length) * 100}%` }} /></div>
                    <div className="grid grid-cols-2 gap-1">
                      {r.chapters.map((c, i) => {
                        const key = `${r.id}-${i}`, checked = !!checklist[key];
                        return (
                          <button key={i} onClick={() => toggleChapter(r.id, i)} className={`text-left text-xs px-2 py-1.5 rounded flex items-center gap-1.5 ${checked ? 'text-teal-400' : 'text-slate-500'}`}>
                            <span className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-teal-600 border-teal-600' : 'border-slate-600'}`}>{checked && <Check size={10} />}</span>
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'mocks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={tForm.subject} onChange={e => setTForm(f => ({ ...f, subject: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select>
                <input placeholder="topic" value={tForm.topic} onChange={e => setTForm(f => ({ ...f, topic: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
              </div>
              <div className="flex gap-2 flex-wrap">{EXAMS.map(ex => <button key={ex} onClick={() => toggleExam(ex)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${tForm.exams.includes(ex) ? 'bg-teal-950 border-teal-600 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>{ex}</button>)}</div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="accuracy %" value={tForm.accuracy} onChange={e => setTForm(f => ({ ...f, accuracy: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
                <input type="number" placeholder="predicted %" value={tForm.predicted} onChange={e => setTForm(f => ({ ...f, predicted: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
                <input type="number" placeholder="time (min)" value={tForm.time} onChange={e => setTForm(f => ({ ...f, time: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
              </div>
              <div className="flex gap-2 flex-wrap">{ERROR_TYPES.map(et => <button key={et} onClick={() => setTForm(f => ({ ...f, errorType: f.errorType === et ? '' : et }))} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${tForm.errorType === et ? 'bg-amber-950 border-amber-600 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>{et}</button>)}</div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setTForm(f => ({ ...f, isMock: !f.isMock }))} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${tForm.isMock ? 'bg-teal-950 border-teal-600 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>this is a full mock</button>
                {tForm.isMock && (
                  <>
                    <select value={tForm.strategy} onChange={e => setTForm(f => ({ ...f, strategy: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs">{STRATEGIES.map(s => <option key={s}>{s}</option>)}</select>
                    <input type="number" placeholder="topper benchmark %" value={tForm.benchmark} onChange={e => setTForm(f => ({ ...f, benchmark: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-36 placeholder-slate-600" />
                  </>
                )}
              </div>
              {tError && <div className="text-xs text-red-400 font-mono">{tError}</div>}
              <button onClick={submitTopic} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm">log</button>
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                {topics.filter(t => t.isMock).slice(0, 8).map(t => (
                  <div key={t.id} className="text-xs bg-slate-900 rounded-lg px-3 py-2">
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-slate-300">{t.subject}/{t.topic} <span className="text-slate-600">· {t.strategy}</span></span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${t.accuracy >= 70 ? 'text-teal-400' : 'text-amber-400'}`}>{t.accuracy}%</span>
                        <button onClick={() => deleteTopic(t.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {t.benchmark !== null && <div className="text-slate-600 font-mono">vs topper benchmark {t.benchmark}% → {(t.accuracy - t.benchmark >= 0 ? '+' : '') + (t.accuracy - t.benchmark)}pts</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['priority', 'calibration', 'srs', 'errors'].map(s => (
                  <button key={s} onClick={() => setSubtab(s)} className={`px-3 py-1.5 rounded-lg text-xs font-mono ${subtab === s ? 'bg-teal-950 text-teal-300 border border-teal-600' : 'bg-slate-900 text-slate-500 border border-slate-700'}`}>{s}</button>
                ))}
              </div>
              {subtab === 'priority' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-mono mb-2">priority = (1-accuracy) × (1 + 0.3×exam_count) × (1 + days_since/30)</div>
                  {priority.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no data yet</div>}
                  {priority.map((p, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg px-3 py-2.5">
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
                      <div className="bg-slate-900 rounded-lg px-4 py-3 flex justify-between items-center">
                        <div><div className="text-xs text-slate-500 font-mono">brier score</div><div className="text-xs text-slate-600">lower = better calibrated</div></div>
                        <div className="text-xl font-mono text-teal-400">{brier.toFixed(3)}</div>
                      </div>
                      {rows.map(r => (
                        <div key={r.id} className="text-xs bg-slate-900 rounded-lg px-3 py-2">
                          <div className="flex justify-between mb-1"><span className="text-slate-300 font-mono">{r.subject}/{r.topic}</span><span className={`font-mono ${Math.abs(r.accuracy - r.predicted) <= 10 ? 'text-teal-400' : 'text-amber-400'}`}>Δ{r.accuracy - r.predicted}</span></div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1"><div className="h-full bg-slate-600" style={{ width: r.predicted + '%' }} /></div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500" style={{ width: r.accuracy + '%' }} /></div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              {subtab === 'srs' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-mono mb-2">intervals: {SRS_INTERVALS.join('/')} days</div>
                  {due.length === 0 && <div className="text-sm text-slate-500 text-center py-8">nothing due</div>}
                  {due.map(d => (
                    <div key={d.key} className="bg-slate-900 rounded-lg px-3 py-2.5 flex justify-between items-center">
                      <div><div className="text-sm text-slate-200">{d.subject}/{d.topic}</div><div className="text-xs text-slate-500 font-mono">box {d.box} · overdue {d.overdueBy}d</div></div>
                      <div className="flex gap-1.5"><button onClick={() => reviewSrs(d.key, true)} className="p-2 rounded-lg bg-teal-950 text-teal-400"><Check size={14} /></button><button onClick={() => reviewSrs(d.key, false)} className="p-2 rounded-lg bg-red-950 text-red-400"><X size={14} /></button></div>
                    </div>
                  ))}
                </div>
              )}
              {subtab === 'errors' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {ERROR_TYPES.map(et => (
                      <div key={et} className="bg-slate-900 rounded-lg px-2 py-2 text-center"><div className="text-lg font-mono text-amber-400">{errors.counts[et] || 0}</div><div className="text-xs text-slate-500">{et}</div></div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {errors.log.slice(0, 15).map(e => (
                      <div key={e.id} className="text-xs bg-slate-900 rounded-lg px-3 py-2 flex justify-between"><span className="text-slate-300">{e.subject}/{e.topic}</span><span className="text-amber-400 font-mono">{e.errorType}</span></div>
                    ))}
                    {errors.log.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no errors logged yet</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'analysis' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-mono mb-1">structured analysis — this is what builds interview-grade thinking, not passive reading</div>
              <input placeholder="topic (e.g. GST Council decision, border security bill)" value={aForm.topic} onChange={e => setAForm(f => ({ ...f, topic: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
              <input placeholder="source link (optional)" value={aForm.source} onChange={e => setAForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
              {ANALYSIS_FRAMEWORK.map(field => (
                <div key={field}>
                  <label className="text-xs text-slate-500 font-mono block mb-1">{FRAMEWORK_LABELS[field]}</label>
                  <textarea value={aForm[field]} onChange={e => setAForm(f => ({ ...f, [field]: e.target.value }))} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600" />
                </div>
              ))}
              <button onClick={submitAnalysis} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm">save analysis</button>
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs text-slate-500 font-mono">saved analyses ({analyses.length}) — review these before SSB / interview</div>
                {analyses.map(a => (
                  <details key={a.id} className="bg-slate-900 rounded-lg px-3 py-2 text-xs">
                    <summary className="cursor-pointer text-slate-200 flex justify-between items-center">
                      <span>{a.topic} <span className="text-slate-600">· {a.date}</span></span>
                      <button onClick={(e) => { e.preventDefault(); deleteAnalysis(a.id); }} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                    </summary>
                    <div className="mt-2 space-y-1.5 text-slate-400">
                      {ANALYSIS_FRAMEWORK.map(f => a[f] && <div key={f}><span className="text-slate-500">{FRAMEWORK_LABELS[f]}:</span> {a[f]}</div>)}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {tab === 'feed' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 font-mono mb-2">live headlines (PIB + The Hindu editorial)</div>
                {feed.loadingFeed && <div className="text-sm text-slate-500">loading feed...</div>}
                {feed.error && <div className="text-xs text-amber-400 bg-amber-950/30 rounded-lg px-3 py-2">{feed.error}</div>}
                <div className="space-y-1.5">
                  {feed.items.map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block bg-slate-900 rounded-lg px-3 py-2 text-xs hover:bg-slate-800">
                      <div className="text-slate-200">{item.title}</div>
                      <div className="text-slate-600 font-mono mt-0.5">{item.source}</div>
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono mb-2">curated sources</div>
                <div className="space-y-1.5">
                  {SOURCES.map(s => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="block bg-slate-900 rounded-lg px-3 py-2 text-xs hover:bg-slate-800">
                      <div className="text-slate-200">{s.name}</div>
                      <div className="text-slate-600">{s.note}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-1.5">
              {audit.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no activity yet</div>}
              {audit.map((a, i) => (
                <div key={i} className="text-xs bg-slate-900 rounded-lg px-3 py-2 flex justify-between">
                  <span className="text-slate-300">{a.summary}</span>
                  <span className="text-slate-600 font-mono">{new Date(a.ts).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'books' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-mono mb-2">for comprehension, systems thinking, and holistic analysis</div>
              {books.map(b => (
                <div key={b.id} className="bg-slate-900 rounded-lg px-3 py-2.5">
                  <div className="flex justify-between mb-2">
                    <div><div className="text-sm text-slate-200">{b.title}</div><div className="text-xs text-slate-600">{b.author}</div></div>
                    <span className={`text-xs font-mono self-start ${b.status === 'done' ? 'text-teal-400' : b.status === 'reading' ? 'text-amber-400' : 'text-slate-600'}`}>{b.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="pages read" value={b.pagesRead || ''} onChange={e => updateBook(b.id, 'pagesRead', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-24" />
                    <span className="text-slate-600 text-xs">/</span>
                    <input type="number" placeholder="total pages" value={b.totalPages || ''} onChange={e => updateBook(b.id, 'totalPages', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-24" />
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
