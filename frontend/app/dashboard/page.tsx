'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  BookOpen,
  Clock,
  Sparkles,
  ArrowRight,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/services/api';
import { Lecture } from '@/types';

export default function DashboardPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api.getLectures()
      .then((data) => {
        if (!ignore) {
          setLectures(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const refetchLectures = async () => {
    setLoading(true);
    try {
      const data = await api.getLectures();
      setLectures(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this lecture?')) return;
    try {
      await api.deleteLecture(id);
      setLectures((prev) => prev.filter((l) => l.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete lecture';
      alert(msg);
    }
  };

  // Metrics computation
  const totalLectures = lectures.length;
  const totalSeconds = lectures.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const completedCount = lectures.filter((l) => l.status === 'completed').length;
  const completionRate = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back to Voxora
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your lectures, review notes, and monitor your personalized study schedules.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:shadow"
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          Add Lecture
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Lectures</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{totalLectures}</p>
          <p className="mt-1 text-xs text-slate-500">{completedCount} processed &amp; ready</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lecture Material</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{totalHours} hrs</p>
          <p className="mt-1 text-xs text-slate-500">Total duration analyzed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{completionRate}%</p>
          <p className="mt-1 text-xs text-slate-500">Success rate across all files</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/planner"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 px-2.5 py-1 rounded-md"
            >
              Planner
            </Link>
            <Link
              href="/handwritten"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50/70 px-2.5 py-1 rounded-md"
            >
              Handwritten
            </Link>
          </div>
        </div>
      </div>

      {/* Lectures List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Lectures</h2>
            <p className="text-xs text-slate-500">Access transcripts, study notes, quizzes, and RAG chats</p>
          </div>
          <button
            onClick={refetchLectures}
            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-semibold gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p>Loading your lecture workspace...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-sm flex flex-col items-center">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-slate-400 mt-1">Make sure the backend server is running on the configured API URL.</p>
          </div>
        ) : lectures.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No lectures uploaded yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Submit a YouTube video link or upload an audio/video file to get started.
            </p>
            <Link
              href="/upload"
              className="mt-6 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              Upload Lecture
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {lectures.map((lecture) => (
              <Link
                key={lecture.id}
                href={`/lectures/${lecture.id}`}
                className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {lecture.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className="capitalize">{lecture.source_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{lecture.language.toUpperCase()}</span>
                      {lecture.transcription_source && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">{lecture.transcription_source}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(lecture.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      lecture.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : lecture.status === 'processing'
                        ? 'bg-amber-50 text-amber-700 animate-pulse'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {lecture.status}
                  </span>

                  <button
                    onClick={(e) => handleDelete(lecture.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete lecture"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
