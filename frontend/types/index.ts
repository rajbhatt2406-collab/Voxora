export interface Lecture {
  id: string;
  title: string;
  description?: string;
  source_type: 'youtube' | 'video_upload' | 'audio_upload';
  source_url?: string;
  duration_seconds: number;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcription_source?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id: string;
  lecture_id: string;
  raw_text: string;
  source_language: string;
  segments: TranscriptSegment[];
  translations?: Record<string, { text: string; segments: TranscriptSegment[] }>;
  created_at: string;
}

export interface Note {
  id: string;
  lecture_id: string;
  note_type: 'detailed' | 'short' | 'topic_wise';
  title: string;
  content: string;
  structured_data?: Record<string, unknown>;
  handwritten_pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Summary {
  id: string;
  lecture_id: string;
  overview: string;
  main_concepts: string[];
  important_findings: string[];
  key_takeaways: string[];
  created_at: string;
}

export interface Question {
  id: string;
  lecture_id: string;
  question_type: 'conceptual' | 'short' | 'long';
  question_text: string;
  answer_text: string;
  explanation?: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  lecture_id: string;
  title: string;
  difficulty: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizSubmitReview {
  id: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

export interface QuizSubmitResult {
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  review: QuizSubmitReview[];
}

export interface LearningSession {
  id: string;
  day_number: number;
  title: string;
  description?: string;
  start_time: number;
  end_time: number;
  is_completed: boolean;
  session_notes?: string;
  session_quiz?: QuizQuestion[];
  completed_at?: string;
}

export interface LearningPlan {
  id: string;
  lecture_id: string;
  title: string;
  target_daily_hours: number;
  total_days: number;
  status: string;
  created_at: string;
  sessions: LearningSession[];
}

export interface CitationSource {
  start_time?: number;
  end_time?: number;
  text: string;
  similarity_score?: number;
}

export interface AskQuestionResponse {
  question: string;
  answer: string;
  sources: CitationSource[];
}

export interface JobStatus {
  job_id: string;
  lecture_id?: string;
  task_name: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result_data?: Record<string, unknown>;
  error?: string;
}

export interface HandwrittenPdfOptions {
  text?: string;
  font_style?: string;
  font_size?: number;
  ink_color?: string;
  paper_style?: string;
  line_spacing?: number;
  margin?: number;
  page_background?: string;
  [key: string]: unknown;
}
