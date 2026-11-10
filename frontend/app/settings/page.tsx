'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Sliders,
  Database,
  Cpu,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [defaultPaperStyle, setDefaultPaperStyle] = useState('ruled');
  const [dailyTargetHours, setDailyTargetHours] = useState('1.5');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center">
          <SettingsIcon className="w-7 h-7 text-indigo-600 mr-2.5" />
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize your default transcription, notes styles, and AI learning targets.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Globe className="w-4 h-4 mr-2 text-indigo-600" />
            Language & Multilingual Settings
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Lecture Language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full max-w-sm text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="en">English (US / UK / Global)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="hinglish">Hinglish (Roman Hindi)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        {/* Study Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Sliders className="w-4 h-4 mr-2 text-indigo-600" />
            Study Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Handwritten Paper Style
              </label>
              <select
                value={defaultPaperStyle}
                onChange={(e) => setDefaultPaperStyle(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white capitalize"
              >
                <option value="ruled">Ruled Paper</option>
                <option value="grid">Grid Graph Paper</option>
                <option value="plain">Plain White Paper</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Daily Study Duration
              </label>
              <select
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="1.0">1.0 Hour / Day</option>
                <option value="1.5">1.5 Hours / Day (Optimal)</option>
                <option value="2.0">2.0 Hours / Day</option>
                <option value="3.0">3.0 Hours / Day (Intensive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI & Infrastructure Architecture Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Cpu className="w-4 h-4 mr-2 text-indigo-600" />
            Configured Integrations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">LLM Provider</span>
              <span className="font-bold text-slate-800">OpenRouter (Nemotron 3)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">STT Engine</span>
              <span className="font-bold text-slate-800">Gnani Prisma STT v3</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Vector Store</span>
              <span className="font-bold text-slate-800">ChromaDB Persistent</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Embeddings</span>
              <span className="font-bold text-slate-800">all-MiniLM-L6-v2</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
          >
            Save Preferences
          </button>
          {saved && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Settings updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

