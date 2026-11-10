'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Sparkles,
  HelpCircle,
  CheckSquare,
  Bot,
  Languages,
  CalendarCheck,
  FilePenLine,
  Download,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { api } from '@/services/api';
import {
  Lecture,
  Transcript,
  Note,
  Summary,
  Question,
  Quiz,
  QuizSubmitResult,
  AskQuestionResponse
} from '@/types';

function LectureWorkspaceContent() {
  const { id } = useParams<{ id: string }>();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'transcript' | 'detailed_notes' | 'short_notes' | 'summary' | 'questions' | 'quiz' | 'assistant'
  >('overview');

  // Materials state
  const [materials, setMaterials] = useState<{
    notes: Note[];
    summaries: Summary[];
    questions: Question[];
    quizzes: Quiz[];
  }>({ notes: [], summaries: [], questions: [], quizzes: [] });

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Translation state
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('original');
  const [translatedSegments, setTranslatedSegments] = useState<any[] | null>(null);

  // Quiz interactive state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);

  // RAG Assistant state
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; sources?: any[] }>
  >([]);
  const [userQuery, setUserQuery] = useState('');
  const [asking, setAsking] = useState(false);

  // Load Lecture and Materials
  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const l = await api.getLecture(id);
      setLecture(l);

      try {
        const t = await api.getTranscript(id);
        setTranscript(t);
      } catch (e) {
        // Transcript might still be processing
      }

      const mats = await api.getMaterials(id);
      setMaterials(mats);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (lecture?.status === 'processing') {
        loadData();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [id, lecture?.status]);

  // Generators
  const handleGenerateNotes = async (type: 'detailed' | 'short') => {
    if (!id) return;
    try {
      setGenerating(true);
      setMessage(`Generating ${type} notes with Nemotron...`);
      const note = await api.generateNotes(id, type);
      setMaterials((prev) => ({ ...prev, notes: [...prev.notes, note] }));
      setActiveTab(type === 'detailed' ? 'detailed_notes' : 'short_notes');
      setMessage(null);
    } catch (e: any) {
      alert(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!id) return;
    try {
      setGenerating(true);
      setMessage('Generating comprehensive summary...');
      const sum = await api.generateSummary(id);
      setMaterials((prev) => ({ ...prev, summaries: [...prev.summaries, sum] }));
      setActiveTab('summary');
      setMessage(null);
    } catch (e: any) {
      alert(e.message || 'Summary generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!id) return;
    try {
      setGenerating(true);
      setMessage('Generating important exam questions...');
      const qs = await api.generateQuestions(id);
      setMaterials((prev) => ({ ...prev, questions: qs }));
      setActiveTab('questions');
      setMessage(null);
    } catch (e: any) {
      alert(e.message || 'Questions generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!id) return;
    try {
      setGenerating(true);
      setMessage('Creating 5-question interactive MCQ quiz...');
      const qz = await api.generateQuiz(id, 'Medium', 5);
      setMaterials((prev) => ({ ...prev, quizzes: [...prev.quizzes, qz] }));
      setActiveTab('quiz');
      setSelectedAnswers({});
      setQuizResult(null);
      setMessage(null);
    } catch (e: any) {
      alert(e.message || 'Quiz generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Translation Handler
  const handleTranslate = async (targetLang: string) => {
    if (!id || targetLang === 'original') {
      setSelectedLang('original');
      setTranslatedSegments(null);
      return;
    }
    try {
      setTranslating(true);
      setSelectedLang(targetLang);
      const res = await api.translateTranscript(id, targetLang);
      setTranslatedSegments(res.segments || []);
    } catch (e: any) {
      alert(e.message || 'Translation failed');
      setSelectedLang('original');
    } finally {
      setTranslating(false);
    }
  };

  // Quiz submission
  const handleQuizSubmit = async (quizId: string) => {
    try {
      const res = await api.submitQuiz(quizId, selectedAnswers);
      setQuizResult(res);
    } catch (e: any) {
      alert(e.message || 'Failed to submit quiz');
    }
  };

  // RAG Question submission
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !userQuery.trim() || asking) return;
    const q = userQuery.trim();
    setUserQuery('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    try {
      setAsking(true);
      const res = await api.askQuestion(id, q);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, sources: res.sources }
      ]);
    } catch (e: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Error: ${e.message || 'Could not retrieve answer.'}` }
      ]);
    } finally {
      setAsking(false);
    }
  };

  if (loading && !lecture) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading lecture workspace...</p>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Lecture Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This lecture may have been deleted or invalid.</p>
      </div>
    );
  }

  const detailedNote = materials.notes.find((n) => n.note_type === 'detailed');
  const shortNote = materials.notes.find((n) => n.note_type === 'short');
  const latestSummary = materials.summaries[materials.summaries.length - 1];
  const activeQuiz = materials.quizzes[materials.quizzes.length - 1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                lecture.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700'
                  : lecture.status === 'processing'
                  ? 'bg-amber-50 text-amber-700 animate-pulse'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {lecture.status}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 uppercase">{lecture.source_type}</span>
            {lecture.transcription_source && (
              <>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-indigo-600">{lecture.transcription_source}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{lecture.title}</h1>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {detailedNote && (
            <a
              href={`/handwritten?noteId=${detailedNote.id}`}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <FilePenLine className="w-3.5 h-3.5 mr-1.5" />
              Handwritten PDF
            </a>
          )}
          <a
            href={`/planner?lectureId=${lecture.id}`}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
            Study Planner
          </a>
        </div>
      </div>

      {/* Failure Banner */}
      {lecture.status === 'failed' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">Transcription Issue Detected</h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                {lecture.error_message || 'Could not extract captions or transcribe speech for this lecture.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <a
              href="/upload"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
            >
              Upload Audio / Video File Directly
            </a>
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1 sm:space-x-2 text-sm font-semibold scrollbar-none">
        {[
          { key: 'overview', label: 'Overview', icon: BookOpen },
          { key: 'transcript', label: 'Transcript', icon: FileText },
          { key: 'detailed_notes', label: 'Detailed Notes', icon: Sparkles },
          { key: 'short_notes', label: 'Short Notes', icon: FileText },
          { key: 'summary', label: 'Summary', icon: BookOpen },
          { key: 'questions', label: 'Important Q&A', icon: HelpCircle },
          { key: 'quiz', label: 'MCQ Quiz', icon: CheckSquare },
          { key: 'assistant', label: 'AI Assistant', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Generating Alert Indicator */}
      {generating && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center text-sm text-indigo-700 animate-pulse">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span>{message}</span>
        </div>
      )}

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">Lecture Details</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {lecture.description || 'No extended description provided with this video.'}
              </p>
              {lecture.source_url && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Source Link</span>
                  <a
                    href={lecture.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline truncate max-w-sm"
                  >
                    {lecture.source_url}
                  </a>
                </div>
              )}
            </div>

            {/* Quick Generator Launchpad */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Study Material Generator</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleGenerateNotes('detailed')}
                  disabled={generating || !transcript}
                  className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Detailed Notes</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Headings, definitions, explanations, formulas</p>
                  </div>
                </button>

                <button
                  onClick={() => handleGenerateNotes('short')}
                  disabled={generating || !transcript}
                  className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition-colors disabled:opacity-50"
                >
                  <FileText className="w-5 h-5 text-sky-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Short Revision Notes</h4>
                    <p className="text-xs text-slate-500 mt-0.5">High-yield bullet points & exam prep</p>
                  </div>
                </button>

                <button
                  onClick={handleGenerateSummary}
                  disabled={generating || !transcript}
                  className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-colors disabled:opacity-50"
                >
                  <BookOpen className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Executive Summary</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Overview, concepts, and key findings</p>
                  </div>
                </button>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={generating || !transcript}
                  className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-colors disabled:opacity-50"
                >
                  <CheckSquare className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Interactive MCQ Quiz</h4>
                    <p className="text-xs text-slate-500 mt-0.5">4-option test with explanations & scoring</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar status */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Status Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Transcript Status</span>
                  <span className="font-semibold text-slate-800">
                    {transcript ? `${transcript.segments?.length || 0} segments` : 'Processing'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Notes Generated</span>
                  <span className="font-semibold text-slate-800">{materials.notes.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Quizzes Available</span>
                  <span className="font-semibold text-slate-800">{materials.quizzes.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">RAG Vector Status</span>
                  <span className="font-semibold text-emerald-600">Indexed in ChromaDB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRANSCRIPT TAB */}
      {activeTab === 'transcript' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lecture Transcript</h3>
              <p className="text-xs text-slate-500">Timestamped educational lecture text</p>
            </div>

            {/* Translation Language Selector */}
            <div className="flex items-center space-x-2">
              <Languages className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedLang}
                onChange={(e) => handleTranslate(e.target.value)}
                disabled={translating}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="original">Original Language ({lecture.language.toUpperCase()})</option>
                <option value="hinglish">Hinglish (Roman Hindi)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="kn">Kannada</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>

          {translating ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs">Translating transcript while preserving all timestamps...</p>
            </div>
          ) : !transcript || (!transcript.segments?.length && !translatedSegments?.length) ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transcript available yet. Please wait for the processing pipeline to complete.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {(translatedSegments || transcript.segments).map((seg, idx) => {
                const startM = Math.floor(seg.start / 60);
                const startS = Math.floor(seg.start % 60);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl hover:bg-slate-50/80 transition-colors flex items-start gap-3 border border-transparent hover:border-slate-100"
                  >
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                      {String(startM).padStart(2, '0')}:{String(startS).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. DETAILED NOTES TAB */}
      {activeTab === 'detailed_notes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {detailedNote?.title || 'Detailed Academic Notes'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Comprehensive topic breakdowns & formulas</p>
            </div>
            {detailedNote && (
              <a
                href={`/handwritten?noteId=${detailedNote.id}`}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <FilePenLine className="w-3.5 h-3.5 mr-1.5" />
                Render Handwritten PDF
              </a>
            )}
          </div>

          {detailedNote ? (
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {detailedNote.content}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500 mb-4">Detailed notes have not been generated yet.</p>
              <button
                onClick={() => handleGenerateNotes('detailed')}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Generate Detailed Notes
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. SHORT NOTES TAB */}
      {activeTab === 'short_notes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {shortNote?.title || 'Quick Revision Notes'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Exam-focused high-yield takeaways</p>
            </div>
            {shortNote && (
              <a
                href={`/handwritten?noteId=${shortNote.id}`}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <FilePenLine className="w-3.5 h-3.5 mr-1.5" />
                Render Handwritten PDF
              </a>
            )}
          </div>

          {shortNote ? (
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {shortNote.content}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500 mb-4">Short revision notes have not been generated yet.</p>
              <button
                onClick={() => handleGenerateNotes('short')}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Generate Short Notes
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. SUMMARY TAB */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
            Lecture Summary
          </h3>

          {latestSummary ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Overview</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {latestSummary.overview}
                </p>
              </div>

              {latestSummary.main_concepts?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Main Concepts</h4>
                  <ul className="space-y-2">
                    {latestSummary.main_concepts.map((c, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestSummary.key_takeaways?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Key Takeaways</h4>
                  <ul className="space-y-2">
                    {latestSummary.key_takeaways.map((t, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500 mb-4">No summary generated yet.</p>
              <button
                onClick={handleGenerateSummary}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Generate Summary
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. IMPORTANT QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Important Questions & Answers</h3>
              <p className="text-xs text-slate-400 mt-0.5">Conceptual, short, and long-answer questions</p>
            </div>
            <button
              onClick={handleGenerateQuestions}
              disabled={generating}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Regenerate
            </button>
          </div>

          {materials.questions.length > 0 ? (
            <div className="space-y-4">
              {materials.questions.map((q, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {q.question_type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Q{idx + 1}: {q.question_text}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-700 pl-4 border-l-2 border-indigo-200">
                    <span className="font-semibold text-slate-900">Answer: </span>
                    {q.answer_text}
                  </p>
                  {q.explanation && (
                    <p className="text-xs text-slate-500 pl-4 italic">
                      Grounding: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500 mb-4">No exam questions generated yet.</p>
              <button
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Generate Important Questions
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. MCQ QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {activeQuiz?.title || 'Lecture Knowledge Check'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Test your comprehension with 4-choice questions</p>
            </div>
            <button
              onClick={handleGenerateQuiz}
              disabled={generating}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              New Quiz
            </button>
          </div>

          {activeQuiz ? (
            <div className="space-y-8">
              {quizResult && (
                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                  <h4 className="text-2xl font-extrabold text-indigo-900">
                    Your Score: {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
                  </h4>
                  <p className="text-xs text-indigo-600 mt-1">Review the explanations below</p>
                </div>
              )}

              <div className="space-y-6">
                {activeQuiz.questions.map((q, qIdx) => {
                  const qid = String(q.id || `q${qIdx}`);
                  const reviewItem = quizResult?.review.find((r) => r.id === qid);
                  return (
                    <div key={qid} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                      <h4 className="text-sm font-bold text-slate-900">
                        {qIdx + 1}. {q.question}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedAnswers[qid] === opt;
                          let btnStyle = 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700';

                          if (quizResult && reviewItem) {
                            if (opt === reviewItem.correct_answer) {
                              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                            } else if (isSelected && !reviewItem.is_correct) {
                              btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 line-through';
                            }
                          } else if (isSelected) {
                            btnStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                if (!quizResult) {
                                  setSelectedAnswers((prev) => ({ ...prev, [qid]: opt }));
                                }
                              }}
                              className={`p-3 text-left rounded-xl border text-xs sm:text-sm transition-all flex items-center ${btnStyle}`}
                            >
                              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold mr-2.5 flex-shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizResult && reviewItem && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
                          <span className="font-semibold text-slate-800">Explanation: </span>
                          {reviewItem.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizResult && (
                <button
                  onClick={() => handleQuizSubmit(activeQuiz.id)}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-colors"
                >
                  Submit Quiz Answers
                </button>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500 mb-4">No quiz ready yet for this lecture.</p>
              <button
                onClick={handleGenerateQuiz}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Generate 5-Question Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8. AI ASSISTANT (RAG) TAB */}
      {activeTab === 'assistant' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col h-[650px]">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Bot className="w-5 h-5 text-indigo-600 mr-2" />
                Voxora Grounded Lecture Tutor
              </h3>
              <p className="text-xs text-slate-400">
                Answers are strictly grounded in ChromaDB vectors with clickable timestamps.
              </p>
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Bot className="w-12 h-12 text-indigo-200 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">Ask Anything About This Lecture</h4>
                <p className="text-xs max-w-sm text-slate-400 mt-1">
                  Example: "What did the professor say about boundary conditions?" or "Explain the main proof at minute 15."
                </p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                      {msg.sources.map((src, sIdx) => {
                        const m = Math.floor((src.start_time || 0) / 60);
                        const s = Math.floor((src.start_time || 0) % 60);
                        return (
                          <span
                            key={sIdx}
                            title={src.text}
                            className="inline-flex items-center text-[11px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded cursor-help"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            [{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}]
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
            {asking && (
              <div className="flex items-center text-xs text-indigo-600 space-x-2">
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Searching lecture transcript and grounding response...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleAskQuestion} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about the lecture content..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              disabled={asking}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
            />
            <button
              type="submit"
              disabled={asking || !userQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50 transition-colors flex items-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function LectureWorkspacePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-slate-400">Loading Lecture Workspace...</div>}>
      <LectureWorkspaceContent />
    </Suspense>
  );
}

