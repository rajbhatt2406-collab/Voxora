'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FilePenLine,
  Download,
  Palette,
  Sparkles
} from 'lucide-react';
import { api } from '@/services/api';
import { Lecture, Note } from '@/types';

function HandwrittenNotesContent() {
  const searchParams = useSearchParams();
  const initialNoteId = searchParams.get('noteId');

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(initialNoteId || '');

  // Editor Content
  const [content, setContent] = useState<string>(
    '# Physics: Wave-Particle Duality\n\n' +
    '## Core Concepts\n' +
    'Every quantum entity exhibits both particle and wave-like characteristics.\n\n' +
    '- De Broglie wavelength: lambda = h / p\n' +
    '- Double-slit experiment produces interference patterns even with single electrons.\n\n' +
    '### Key Revision Points\n' +
    'Observer effect alters probability amplitudes directly.'
  );

  // Customization controls
  const [fontSize, setFontSize] = useState<number>(14);
  const [inkColor, setInkColor] = useState<string>('#1A365D');
  const [paperStyle, setPaperStyle] = useState<string>('ruled');
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [pageBackground, setPageBackground] = useState<string>('ivory');

  const [generating, setGenerating] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);

  // Load lectures
  useEffect(() => {
    let ignore = false;
    api.getLectures()
      .then((res) => {
        if (!ignore) {
          setLectures(res);
          if (res.length > 0 && !selectedLectureId) {
            setSelectedLectureId(res[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load lectures:', err);
      });
    return () => {
      ignore = true;
    };
  }, [selectedLectureId]);

  // Load notes for selected lecture
  useEffect(() => {
    let ignore = false;
    if (selectedLectureId) {
      api.getMaterials(selectedLectureId)
        .then((res) => {
          if (!ignore) {
            const lectureNotes = res.notes || [];
            setNotes(lectureNotes);
            if (lectureNotes.length > 0) {
              const match = initialNoteId
                ? lectureNotes.find((n) => n.id === initialNoteId)
                : lectureNotes[0];
              if (match) {
                setSelectedNoteId(match.id);
                setContent(match.content);
              }
            }
          }
        })
        .catch((err: unknown) => {
          console.error('Failed to load materials:', err);
        });
    }
    return () => {
      ignore = true;
    };
  }, [selectedLectureId, initialNoteId]);

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    const n = notes.find((item) => item.id === id);
    if (n) setContent(n.content);
  };

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true);
      setPdfDownloadUrl(null);
      const noteIdToUse = selectedNoteId || 'temp_note';
      const res = await api.generateHandwrittenPdf(noteIdToUse, {
        text: content,
        font_style: 'Caveat',
        font_size: fontSize,
        ink_color: inkColor,
        paper_style: paperStyle,
        line_spacing: lineSpacing,
        margin: 20,
        page_background: pageBackground
      });
      setPdfDownloadUrl(res.pdf_url);
      setPdfFilename(res.filename);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'PDF Generation failed';
      alert(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center tracking-tight">
            <FilePenLine className="w-7 h-7 text-indigo-600 mr-2.5" />
            Handwritten Notes Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Turn generated lecture text into realistic ruled, grid, or plain handwritten-style PDF study sheets.
          </p>
        </div>

        {pdfDownloadUrl && (
          <a
            href={pdfDownloadUrl}
            download={pdfFilename || 'handwritten_notes.pdf'}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Lecture &amp; Note Source
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Lecture</label>
              <select
                value={selectedLectureId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                aria-label="Select lecture for notes"
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {lectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>

            {notes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Load Existing Note</label>
                <select
                  value={selectedNoteId}
                  onChange={(e) => handleSelectNote(e.target.value)}
                  aria-label="Select note to edit"
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.note_type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Styling Options */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Palette className="w-4 h-4 mr-1.5 text-indigo-600" />
              Styling &amp; Aesthetics
            </h3>

            {/* Paper Texture */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paper Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['ruled', 'grid', 'plain'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setPaperStyle(style)}
                    className={`py-2 text-xs font-semibold rounded-lg capitalize border cursor-pointer transition-colors ${
                      paperStyle === style
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Background Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paper Background</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'ivory', name: 'Ivory Warm', color: 'bg-[#FDFBF7]' },
                  { id: 'white', name: 'Crisp White', color: 'bg-white' },
                  { id: 'parchment', name: 'Parchment', color: 'bg-[#F6F1E6]' },
                  { id: 'yellow_legal', name: 'Yellow Legal', color: 'bg-[#FEFCD7]' }
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setPageBackground(bg.id)}
                    className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                      pageBackground === bg.id
                        ? 'border-indigo-600 ring-1 ring-indigo-500'
                        : 'border-slate-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full mr-2 border border-slate-300 ${bg.color}`}></span>
                    <span className="font-medium text-slate-700">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ink Color</label>
              <div className="flex gap-3">
                {[
                  { hex: '#1A365D', name: 'Dark Navy' },
                  { hex: '#0F172A', name: 'Carbon Black' },
                  { hex: '#581C87', name: 'Deep Purple' },
                  { hex: '#1E3A8A', name: 'Royal Blue' }
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setInkColor(c.hex)}
                    title={c.name}
                    aria-label={`Select ink color ${c.name}`}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      inkColor === c.hex ? 'scale-110 border-indigo-600' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Font Size & Spacing */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Font Size</span>
                  <span>{fontSize}pt</span>
                </div>
                <input
                  type="range"
                  min="11"
                  max="20"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  aria-label="Font size in points"
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Line Spacing</span>
                  <span>{lineSpacing}x</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  aria-label="Line spacing multiplier"
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <button
              onClick={handleGeneratePDF}
              disabled={generating}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all hover:shadow-lg flex items-center justify-center cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Render Handwritten PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor & Live Preview Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Notes Content Editor</h3>
            <p className="text-xs text-slate-400 mb-4">Edit Markdown headings (#, ##), bullet points (-), and equations.</p>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              aria-label="Notes content markdown editor"
              className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Live Stylized Paper Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Live Paper Sheet Preview</h3>
              <span className="text-xs font-semibold text-slate-400">A4 Ratio Live View</span>
            </div>

            <div
              className={`min-h-[500px] p-10 rounded-xl shadow-inner border border-slate-200 relative overflow-hidden transition-colors ${
                pageBackground === 'ivory'
                  ? 'bg-[#FDFBF7]'
                  : pageBackground === 'parchment'
                  ? 'bg-[#F6F1E6]'
                  : pageBackground === 'yellow_legal'
                  ? 'bg-[#FEFCD7]'
                  : 'bg-white'
              }`}
              style={{
                color: inkColor,
                lineHeight: `${lineSpacing * 1.5}rem`,
                fontFamily: 'Caveat, cursive, serif'
              }}
            >
              {/* Ruled lines guide overlay */}
              {paperStyle === 'ruled' && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(to bottom, transparent 96%, #e2e8f0 96%)',
                    backgroundSize: `100% ${lineSpacing * 1.5}rem`,
                    borderLeft: '2px solid #fca5a5',
                    marginLeft: '3rem'
                  }}
                />
              )}

              {/* Grid texture overlay */}
              {paperStyle === 'grid' && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                />
              )}

              <div className="relative z-10 whitespace-pre-wrap text-base sm:text-lg">
                {content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HandwrittenNotesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-slate-400">Loading Handwritten Notes Studio...</div>}>
      <HandwrittenNotesContent />
    </Suspense>
  );
}
