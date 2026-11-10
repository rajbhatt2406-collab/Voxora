import React from 'react';
import { Bot, Clock, Send } from 'lucide-react';
import { CitationSource } from '@/types';

interface LectureAssistantTabProps {
  chatMessages: Array<{ role: 'user' | 'assistant'; text: string; sources?: CitationSource[] }>;
  userQuery: string;
  asking: boolean;
  onQueryChange: (query: string) => void;
  onSubmitQuery: (e: React.FormEvent) => void;
}

export default function LectureAssistantTab({
  chatMessages,
  userQuery,
  asking,
  onQueryChange,
  onSubmitQuery,
}: LectureAssistantTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col h-[650px]">
      <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center">
            <Bot className="w-5 h-5 text-indigo-600 mr-2" />
            Voxora Grounded Lecture Tutor
          </h3>
          <p className="text-xs text-slate-500">
            Answers are strictly grounded in ChromaDB vectors with exact timestamp citations.
          </p>
        </div>
      </div>

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Bot className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Ask Anything About This Lecture</h4>
            <p className="text-xs max-w-sm text-slate-500 mt-1">
              Example: &ldquo;What did the professor say about boundary conditions?&rdquo; or &ldquo;Explain the main proof at minute 15.&rdquo;
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
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
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
                        className="inline-flex items-center text-[11px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md cursor-help"
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
          <div className="flex items-center text-xs text-indigo-600 space-x-2 p-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Searching lecture vectors and formulating grounded response...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={onSubmitQuery} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          placeholder="Ask a question about the lecture content..."
          value={userQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          disabled={asking}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
        />
        <button
          type="submit"
          disabled={asking || !userQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50 transition-colors flex items-center shadow-xs"
        >
          <Send className="w-4 h-4 mr-1.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}

