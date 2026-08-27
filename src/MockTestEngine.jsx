import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Plus, CheckCircle2, XCircle, AlertCircle, Clock, 
  ArrowRight, ArrowLeft, RotateCcw, Award, Sparkles, BookOpen, Loader2,
  FileText, UploadCloud, Check
} from 'lucide-react';
import { supabase } from './supabaseClient';

const EXAM_CONFIGS = {
  AFCAT: {
    name: 'AFCAT Full Mock (Online CBT Pattern)',
    sections: [{ name: 'Full Test (GA, English, Quant, Reasoning)', count: 100, timeMins: 120, marksPerQ: 3, negMark: 1 }]
  },
  CDS: {
    name: 'CDS Full Paper (UPSC Standard)',
    sections: [
      { name: 'Paper I: English', count: 120, timeMins: 120, marksPerQ: 0.83, negMark: 0.27 },
      { name: 'Paper II: General Knowledge', count: 120, timeMins: 120, marksPerQ: 0.83, negMark: 0.27 },
      { name: 'Paper III: Elementary Mathematics', count: 100, timeMins: 120, marksPerQ: 1.0, negMark: 0.33 }
    ]
  },
  CAPF: {
    name: 'CAPF (AC) Paper-1 (General Ability & Intelligence)',
    sections: [{ name: 'Paper I: General Ability & Intelligence', count: 125, timeMins: 120, marksPerQ: 2.0, negMark: 0.66 }]
  },
  SSC: {
    name: 'SSC CGL Tier-1 (Combined Pattern)',
    sections: [{ name: 'Tier-1 (Reasoning, GA, Quant, English)', count: 100, timeMins: 60, marksPerQ: 2.0, negMark: 0.50 }]
  }
};

