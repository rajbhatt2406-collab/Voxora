import {
  Lecture,
  Transcript,
  TranscriptSegment,
  Note,
  Summary,
  Question,
  Quiz,
  QuizSubmitResult,
  LearningPlan,
  AskQuestionResponse,
  HandwrittenPdfOptions
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = {
  // Lectures
  async getLectures(): Promise<Lecture[]> {
    const res = await fetch(`${API_BASE}/lectures`);
    if (!res.ok) throw new Error('Failed to load lectures');
    return res.json();
  },

  async getLecture(id: string): Promise<Lecture> {
    const res = await fetch(`${API_BASE}/lectures/${id}`);
    if (!res.ok) throw new Error('Failed to load lecture');
    return res.json();
  },

  async submitYouTube(url: string, language: string = 'en'): Promise<Lecture> {
    const res = await fetch(`${API_BASE}/lectures/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, language })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to submit YouTube video');
    }
    return res.json();
  },

  async uploadMedia(file: File, language: string = 'en', title?: string): Promise<Lecture> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/lectures/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Media upload failed');
    }
    return res.json();
  },

  async deleteLecture(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/lectures/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete lecture');
  },

  // Transcripts
  async getTranscript(lectureId: string): Promise<Transcript> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/transcript`);
    if (!res.ok) throw new Error('Failed to fetch transcript');
    return res.json();
  },

  async translateTranscript(
    lectureId: string,
    targetLanguage: string
  ): Promise<{ segments: TranscriptSegment[]; target_language?: string; text?: string }> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_language: targetLanguage })
    });
    if (!res.ok) throw new Error('Failed to translate transcript');
    return res.json();
  },

  // Study Materials
  async getMaterials(lectureId: string): Promise<{
    notes: Note[];
    summaries: Summary[];
    questions: Question[];
    quizzes: Quiz[];
  }> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/materials`);
    if (!res.ok) throw new Error('Failed to fetch materials');
    return res.json();
  },

  async generateNotes(lectureId: string, noteType: 'detailed' | 'short' = 'detailed'): Promise<Note> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/generate-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_type: noteType })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to generate notes');
    }
    return res.json();
  },

  async generateSummary(lectureId: string): Promise<Summary> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/generate-summary`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to generate summary');
    }
    return res.json();
  },

  async generateQuestions(lectureId: string): Promise<Question[]> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/generate-questions`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to generate questions');
    }
    return res.json();
  },

  async generateQuiz(lectureId: string, difficulty: string = 'Medium', numQuestions: number = 5): Promise<Quiz> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty, num_questions: numQuestions })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to generate quiz');
    }
    return res.json();
  },

  async submitQuiz(quizId: string, answers: Record<string, string>): Promise<QuizSubmitResult> {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    if (!res.ok) throw new Error('Failed to submit quiz');
    return res.json();
  },

  // Handwritten PDF
  async generateHandwrittenPdf(
    noteId: string,
    options: HandwrittenPdfOptions
  ): Promise<{ pdf_url: string; filename: string }> {
    const res = await fetch(`${API_BASE}/notes/${noteId}/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) throw new Error('Failed to generate handwritten PDF');
    return res.json();
  },

  // Learning Planner
  async getLearningPlans(lectureId: string): Promise<LearningPlan[]> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/learning-plans`);
    if (!res.ok) throw new Error('Failed to fetch learning plans');
    return res.json();
  },

  async createLearningPlan(lectureId: string, targetDailyHours: number = 1.5): Promise<LearningPlan> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/create-learning-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_daily_hours: targetDailyHours })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to create learning plan');
    }
    return res.json();
  },

  async toggleSession(sessionId: string): Promise<{ id: string; is_completed: boolean }> {
    const res = await fetch(`${API_BASE}/learning-sessions/${sessionId}/toggle`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to update session');
    return res.json();
  },

  // RAG Assistant
  async askQuestion(lectureId: string, question: string): Promise<AskQuestionResponse> {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Assistant query failed');
    }
    return res.json();
  }
};
