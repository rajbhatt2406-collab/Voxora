import React, { useState } from 'react';
import Link from 'next/link';
import { FilePenLine, Copy, Check, Sparkles, FileText } from 'lucide-react';
import { Note } from '@/types';

interface LectureNotesTabProps {
  note: Note | undefined;
  type: 'detailed' | 'short';
  generating: boolean;
  onGenerate: (type: 'detailed' | 'short') => void;
}

export default function LectureNotesTab({
  note,
  type,
  generating,
  onGenerate,
}: LectureNotesTabProps) {
  const [copied, setCopied] = useState(false);

  const title =
    note?.title ||
    (type === 'detailed' ? 'Detailed Academic Notes' : 'Quick Revision Notes');
  const subtitle =
    type === 'detailed'
      ? 'Comprehensive topic breakdowns, concepts & formulas'
      : 'Exam-focused high-yield takeaways & summary points';

  const handleCopy = () => {
    if (!note?.content) return;
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {note && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>

            <Link
              href={`/handwritten?noteId=${note.id}`}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <FilePenLine className="w-3.5 h-3.5 mr-1.5" />
              Render Handwritten PDF
            </Link>
          </div>
        )}
      </div>

      {note ? (
        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/40 p-6 rounded-2xl border border-slate-100">
          {note.content}
        </div>
      ) : (
        <div className="p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            {type === 'detailed' ? <Sparkles className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {type === 'detailed' ? 'Detailed notes' : 'Short revision notes'} have not been generated yet.
          </p>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Extract clear, high-quality revision materials with AI from the lecture transcript.
          </p>
          <button
            onClick={() => onGenerate(type)}
            disabled={generating}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate {type === 'detailed' ? 'Detailed Notes' : 'Short Notes'}
          </button>
        </div>
      )}
    </div>
  );
}