export default function MockTestEngine({ onCompleteTest, subjects, exams, resources }) {
  const [view, setView] = useState('menu'); // 'menu' | 'add-pyq' | 'bulk-import' | 'pyq-archive' | 'test' | 'review'
  const [testType, setTestType] = useState('chapterwise'); // 'chapterwise' | 'sectional' | 'full-mock' | 'pyq-archive'
  
  // Selection States
  const [selectedExam, setSelectedExam] = useState(exams[0] || 'CDS');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Polity');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [testSlot, setTestSlot] = useState(1);
  const [cdsSectionIndex, setCdsSectionIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // PYQ Archive States
  const [pyqPapers, setPyqPapers] = useState([]);
  const [selectedPyqPaper, setSelectedPyqPaper] = useState(null);

  // Bulk Ingest State
  const [bulkInput, setBulkInput] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Active Test State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSelections, setUserSelections] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTestMetadata, setActiveTestMetadata] = useState(null);
  const timerRef = useRef(null);

  // Helper to extract syllabus chapters
  function getTopicsForSubject(subj) {
    if (!resources) return [];
    const matchedResource = resources.find(r => 
      r.subject?.toLowerCase() === subj?.toLowerCase() || 
      r.id?.toLowerCase() === subj?.toLowerCase()
    );
    return matchedResource ? matchedResource.chapters.map(c => c.name) : [];
  }

  const availableTopics = getTopicsForSubject(selectedSubject);

  useEffect(() => {
    const chapters = getTopicsForSubject(selectedSubject);
    if (chapters.length > 0) setSelectedTopic(chapters[0]);
    else setSelectedTopic('');
  }, [selectedSubject]);

  useEffect(() => {
    if (testType === 'pyq-archive') {
      loadPyqArchivePapers();
    }
  }, [testType, selectedExam]);

  async function loadPyqArchivePapers() {
    try {
      const { data, error } = await supabase.from('pyq_papers').select('*').eq('exam', selectedExam);
      if (!error && data) {
        setPyqPapers(data);
      }
    } catch (e) {
      console.error('Error loading PYQ papers', e);
    }
  }

  // Timer Mechanism
  useEffect(() => {
    if (view === 'test' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            finishTest();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [view, timeLeft]);

  // --- Start Exam Logic ---
  async function startTest() {
    setLoading(true);
    let targetCount = 20;
    let allowedSeconds = 20 * 72; // default
    let testMeta = {
      title: `${selectedSubject} - ${selectedTopic} (Test ${testSlot})`,
      marksPerQ: 1.0,
      negMark: 0.33,
      exam: selectedExam,
      subject: selectedSubject,
      topic: selectedTopic
    };

    if (testType === 'chapterwise') {
      targetCount = 20;
      allowedSeconds = 20 * 72; // 24 mins
    } else if (testType === 'sectional') {
      targetCount = 50;
      allowedSeconds = 50 * 60; // 50 mins
      testMeta.title = `${selectedExam} ${selectedSubject} Sectional Mock (Slot ${testSlot})`;
    } else if (testType === 'full-mock') {
      const cfg = EXAM_CONFIGS[selectedExam] || EXAM_CONFIGS.CDS;
      const activeSection = (selectedExam === 'CDS') ? cfg.sections[cdsSectionIndex] : cfg.sections[0];
      targetCount = activeSection.count;
      allowedSeconds = activeSection.timeMins * 60;
      testMeta = {
        title: `${selectedExam} Full Mock Slot ${testSlot}: ${activeSection.name}`,
        marksPerQ: activeSection.marksPerQ,
        negMark: activeSection.negMark,
        exam: selectedExam,
        subject: selectedSubject,
        topic: activeSection.name
      };
    }

    try {
      let loadedQuestions = [];

      // 1. Fetch DB PYQs
      let query = supabase.from('pyq_bank').select('*').eq('exam', selectedExam);
      if (testType === 'chapterwise' && selectedTopic) {
        query = query.ilike('topic', `%${selectedTopic.trim()}%`);
      } else if (testType === 'sectional') {
        query = query.eq('subject', selectedSubject);
      }
      
      const { data, error } = await query.limit(targetCount);
      if (!error && data && data.length > 0) {
        loadedQuestions = data.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correct_index,
          explanation: q.explanation,
          source: `Official PYQ (${q.year || 'Standard'})`
        }));
      }

      // 2. Fill Remaining with AI Elevated Generator
      if (loadedQuestions.length < targetCount) {
        const remaining = targetCount - loadedQuestions.length;
        const res = await fetch('/.netlify/functions/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_mock_set',
            payload: {
              exam: selectedExam,
              subject: selectedSubject,
              topic: (testType === 'full-mock' ? testMeta.topic : (selectedTopic || selectedSubject)),
              count: remaining,
              mode: testType,
              testSlot
            }
          })
        });

        if (res.ok) {
          const aiData = await res.json();
          if (aiData.questions) {
            const aiFormatted = aiData.questions.map((q, idx) => ({
              id: `ai-${Date.now()}-${idx}`,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation || q.trapExplanation,
              source: `AI Elite Examiner (${selectedExam} Level +15%)`
            }));
            loadedQuestions = [...loadedQuestions, ...aiFormatted];
          }
        }
      }

      if (loadedQuestions.length === 0) {
        alert('Could not prepare question set. Verify GEMINI_API_KEY or network connection.');
        setLoading(false);
        return;
      }

      setQuestions(loadedQuestions);
      setActiveTestMetadata(testMeta);
      setUserSelections({});
      setCurrentIndex(0);
      setTimeLeft(allowedSeconds);
      setView('test');
    } catch (err) {
      alert('Error initiating test: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Start Archival Full PYQ Paper ---
  function startArchivalPaper(paper) {
    if (!paper || !paper.questions || paper.questions.length === 0) return;
    setQuestions(paper.questions);
    setActiveTestMetadata({
      title: `${paper.exam} ${paper.year} (${paper.shift_or_session}) Full PYQ Paper`,
      marksPerQ: 1.0,
      negMark: 0.33,
      exam: paper.exam,
      subject: 'PYQ Full Paper',
      topic: `${paper.year} ${paper.shift_or_session}`
    });
    setUserSelections({});
    setCurrentIndex(0);
    setTimeLeft(paper.time_allowed_minutes * 60);
    setView('test');
  }

  // --- Bulk JSON Ingestion Handler ---
  async function handleBulkImport() {
    setBulkLoading(true);
    try {
      let parsed = JSON.parse(bulkInput);
      if (!Array.isArray(parsed)) parsed = [parsed];

      const res = await fetch('/.netlify/functions/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_ingest_pyq',
          payload: { questions: parsed }
        })
      });

      const result = await res.json();
      if (res.ok) {
        alert(`Successfully ingested ${result.count} PYQs directly into Supabase!`);
        setBulkInput('');
        setView('menu');
      } else {
        alert(`Bulk Import Error: ${result.error}`);
      }
    } catch (e) {
      alert('Invalid JSON array format. Ensure your input matches the schema.');
    } finally {
      setBulkLoading(false);
    }
  }

  function handleSelectOption(optIdx) {
    const prev = userSelections[currentIndex] || { confidencePct: 75, timeSpent: 0 };
    setUserSelections({
      ...userSelections,
      [currentIndex]: { ...prev, selectedOption: optIdx }
    });
  }

  function handleConfidenceChange(val) {
    const prev = userSelections[currentIndex] || { selectedOption: null, timeSpent: 0 };
    setUserSelections({
      ...userSelections,
      [currentIndex]: { ...prev, confidencePct: Number(val) }
    });
  }

  async function finishTest() {
    clearInterval(timerRef.current);

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let brierSum = 0;
    const marksPerQ = activeTestMetadata?.marksPerQ || 1.0;
    const negMark = activeTestMetadata?.negMark || 0.33;

    questions.forEach((q, idx) => {
      const u = userSelections[idx];
      if (!u || u.selectedOption === null || u.selectedOption === undefined) {
        unattempted++;
      } else if (u.selectedOption === q.correctIndex) {
        correct++;
        const prob = (u.confidencePct || 75) / 100;
        brierSum += Math.pow(prob - 1, 2);
      } else {
        wrong++;
        const prob = (u.confidencePct || 75) / 100;
        brierSum += Math.pow(prob - 0, 2);
      }
    });

    const attemptedTotal = correct + wrong;
    const netMarks = Math.max(0, (correct * marksPerQ) - (wrong * negMark));
    const accuracyPct = attemptedTotal > 0 ? (correct / attemptedTotal) * 100 : 0;
    const brierScore = attemptedTotal > 0 ? (brierSum / attemptedTotal) : null;
    const totalSeconds = (questions.length * 72) - timeLeft;

    const attemptRecord = {
      exam: activeTestMetadata?.exam || selectedExam,
      subject: activeTestMetadata?.subject || selectedSubject,
      topic: activeTestMetadata?.topic || selectedTopic,
      test_type: testType,
      total_questions: questions.length,
      correct_count: correct,
      wrong_count: wrong,
      unattempted_count: unattempted,
      time_spent_seconds: Math.max(10, totalSeconds),
      net_score: Number(netMarks.toFixed(2)),
      accuracy_pct: Number(accuracyPct.toFixed(2)),
      brier_score: brierScore ? Number(brierScore.toFixed(4)) : null,
      user_answers: userSelections
    };

    try {
      await supabase.from('mock_attempts').insert([attemptRecord]);
    } catch (e) {
      console.error('Failed to log attempt to Supabase', e);
    }

    if (onCompleteTest) {
      onCompleteTest({
        subject: activeTestMetadata?.subject || selectedSubject,
        topic: activeTestMetadata?.topic || selectedTopic,
        exams: [activeTestMetadata?.exam || selectedExam],
        totalQ: questions.length,
        correctQ: correct,
        wrongQ: wrong,
        time: Math.round(totalSeconds / 60) || 1,
        predicted: 75,
        isMock: testType === 'full-mock'
      });
    }

    setView('review');
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return (
    <div className="space-y-4">
      {/* 1. MENU VIEW */}
      {view === 'menu' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="text-xs font-mono uppercase text-teal-400 font-semibold flex items-center gap-1.5">
                <Award size={14} />
                <span>Multi-Tier Examination Simulator & PYQ Archive</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                20-Q Chapterwise (3 Tests/Ch) &bull; 50-Q Sectionals &bull; Authentic Full Papers (5 Mocks)
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setView('bulk-import')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-mono border border-slate-700 transition flex items-center gap-1"
              >
                <UploadCloud size={12} />
                <span>Bulk PYQ Load</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Mode Tabs */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'chapterwise', label: 'Chapter (20Q)' },
                { id: 'sectional', label: 'Sectional (50Q)' },
                { id: 'full-mock', label: 'Full Mocks (5 Sets)' },
                { id: 'pyq-archive', label: 'PYQ Papers' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTestType(t.id)}
                  className={`py-2 text-xs font-mono rounded-lg border uppercase transition text-center ${
                    testType === t.id 
                      ? 'bg-teal-950 border-teal-600 text-teal-300 font-semibold' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Target Exam Selector */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Exam Pattern</label>
              <select 
                value={selectedExam} 
                onChange={e => setSelectedExam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                {exams.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* TIER 1: CHAPTERWISE (20 Questions & 3 Test Slots) */}
            {testType === 'chapterwise' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Subject</label>
                    <select 
                      value={selectedSubject} 
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                    >
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Chapter Test Slot</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(slot => (
                        <button
                          key={slot}
                          onClick={() => setTestSlot(slot)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono border transition ${
                            testSlot === slot ? 'bg-teal-950 border-teal-600 text-teal-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          Test {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Chapter Name ({availableTopics.length} Available)</label>
                  <select
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Standard: 20 Questions &bull; 24 Minutes &bull; Hybrid PYQ + AI Distractor Traps</div>
              </div>
            )}

            {/* TIER 2: SECTIONAL (50 Questions) */}
            {testType === 'sectional' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Subject Domain</label>
                    <select 
                      value={selectedSubject} 
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                    >
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Sectional Slot</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(slot => (
                        <button
                          key={slot}
                          onClick={() => setTestSlot(slot)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono border transition ${
                            testSlot === slot ? 'bg-teal-950 border-teal-600 text-teal-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          S{slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Standard: 50 Questions &bull; 50 Minutes &bull; Full Syllabus Subject Coverage</div>
              </div>
            )}

            {/* TIER 3: FULL EXAM MOCKS (5 Sets / Above Cutoff Difficulty) */}
            {testType === 'full-mock' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Select Full Mock Slot (Elevated Difficulty +15%)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(slot => (
                      <button
                        key={slot}
                        onClick={() => setTestSlot(slot)}
                        className={`py-2 rounded-lg text-xs font-mono border transition ${
                          testSlot === slot ? 'bg-teal-950 border-teal-600 text-teal-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        Mock {slot < 10 ? `0${slot}` : slot}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedExam === 'CDS' && (
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">CDS Paper Module</label>
                    <select
                      value={cdsSectionIndex}
                      onChange={e => setCdsSectionIndex(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                    >
                      {EXAM_CONFIGS.CDS.sections.map((sec, i) => (
                        <option key={i} value={i}>{sec.name} ({sec.count} Qs / {sec.timeMins} min)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
                  <div className="text-teal-400 font-semibold">{EXAM_CONFIGS[selectedExam]?.name || selectedExam}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Simulates complete official question count & strict marking cutoffs.</div>
                </div>
              </div>
            )}

            {/* TIER 4: PYQ YEAR/SHIFT ARCHIVE */}
            {testType === 'pyq-archive' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="text-xs font-mono text-slate-400">Archival Year & Shift Papers for {selectedExam}:</div>
                {pyqPapers.length === 0 ? (
                  <div className="text-xs text-slate-600 font-mono text-center py-6 bg-slate-950 rounded-lg border border-slate-800">
                    No archival full papers loaded for {selectedExam} yet. Use "Bulk PYQ Load" to add full papers.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pyqPapers.map(paper => (
                      <div key={paper.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <div className="text-slate-200 font-medium font-mono">{paper.exam} {paper.year} &bull; {paper.shift_or_session}</div>
                          <div className="text-[11px] text-slate-500">{paper.total_questions} Questions &bull; {paper.time_allowed_minutes} Minutes</div>
                        </div>
                        <button
                          onClick={() => startArchivalPaper(paper)}
                          className="px-3 py-1.5 bg-teal-950 hover:bg-teal-900 border border-teal-700 text-teal-300 rounded font-mono text-xs transition"
                        >
                          Launch Paper
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {testType !== 'pyq-archive' && (
              <button
                disabled={loading}
                onClick={startTest}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition font-mono"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /><span>Synthesizing Exam Matrix...</span></>
                ) : (
                  <><Play size={15} /><span>Start Timed Exam</span></>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. BULK PYQ INGESTION VIEW */}
      {view === 'bulk-import' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-mono text-teal-400 font-semibold">Bulk PYQ Batch Importer</span>
              <p className="text-[11px] text-slate-500 font-mono">Paste full JSON arrays of 50-200 questions to store directly to Supabase.</p>
            </div>
            <button onClick={() => setView('menu')} className="text-xs font-mono text-slate-500 hover:text-slate-300">&larr; Back</button>
          </div>

          <textarea
            rows={10}
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            placeholder={`[\n  {\n    "exam": "CDS",\n    "subject": "Polity",\n    "topic": "Fundamental Rights",\n    "year": "2023-I",\n    "question": "Which Article guarantees...",\n    "options": ["Art 19", "Art 21", "Art 32", "Art 226"],\n    "correct_index": 2,\n    "explanation": "Article 32 provides remedies."\n  }\n]`}
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200"
          />

          <button
            disabled={bulkLoading || !bulkInput.trim()}
            onClick={handleBulkImport}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg text-xs transition font-mono flex items-center justify-center gap-1.5"
          >
            {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            <span>Ingest Batch to Database</span>
          </button>
        </div>
      )}

      {/* 3. ACTIVE TIMED TEST ENVIRONMENT */}
      {view === 'test' && questions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono text-slate-200 font-semibold">{activeTestMetadata?.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-400 text-xs font-mono font-semibold">
                  Q {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-slate-500 text-[10px] font-mono">{questions[currentIndex]?.source}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-semibold">
              <Clock size={13} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="text-sm font-medium text-slate-100 leading-relaxed min-h-[60px]">
            {questions[currentIndex]?.question}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {questions[currentIndex]?.options.map((opt, oIdx) => {
              const isSelected = userSelections[currentIndex]?.selectedOption === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(oIdx)}
                  className={`text-left text-xs p-3 rounded-xl border transition flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-teal-950 border-teal-500 text-teal-200 font-medium ring-1 ring-teal-500'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono flex-shrink-0 border ${
                    isSelected ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold' : 'border-slate-700 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Subjective Confidence (Brier Metric):</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={userSelections[currentIndex]?.confidencePct || 75}
                onChange={e => handleConfidenceChange(e.target.value)}
                className="w-24 accent-teal-500"
              />
              <span className="text-teal-400 font-semibold w-10 text-right">
                {userSelections[currentIndex]?.confidencePct || 75}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => i - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Prev
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(i => i + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 hover:text-teal-300 flex items-center gap-1"
              >
                Next <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={finishTest}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs font-mono transition"
              >
                Submit Mock & Compute
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. POST-MOCK FORENSIC REVIEW */}
      {view === 'review' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Examination Diagnostic Review</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Attempt Logged
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{activeTestMetadata?.title}</div>
            </div>
            <button
              onClick={() => setView('menu')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono border border-slate-700 transition"
            >
              Back to Menu
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const u = userSelections[idx];
              const isAttempted = u && u.selectedOption !== null && u.selectedOption !== undefined;
              const isCorrect = isAttempted && u.selectedOption === q.correctIndex;

              return (
                <div key={idx} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-start text-xs">
                    <div className="font-medium text-slate-200">
                      <span className="text-teal-400 font-mono mr-1.5">Q{idx + 1}.</span>
                      {q.question}
                    </div>
                    <div>
                      {isCorrect ? (
                        <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1 font-semibold">
                          <CheckCircle2 size={13} /> +{activeTestMetadata?.marksPerQ || 1.0}
                        </span>
                      ) : isAttempted ? (
                        <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1 font-semibold">
                          <XCircle size={13} /> -{activeTestMetadata?.negMark || 0.33}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Unattempted</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs font-sans">
                    {q.options.map((opt, oIdx) => {
                      const isCorrectOpt = oIdx === q.correctIndex;
                      const isUserOpt = isAttempted && u.selectedOption === oIdx;

                      let style = 'bg-slate-900/60 border-slate-800 text-slate-400';
                      if (isCorrectOpt) style = 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 font-semibold';
                      else if (isUserOpt) style = 'bg-rose-950/60 border-rose-700/80 text-rose-300';

                      return (
                        <div key={oIdx} className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${style}`}>
                          <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          {isUserOpt && <span className="text-[10px] font-mono uppercase px-1 rounded bg-slate-950">Your Pick</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="text-[11px] font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-400">
                      <strong className="text-teal-400">Reasoning / Core Anchor:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}