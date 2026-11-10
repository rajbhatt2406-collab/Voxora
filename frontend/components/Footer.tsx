import React from 'react';
import Link from 'next/link';
import { GraduationCap, Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-800">Voxora</span>
              <p className="text-xs text-slate-500">Turn Every Video Into Knowledge.</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <Link href="/upload" className="hover:text-indigo-600 transition-colors">Upload</Link>
            <Link href="/planner" className="hover:text-indigo-600 transition-colors">Learning Planner</Link>
            <Link href="/handwritten" className="hover:text-indigo-600 transition-colors">Handwritten Notes</Link>
          </div>

          <div className="text-xs text-slate-400 flex items-center">
            <span>Built for students worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

