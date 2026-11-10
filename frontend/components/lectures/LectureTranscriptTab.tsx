import React, { useState } from 'react';
import { Languages, Copy, Check } from 'lucide-react';
import { Lecture, Transcript, TranscriptSegment } from '@/types';

interface LectureTranscriptTabProps {
  lecture: Lecture;
  transcript: Transcript | null;
  selectedLang: string;
  translating: boolean;
  translatedSegments: TranscriptSegment[] | null;
  onTranslate: (lang: string) => void;
}

export default function LectureTranscriptTab({
  lecture,
  transcript,
  selectedLang,
  translating,
  translatedSegments,
  onTranslate,
}: LectureTranscriptTabProps) {
  const [copied, setCopied] = useState(false);

  const activeSegments = translatedSegments || transcript?.segments || [];

  const handleCopyTranscript = () => {
    if (!activeSegments.length) return;
    const fullText = activeSegments
      .map((seg) => {
        const startM = Math.floor(seg.start / 60);
        const startS = Math.floor(seg.start % 60);
        const time = `[${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}]`;
        return `${time} ${seg.text}`;
      })
      .join('\n');

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lecture Transcript</h3>
          <p className="text-xs text-slate-500">Timestamped educational lecture text</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeSegments.length > 0 && (
            <button
              onClick={handleCopyTranscript}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Copy transcript with timestamps"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}

          {/* Translation Language Selector */}
          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedLang}
              onChange={(e) => onTranslate(e.target.value)}
              disabled={translating}
              aria-label="Select translation language"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="original">Original ({lecture.language.toUpperCase()})</option>
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
      </div>

      {translating ? (
        <div className="p-12 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs font-medium text-slate-600">Translating transcript while preserving all timestamps...</p>
        </div>
      ) : activeSegments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No transcript available yet. Please wait for the processing pipeline to complete.
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {activeSegments.map((seg, idx) => {
            const startM = Math.floor(seg.start / 60);
            const startS = Math.floor(seg.start % 60);
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl hover:bg-slate-50/80 transition-colors flex items-start gap-3 border border-transparent hover:border-slate-100"
              >
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 flex-shrink-0 select-none">
                  {String(startM).padStart(2, '0')}:{String(startS).padStart(2, '0')}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

