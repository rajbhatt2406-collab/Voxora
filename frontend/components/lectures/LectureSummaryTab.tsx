import React from 'react';
import { BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import { Summary } from '@/types';

interface LectureSummaryTabProps {
  summary: Summary | undefined;
  generating: boolean;
  onGenerate: () => void;
}

export default function LectureSummaryTab({
  summary,
  generating,
  onGenerate,
}: LectureSummaryTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Lecture Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">High-level synthesis of key concepts and critical findings</p>
        </div>
        {summary && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            Regenerate
          </button>
        )}
      </div>

      {summary ? (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">Overview</h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
              {summary.overview}
            </p>
          </div>

          {summary.main_concepts?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Main Concepts</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {summary.main_concepts.map((concept, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs flex items-start text-sm text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2.5 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.key_takeaways?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Key Takeaways</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {summary.key_takeaways.map((takeaway, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs flex items-start text-sm text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">No summary generated yet.</p>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Extract an executive summary with main concepts and key exam takeaways.
          </p>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Summary
          </button>
        </div>
      )}
    </div>
  );
}

