import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import { Question } from '@/types';

interface LectureQuestionsTabProps {
  questions: Question[];
  generating: boolean;
  onGenerate: () => void;
}

export default function LectureQuestionsTab({
  questions,
  generating,
  onGenerate,
}: LectureQuestionsTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Important Questions & Answers</h3>
          <p className="text-xs text-slate-500 mt-0.5">Conceptual, short, and long-answer practice questions</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
        >
          {questions.length > 0 ? 'Regenerate Questions' : 'Generate Questions'}
        </button>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {q.question_type}
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Q{idx + 1}: {q.question_text}
                </h4>
              </div>
              <p className="text-sm text-slate-700 pl-4 border-l-2 border-indigo-300">
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
        <div className="p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">No exam questions generated yet.</p>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Generate high-yield conceptual, short-answer, and long-answer exam questions.
          </p>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Important Questions
          </button>
        </div>
      )}
    </div>
  );
}

