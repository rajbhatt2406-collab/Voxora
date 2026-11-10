import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  FilePenLine,
  CalendarCheck,
  Bot,
  Languages,
  CheckCircle2,
  Sparkles,
  PlayCircle
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'Smart Video & Audio Input',
      desc: 'Process public YouTube lectures with timestamps or upload your video & audio files directly with Gnani Prisma speech-to-text.',
      icon: PlayCircle,
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      title: 'Multilingual & Hinglish',
      desc: 'Translate transcripts into Hindi, Hinglish, Spanish, French, German, or regional Indian languages while preserving timestamps.',
      icon: Languages,
      color: 'text-sky-600 bg-sky-50'
    },
    {
      title: 'AI Study Material Suite',
      desc: 'Generate in-depth detailed notes, exam revision short notes, lecture summaries, key questions, and 4-choice MCQ quizzes powered by Nemotron.',
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'Handwritten-Style Notes',
      desc: 'Convert any note into an authentic handwritten PDF with ruled paper, custom ink colors, margin guides, and customizable handwriting styles.',
      icon: FilePenLine,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      title: 'Long Lecture Planner',
      desc: 'Break massive 8-10 hour marathon lectures into balanced 1-2 hour daily study sessions with checkpoints, quizzes, and progress tracking.',
      icon: CalendarCheck,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'RAG Grounded AI Assistant',
      desc: 'Ask any question about your lecture and receive verified answers with clickable timestamp citations grounded strictly in the transcript.',
      icon: Bot,
      color: 'text-rose-600 bg-rose-50'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Provide Lecture Media',
      desc: 'Paste a YouTube video link or upload your recorded MP4, MKV, MP3, or WAV lecture file.'
    },
    {
      step: '02',
      title: 'AI Extraction & Transcription',
      desc: 'Voxora extracts captions or runs Gnani Prisma STT and indexes segments into ChromaDB vectors.'
    },
    {
      step: '03',
      title: 'Study, Revise & Master',
      desc: 'Access detailed notes, take interactive quizzes, print handwritten PDFs, or ask the RAG AI questions.'
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered University Learning Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Turn Every Video <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-600">
              Into Structured Knowledge.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
            Voxora transforms long, tedious YouTube lectures and recordings into comprehensive notes,
            quizzes, daily study plans, handwritten PDFs, and a grounded AI tutor.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all hover:shadow-lg"
            >
              Start Learning Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
            >
              Open Dashboard
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-xs font-medium text-slate-500">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
              YouTube & Audio Uploads
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
              Ruled Handwritten PDFs
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
              Grounded RAG Citations
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Engineered for Deep Academic Focus</h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Everything students and lifelong learners need to absorb hours of educational lectures in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Workflow</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">How Voxora Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((s, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-xl mb-6">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-700 rounded-3xl p-10 sm:p-14 text-center text-white shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to upgrade how you study?
          </h2>
          <p className="mt-4 text-indigo-100 max-w-xl mx-auto text-base">
            Never struggle through a dense, unsearchable 3-hour lecture again. Voxora turns hours of video into instant mastery.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/upload"
              className="inline-flex items-center px-8 py-3.5 rounded-xl font-bold text-indigo-900 bg-white hover:bg-indigo-50 shadow-md transition-colors"
            >
              Upload Your First Lecture
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
