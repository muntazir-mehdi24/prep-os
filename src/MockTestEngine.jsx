import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Plus, CheckCircle2, XCircle, AlertCircle, Clock, 
  ArrowRight, ArrowLeft, RotateCcw, Award, Sparkles, BookOpen, Loader2 
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function MockTestEngine({ onCompleteTest, subjects, exams, resources }) {
  const [view, setView] = useState('menu'); // 'menu' | 'add-pyq' | 'test' | 'review'
  const [testType, setTestType] = useState('chapterwise'); // 'chapterwise' | 'sectional' | 'full-mock'
  const [selectedExam, setSelectedExam] = useState(exams[0] || 'CDS');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Polity');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [useAIOnly, setUseAIOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active Test State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSelections, setUserSelections] = useState({}); // { [qIdx]: { selectedOption, confidencePct, timeSpent } }
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Helper to extract syllabus chapters for the currently selected subject
  function getTopicsForSubject(subj) {
    if (!resources) return [];
    const matchedResource = resources.find(r => 
      r.subject?.toLowerCase() === subj?.toLowerCase() || 
      r.id?.toLowerCase() === subj?.toLowerCase()
    );
    return matchedResource ? matchedResource.chapters.map(c => c.name) : [];
  }

  const availableTopics = getTopicsForSubject(selectedSubject);

  // Auto-select the first available chapter whenever subject changes
  useEffect(() => {
    const chapters = getTopicsForSubject(selectedSubject);
    if (chapters.length > 0) {
      setSelectedTopic(chapters[0]);
    } else {
      setSelectedTopic('');
    }
  }, [selectedSubject]);

  // Add PYQ Form State
  const [pyqForm, setPyqForm] = useState({
    exam: exams[0] || 'CDS',
    subject: subjects[0] || 'Polity',
    topic: '',
    year: '2024',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctIndex: 0,
    explanation: '',
    difficulty: 'moderate'
  });

  const pyqAvailableTopics = getTopicsForSubject(pyqForm.subject);

  useEffect(() => {
    const chapters = getTopicsForSubject(pyqForm.subject);
    if (chapters.length > 0) {
      setPyqForm(f => ({ ...f, topic: chapters[0] }));
    }
  }, [pyqForm.subject]);

  // --- Timer Mechanism ---
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

  // --- Fetch / Generate Questions ---
  async function startTest() {
    setLoading(true);
    let loadedQuestions = [];

    try {
      if (!useAIOnly) {
        let query = supabase.from('pyq_bank').select('*').eq('exam', selectedExam);
        if (testType === 'chapterwise' && selectedTopic) {
          query = query.ilike('topic', `%${selectedTopic.trim()}%`);
        } else if (testType === 'sectional') {
          query = query.eq('subject', selectedSubject);
        }
        const { data, error } = await query.limit(questionCount);
        if (!error && data && data.length > 0) {
          loadedQuestions = data.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correct_index,
            explanation: q.explanation,
            source: `PYQ (${q.year || 'Standard'})`
          }));
        }
      }

      if (loadedQuestions.length < questionCount) {
        const remaining = questionCount - loadedQuestions.length;
        const res = await fetch('/.netlify/functions/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_mock_set',
            payload: {
              exam: selectedExam,
              subject: selectedSubject,
              topic: selectedTopic || selectedSubject,
              count: remaining
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
              source: 'AI Examiner Generated'
            }));
            loadedQuestions = [...loadedQuestions, ...aiFormatted];
          }
        }
      }

      if (loadedQuestions.length === 0) {
        alert('No questions found. Add PYQs to your bank or verify GEMINI_API_KEY on Netlify.');
        setLoading(false);
        return;
      }

      setQuestions(loadedQuestions);
      setUserSelections({});
      setCurrentIndex(0);
      setTimeLeft(loadedQuestions.length * 72);
      setView('test');
    } catch (err) {
      alert('Error initiating test: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(optIdx) {
    const prev = userSelections[currentIndex] || { confidencePct: 75, timeSpent: 0 };
    setUserSelections({
      ...userSelections,
      [currentIndex]: {
        ...prev,
        selectedOption: optIdx
      }
    });
  }

  function handleConfidenceChange(val) {
    const prev = userSelections[currentIndex] || { selectedOption: null, timeSpent: 0 };
    setUserSelections({
      ...userSelections,
      [currentIndex]: {
        ...prev,
        confidencePct: Number(val)
      }
    });
  }

  async function finishTest() {
    clearInterval(timerRef.current);

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let brierSum = 0;

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
    const netMarks = Math.max(0, correct - (wrong * 0.33));
    const accuracyPct = attemptedTotal > 0 ? (correct / attemptedTotal) * 100 : 0;
    const brierScore = attemptedTotal > 0 ? (brierSum / attemptedTotal) : null;
    const totalSeconds = (questions.length * 72) - timeLeft;

    const attemptRecord = {
      exam: selectedExam,
      subject: selectedSubject,
      topic: selectedTopic || selectedSubject,
      test_type: testType,
      total_questions: questions.length,
      correct_count: correct,
      wrong_count: wrong,
      unattempted_count: unattempted,
      time_spent_seconds: totalSeconds,
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
        subject: selectedSubject,
        topic: selectedTopic || `${selectedExam} ${testType}`,
        exams: [selectedExam],
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

  async function handleSavePYQ(e) {
    e.preventDefault();
    if (!pyqForm.question.trim() || !pyqForm.optionA || !pyqForm.optionB) {
      alert('Please fill question and minimum options A & B.');
      return;
    }

    const payload = {
      exam: pyqForm.exam,
      subject: pyqForm.subject,
      topic: pyqForm.topic || pyqForm.subject,
      year: pyqForm.year,
      question: pyqForm.question.trim(),
      options: [pyqForm.optionA.trim(), pyqForm.optionB.trim(), pyqForm.optionC.trim(), pyqForm.optionD.trim()],
      correct_index: Number(pyqForm.correctIndex),
      explanation: pyqForm.explanation.trim(),
      difficulty: pyqForm.difficulty
    };

    const { error } = await supabase.from('pyq_bank').insert([payload]);
    if (error) {
      alert('Error inserting PYQ: ' + error.message);
    } else {
      alert('PYQ saved to database bank.');
      setPyqForm({
        ...pyqForm,
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        explanation: ''
      });
    }
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
                <span>In-App Real-Time Exam Simulator</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Execute timed tests, track brier confidence calibration, and log results instantly.
              </div>
            </div>
            <button 
              onClick={() => setView('add-pyq')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-mono border border-slate-700 transition flex items-center gap-1.5"
            >
              <Plus size={12} />
              <span>Add PYQ</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {['chapterwise', 'sectional', 'full-mock'].map(t => (
                <button
                  key={t}
                  onClick={() => setTestType(t)}
                  className={`py-2 text-xs font-mono rounded-lg border uppercase transition ${
                    testType === t 
                      ? 'bg-teal-950 border-teal-600 text-teal-300 font-semibold' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Target Exam</label>
                <select 
                  value={selectedExam} 
                  onChange={e => setSelectedExam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {exams.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

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
            </div>

            {/* Chapter Dropdown Mapped to Superset Syllabus */}
            {testType === 'chapterwise' && (
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Select Chapter / Topic ({availableTopics.length} Chapters Available)
                </label>
                {availableTopics.length > 0 ? (
                  <select
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    {availableTopics.map(topicName => (
                      <option key={topicName} value={topicName}>
                        {topicName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    placeholder="Enter topic name..." 
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600"
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Number of Questions</label>
                <select 
                  value={questionCount} 
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  <option value={5}>5 Questions (Express)</option>
                  <option value={10}>10 Questions (Standard)</option>
                  <option value={20}>20 Questions (Sectional)</option>
                  <option value={50}>50 Questions (Comprehensive)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="aiOnly" 
                  checked={useAIOnly} 
                  onChange={e => setUseAIOnly(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-teal-600"
                />
                <label htmlFor="aiOnly" className="text-xs font-mono text-slate-300 cursor-pointer">
                  AI Edge-Case Trap Generator
                </label>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={startTest}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /><span>Preparing Mock Environment...</span></>
              ) : (
                <><Play size={15} /><span>Start Timed Exam</span></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. ADD PYQ VIEW */}
      {view === 'add-pyq' && (
        <form onSubmit={handleSavePYQ} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-mono text-teal-400 font-semibold">Store Legitimate Previous Year Questions (PYQs)</span>
            <button type="button" onClick={() => setView('menu')} className="text-xs font-mono text-slate-500 hover:text-slate-300">
              &larr; Back to Menu
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select value={pyqForm.exam} onChange={e => setPyqForm({ ...pyqForm, exam: e.target.value })} className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200">
              {exams.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={pyqForm.subject} onChange={e => setPyqForm({ ...pyqForm, subject: e.target.value })} className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200">
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Year (e.g. 2024-I)" value={pyqForm.year} onChange={e => setPyqForm({ ...pyqForm, year: e.target.value })} className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600" />
          </div>

          {/* Chapter Dropdown in PYQ Form */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Select Chapter / Topic</label>
            {pyqAvailableTopics.length > 0 ? (
              <select 
                value={pyqForm.topic} 
                onChange={e => setPyqForm({ ...pyqForm, topic: e.target.value })} 
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                {pyqAvailableTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input 
                placeholder="Topic Name..." 
                value={pyqForm.topic} 
                onChange={e => setPyqForm({ ...pyqForm, topic: e.target.value })} 
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600" 
              />
            )}
          </div>

          <textarea placeholder="Question Text..." rows={3} value={pyqForm.question} onChange={e => setPyqForm({ ...pyqForm, question: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-xs text-slate-200 placeholder-slate-600" />

          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Option A" value={pyqForm.optionA} onChange={e => setPyqForm({ ...pyqForm, optionA: e.target.value })} className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200" />
            <input placeholder="Option B" value={pyqForm.optionB} onChange={e => setPyqForm({ ...pyqForm, optionB: e.target.value })} className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200" />
            <input placeholder="Option C" value={pyqForm.optionC} onChange={e => setPyqForm({ ...pyqForm, optionC: e.target.value })} className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200" />
            <input placeholder="Option D" value={pyqForm.optionD} onChange={e => setPyqForm({ ...pyqForm, optionD: e.target.value })} className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block">Correct Option</label>
              <select value={pyqForm.correctIndex} onChange={e => setPyqForm({ ...pyqForm, correctIndex: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200">
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block">Difficulty</label>
              <select value={pyqForm.difficulty} onChange={e => setPyqForm({ ...pyqForm, difficulty: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200">
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard (UPSC Standard)</option>
              </select>
            </div>
          </div>

          <textarea placeholder="Detailed Solution / Textbook Explanation..." rows={2} value={pyqForm.explanation} onChange={e => setPyqForm({ ...pyqForm, explanation: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600" />

          <button type="submit" className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg text-xs transition">
            Save PYQ to Supabase
          </button>
        </form>
      )}

      {/* 3. ACTIVE TEST ENVIRONMENT */}
      {view === 'test' && questions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-400 text-xs font-mono font-semibold">
                Q {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-500 text-[11px] font-mono">{questions[currentIndex]?.source}</span>
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
                <span>Mock Examination Review</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Attempt Logged
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {selectedExam} &bull; {selectedSubject} {selectedTopic ? `&bull; ${selectedTopic}` : ''}
              </div>
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
                          <CheckCircle2 size={13} /> +1.00
                        </span>
                      ) : isAttempted ? (
                        <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1 font-semibold">
                          <XCircle size={13} /> -0.33
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