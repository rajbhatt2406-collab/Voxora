'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Sparkles,
  HelpCircle,
  CheckSquare,
  Bot,
  CalendarCheck,
  FilePenLine,
  AlertCircle
} from 'lucide-react';
import { api } from '@/services/api';
import {
  Lecture,
  Transcript,
  TranscriptSegment,
  Note,
  Summary,
  Question,
  Quiz,
  QuizSubmitResult,
  CitationSource
} from '@/types';
import LectureOverviewTab from '@/components/lectures/LectureOverviewTab';
import LectureTranscriptTab from '@/components/lectures/LectureTranscriptTab';
import LectureNotesTab from '@/components/lectures/LectureNotesTab';
import LectureSummaryTab from '@/components/lectures/LectureSummaryTab';
import LectureQuestionsTab from '@/components/lectures/LectureQuestionsTab';
import LectureQuizTab from '@/components/lectures/LectureQuizTab';
import LectureAssistantTab from '@/components/lectures/LectureAssistantTab';

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
  const [actionError, setActionError] = useState<string | null>(null);

  // Translation state
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('original');
  const [translatedSegments, setTranslatedSegments] = useState<TranscriptSegment[] | null>(null);

  // Quiz interactive state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);

  // RAG Assistant state
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; sources?: CitationSource[] }>
  >([]);
  const [userQuery, setUserQuery] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      Promise.all([
        api.getLecture(id),
        api.getTranscript(id).catch(() => null),
        api.getMaterials(id).catch(() => ({ notes: [], summaries: [], questions: [], quizzes: [] }))
      ])
        .then(([l, t, mats]) => {
          if (isMounted) {
            setLecture(l);
            if (t) setTranscript(t);
            setMaterials(mats);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            const msg = err instanceof Error ? err.message : 'Failed to load lecture workspace';
            setActionError(msg);
            setLoading(false);
          }
        });
    }

    const interval = setInterval(() => {
      if (lecture?.status === 'processing' && id) {
        api.getLecture(id)
          .then((l) => {
            if (isMounted) {
              setLecture(l);
              if (l.status === 'completed') {
                api.getTranscript(id).then((t) => isMounted && setTranscript(t)).catch(() => {});
                api.getMaterials(id).then((m) => isMounted && setMaterials(m)).catch(() => {});
              }
            }
          })
          .catch(() => {});
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id, lecture?.status]);

  // Generators
  const handleGenerateNotes = async (type: 'detailed' | 'short') => {
    if (!id) return;
    try {
      setGenerating(true);
      setActionError(null);
      setMessage(`Generating ${type} notes with Nemotron...`);
      const note = await api.generateNotes(id, type);
      setMaterials((prev) => ({ ...prev, notes: [...prev.notes, note] }));
      setActiveTab(type === 'detailed' ? 'detailed_notes' : 'short_notes');
      setMessage(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      setActionError(msg);
      setMessage(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!id) return;
    try {
      setGenerating(true);
      setActionError(null);
      setMessage('Generating comprehensive summary...');
      const sum = await api.generateSummary(id);
      setMaterials((prev) => ({ ...prev, summaries: [...prev.summaries, sum] }));
      setActiveTab('summary');
      setMessage(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Summary generation failed';
      setActionError(msg);
      setMessage(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!id) return;
    try {
      setGenerating(true);
      setActionError(null);
      setMessage('Generating important exam questions...');
      const qs = await api.generateQuestions(id);
      setMaterials((prev) => ({ ...prev, questions: qs }));
      setActiveTab('questions');
      setMessage(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Questions generation failed';
      setActionError(msg);
      setMessage(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!id) return;
    try {
      setGenerating(true);
      setActionError(null);
      setMessage('Creating 5-question interactive MCQ quiz...');
      const qz = await api.generateQuiz(id, 'Medium', 5);
      setMaterials((prev) => ({ ...prev, quizzes: [...prev.quizzes, qz] }));
      setActiveTab('quiz');
      setSelectedAnswers({});
      setQuizResult(null);
      setMessage(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Quiz generation failed';
      setActionError(msg);
      setMessage(null);
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
      setActionError(null);
      setSelectedLang(targetLang);
      const res = await api.translateTranscript(id, targetLang);
      setTranslatedSegments(res.segments || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Translation failed';
      setActionError(msg);
      setSelectedLang('original');
    } finally {
      setTranslating(false);
    }
  };

  // Quiz submission
  const handleQuizSubmit = async (quizId: string) => {
    try {
      setActionError(null);
      const res = await api.submitQuiz(quizId, selectedAnswers);
      setQuizResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to submit quiz';
      setActionError(msg);
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
      setActionError(null);
      const res = await api.askQuestion(id, q);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, sources: res.sources }
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not retrieve answer.';
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Error: ${msg}` }
      ]);
    } finally {
      setAsking(false);
    }
  };

  if (loading && !lecture) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Loading lecture workspace...</p>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Lecture Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This lecture may have been deleted or the ID is invalid.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const detailedNote = materials.notes.find((n) => n.note_type === 'detailed');
  const shortNote = materials.notes.find((n) => n.note_type === 'short');
  const latestSummary = materials.summaries[materials.summaries.length - 1];
  const activeQuiz = materials.quizzes[materials.quizzes.length - 1];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'transcript', label: 'Transcript', icon: FileText },
    { key: 'detailed_notes', label: 'Detailed Notes', icon: Sparkles },
    { key: 'short_notes', label: 'Short Notes', icon: FileText },
    { key: 'summary', label: 'Summary', icon: BookOpen },
    { key: 'questions', label: 'Important Q&A', icon: HelpCircle },
    { key: 'quiz', label: 'MCQ Quiz', icon: CheckSquare },
    { key: 'assistant', label: 'AI Assistant', icon: Bot },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                lecture.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : lecture.status === 'processing'
                  ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                  : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}
            >
              {lecture.status}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {lecture.source_type.replace('_', ' ')}
            </span>
            {lecture.transcription_source && (
              <>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-indigo-600">{lecture.transcription_source}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{lecture.title}</h1>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {detailedNote && (
            <Link
              href={`/handwritten?noteId=${detailedNote.id}`}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <FilePenLine className="w-3.5 h-3.5 mr-1.5" />
              Handwritten PDF
            </Link>
          )}
          <Link
            href={`/planner?lectureId=${lecture.id}`}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
            Study Planner
          </Link>
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
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
            >
              Upload Audio / Video File Directly
            </Link>
          </div>
        </div>
      )}

      {/* Generating Alert Indicator */}
      {generating && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center text-sm text-indigo-700 animate-pulse">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span>{message}</span>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-bold text-rose-800 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1 sm:space-x-2 text-sm font-semibold scrollbar-none pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'overview' && (
        <LectureOverviewTab
          lecture={lecture}
          transcript={transcript}
          materials={materials}
          generating={generating}
          onGenerateNotes={handleGenerateNotes}
          onGenerateSummary={handleGenerateSummary}
          onGenerateQuiz={handleGenerateQuiz}
        />
      )}

      {activeTab === 'transcript' && (
        <LectureTranscriptTab
          lecture={lecture}
          transcript={transcript}
          selectedLang={selectedLang}
          translating={translating}
          translatedSegments={translatedSegments}
          onTranslate={handleTranslate}
        />
      )}

      {activeTab === 'detailed_notes' && (
        <LectureNotesTab
          note={detailedNote}
          type="detailed"
          generating={generating}
          onGenerate={handleGenerateNotes}
        />
      )}

      {activeTab === 'short_notes' && (
        <LectureNotesTab
          note={shortNote}
          type="short"
          generating={generating}
          onGenerate={handleGenerateNotes}
        />
      )}

      {activeTab === 'summary' && (
        <LectureSummaryTab
          summary={latestSummary}
          generating={generating}
          onGenerate={handleGenerateSummary}
        />
      )}

      {activeTab === 'questions' && (
        <LectureQuestionsTab
          questions={materials.questions}
          generating={generating}
          onGenerate={handleGenerateQuestions}
        />
      )}

      {activeTab === 'quiz' && (
        <LectureQuizTab
          quiz={activeQuiz}
          quizResult={quizResult}
          selectedAnswers={selectedAnswers}
          generating={generating}
          onSelectAnswer={(qid, opt) => {
            setSelectedAnswers((prev) => ({ ...prev, [qid]: opt }));
          }}
          onSubmitQuiz={handleQuizSubmit}
          onGenerateQuiz={handleGenerateQuiz}
        />
      )}

      {activeTab === 'assistant' && (
        <LectureAssistantTab
          chatMessages={chatMessages}
          userQuery={userQuery}
          asking={asking}
          onQueryChange={setUserQuery}
          onSubmitQuery={handleAskQuestion}
        />
      )}
    </div>
  );
}

export default function LectureWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm">Loading Lecture Workspace...</p>
        </div>
      }
    >
      <LectureWorkspaceContent />
    </Suspense>
  );
}
