import React from 'react';
import { BookOpen, Sparkles, FileText, CheckSquare, ExternalLink } from 'lucide-react';
import { Lecture, Transcript, Note, Summary, Question, Quiz } from '@/types';

interface LectureOverviewTabProps {
  lecture: Lecture;
  transcript: Transcript | null;
  materials: {
    notes: Note[];
    summaries: Summary[];
    questions: Question[];
    quizzes: Quiz[];
  };
  generating: boolean;
  onGenerateNotes: (type: 'detailed' | 'short') => void;
  onGenerateSummary: () => void;
  onGenerateQuiz: () => void;
}

export default function LectureOverviewTab({
  lecture,
  transcript,
  materials,
  generating,
  onGenerateNotes,
  onGenerateSummary,
  onGenerateQuiz,
}: LectureOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2">Lecture Details</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {lecture.description || 'No extended description provided with this video.'}
          </p>
          {lecture.source_url && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Source Link</span>
              <a
                href={lecture.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-sm inline-flex items-center gap-1 font-medium"
              >
                <span>{lecture.source_url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* Quick Generator Launchpad */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Study Material Generator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onGenerateNotes('detailed')}
              disabled={generating || !transcript}
              className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Detailed Notes</h4>
                <p className="text-xs text-slate-500 mt-0.5">Headings, definitions, explanations & formulas</p>
              </div>
            </button>

            <button
              onClick={() => onGenerateNotes('short')}
              disabled={generating || !transcript}
              className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Short Revision Notes</h4>
                <p className="text-xs text-slate-500 mt-0.5">High-yield bullet points & exam prep</p>
              </div>
            </button>

            <button
              onClick={onGenerateSummary}
              disabled={generating || !transcript}
              className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Executive Summary</h4>
                <p className="text-xs text-slate-500 mt-0.5">Overview, concepts, and key findings</p>
              </div>
            </button>

            <button
              onClick={onGenerateQuiz}
              disabled={generating || !transcript}
              className="flex items-start p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
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
  );
}

