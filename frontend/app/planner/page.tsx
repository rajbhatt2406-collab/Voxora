'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { Lecture, LearningPlan, LearningSession } from '@/types';

function PlannerContent() {
  const searchParams = useSearchParams();
  const initialLectureId = searchParams.get('lectureId');

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>(initialLectureId || '');
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [activePlan, setActivePlan] = useState<LearningPlan | null>(null);

  // Settings for new plan
  const [targetDailyHours, setTargetDailyHours] = useState<number>(1.5);
  const [creating, setCreating] = useState(false);

  // Load lectures
  useEffect(() => {
    api.getLectures().then((res) => {
      setLectures(res);
      if (res.length > 0 && !selectedLectureId) {
        setSelectedLectureId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  // Load plans for selected lecture
  const loadPlans = async (lecId: string) => {
    try {
      const p = await api.getLearningPlans(lecId);
      setPlans(p);
      if (p.length > 0) {
        setActivePlan(p[0]);
      } else {
        setActivePlan(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedLectureId) {
      loadPlans(selectedLectureId);
    }
  }, [selectedLectureId]);

  const handleCreatePlan = async () => {
    if (!selectedLectureId) return;
    try {
      setCreating(true);
      const newPlan = await api.createLearningPlan(selectedLectureId, targetDailyHours);
      setPlans((prev) => [newPlan, ...prev]);
      setActivePlan(newPlan);
    } catch (e: any) {
      alert(e.message || 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSession = async (sessionId: string) => {
    try {
      const res = await api.toggleSession(sessionId);
      if (activePlan) {
        const updatedSessions = activePlan.sessions.map((s) =>
          s.id === sessionId ? { ...s, is_completed: res.is_completed } : s
        );
        setActivePlan({ ...activePlan, sessions: updatedSessions });
      }
    } catch (e: any) {
      alert(e.message || 'Failed to toggle session');
    }
  };

  // Progress computation
  const totalSessions = activePlan?.sessions?.length || 0;
  const completedSessions = activePlan?.sessions?.filter((s) => s.is_completed).length || 0;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center">
            <CalendarDays className="w-7 h-7 text-indigo-600 mr-2.5" />
            Long Lecture Daily Study Planner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Divide dense 8-10 hour lectures into natural conceptual daily study sessions with checkpoint quizzes.
          </p>
        </div>

        {/* Lecture Selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedLectureId}
            onChange={(e) => setSelectedLectureId(e.target.value)}
            className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
          >
            {lectures.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activePlan ? (
        <div className="space-y-8">
          {/* Progress Header Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Active Schedule</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activePlan.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{activePlan.total_days} Daily Sessions</span>
                  <span>•</span>
                  <span>~{activePlan.target_daily_hours} hrs/day target</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-indigo-600">{progressPercent}%</span>
                <p className="text-xs text-slate-400">
                  {completedSessions} of {totalSessions} completed
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Daily Schedule Sessions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Daily Study Roadmap</h3>

            <div className="grid grid-cols-1 gap-4">
              {activePlan.sessions.map((session) => {
                const startM = Math.floor(session.start_time / 60);
                const endM = Math.floor(session.end_time / 60);
                return (
                  <div
                    key={session.id}
                    className={`p-6 rounded-2xl border transition-all ${
                      session.is_completed
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200/80 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={() => handleToggleSession(session.id)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${
                            session.is_completed
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-slate-300 text-transparent hover:border-indigo-600'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5 fill-current" />
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                              Day {session.day_number}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              [{startM}m - {endM}m]
                            </span>
                          </div>
                          <h4
                            className={`text-base font-bold text-slate-900 mt-0.5 ${
                              session.is_completed ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {session.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                            {session.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSession(session.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                          session.is_completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {session.is_completed ? 'Completed' : 'Mark Complete'}
                      </button>
                    </div>

                    {session.session_notes && (
                      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Key Study Objectives: </span>
                        {session.session_notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Create Plan Form */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 shadow-sm max-w-xl mx-auto text-center space-y-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarDays className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Generate a Daily Learning Plan</h3>
            <p className="text-sm text-slate-500 mt-1">
              Let AI analyze the topic transitions and formulate an achievable multi-day study schedule.
            </p>
          </div>

          <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Target Daily Study Duration</span>
              <span className="text-indigo-600 font-bold">{targetDailyHours} Hours</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.5"
              value={targetDailyHours}
              onChange={(e) => setTargetDailyHours(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>30 mins</span>
              <span>1.5 hrs (Recommended)</span>
              <span>3.0 hrs</span>
            </div>
          </div>

          <button
            onClick={handleCreatePlan}
            disabled={creating || !selectedLectureId}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-colors flex items-center justify-center"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing Lecture Boundaries...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Build My Daily Study Plan
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-slate-400">Loading Learning Planner...</div>}>
      <PlannerContent />
    </Suspense>
  );
}

