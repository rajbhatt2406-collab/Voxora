'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Clock,
  BookOpen,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { Lecture } from '@/types';

export default function AssistantPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; sources?: any[] }>
  >([]);

  useEffect(() => {
    api.getLectures().then((res) => {
      setLectures(res);
      if (res.length > 0) {
        setSelectedLectureId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !selectedLectureId || asking) return;

    const currentQ = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { role: 'user', text: currentQ }]);

    try {
      setAsking(true);
      const res = await api.askQuestion(selectedLectureId, currentQ);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, sources: res.sources }
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Error: ${e.message || 'Failed to query assistant.'}` }
      ]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title & Select */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center">
            <Bot className="w-7 h-7 text-indigo-600 mr-2.5" />
            AI Lecture Assistant (RAG)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ask targeted questions with exact timestamp grounding from ChromaDB embeddings.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Lecture</label>
          <select
            value={selectedLectureId}
            onChange={(e) => {
              setSelectedLectureId(e.target.value);
              setMessages([]);
            }}
            className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white"
          >
            {lectures.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[650px] p-6">
        <div className="flex-1 overflow-y-auto space-y-5 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Ground Questions in Lecture Vectors</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Every answer references specific lecture minutes and transcript excerpts. Ask for explanations, proofs, or definitions.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 max-w-[80%]">
                    {m.sources.map((src, sIdx) => {
                      const mStart = Math.floor((src.start_time || 0) / 60);
                      const sStart = Math.floor((src.start_time || 0) % 60);
                      return (
                        <div
                          key={sIdx}
                          title={src.text}
                          className="flex items-center text-[11px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded cursor-help"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          [{String(mStart).padStart(2, '0')}:{String(sStart).padStart(2, '0')}]
                        </div>
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
              <span>Searching ChromaDB vector store and generating verified answer...</span>
            </div>
          )}
        </div>

        {/* Input Field */}
        <form onSubmit={handleAsk} className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about the lecture content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={asking || !selectedLectureId}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
          />
          <button
            type="submit"
            disabled={asking || !query.trim() || !selectedLectureId}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

