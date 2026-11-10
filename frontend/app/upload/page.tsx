'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  UploadCloud,
  FileAudio,
  FileVideo,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/services/api';

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLang, setYoutubeLang] = useState('en');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileLang, setFileLang] = useState('en');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi (हिंदी)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
  ];

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setStatusMessage('Validating YouTube video and retrieving accessible captions...');

      const lecture = await api.submitYouTube(youtubeUrl.trim(), youtubeLang);
      setStatusMessage('Lecture added! Processing transcript...');
      setTimeout(() => {
        router.push(`/lectures/${lecture.id}`);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process YouTube link.';
      setErrorMessage(msg);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setStatusMessage('Uploading media and preparing Gnani Prisma STT transcription...');

      const lecture = await api.uploadMedia(file, fileLang, fileTitle.trim() || undefined);
      setStatusMessage('Uploaded successfully! Redirecting to workspace...');
      setTimeout(() => {
        router.push(`/lectures/${lecture.id}`);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Media upload failed.';
      setErrorMessage(msg);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Upload Educational Lecture</h1>
        <p className="mt-2 text-sm text-slate-500">
          Paste a YouTube lecture link or upload your recorded video or audio file.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'youtube'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4 mr-2 text-rose-500" />
            YouTube Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4 mr-2 text-indigo-600" />
            Upload Video / Audio
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
        {activeTab === 'youtube' ? (
          <form onSubmit={handleYouTubeSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
              />
              <p className="mt-2 text-xs text-slate-400">
                Supports standard video URLs, youtu.be short links, and lecture playlists.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Preferred Lecture Language
              </label>
              <select
                value={youtubeLang}
                onChange={(e) => setYoutubeLang(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 bg-white"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all hover:shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Analyzing YouTube Video...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Process YouTube Lecture
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFileUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Lecture Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Systems Lecture 4"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
              />
            </div>

            {/* Drag & Drop Box */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Video or Audio File
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex space-x-3 text-slate-400 mb-3">
                  <FileVideo className="w-8 h-8" />
                  <FileAudio className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {file ? file.name : 'Click to select media or drag & drop'}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supported: MP4, MKV, MOV, WEBM, MP3, WAV, M4A, OGG
                </span>
                <input
                  type="file"
                  required
                  accept="audio/*,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Audio Spoken Language (Gnani Prisma STT)
              </label>
              <select
                value={fileLang}
                onChange={(e) => setFileLang(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 bg-white"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all hover:shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading &amp; Starting Pipeline...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Upload &amp; Transcribe with Gnani Prisma
                </>
              )}
            </button>
          </form>
        )}

        {/* Status / Error alerts */}
        {statusMessage && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center text-sm text-indigo-700">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
