import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lectures = relationship("Lecture", back_populates="user", cascade="all, delete-orphan")


class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(50), nullable=False)  # 'youtube', 'video_upload', 'audio_upload'
    source_url = Column(String(1000), nullable=True)
    file_path = Column(String(1000), nullable=True)
    audio_path = Column(String(1000), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    language = Column(String(20), default="en")
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    transcription_source = Column(String(100), nullable=True)  # 'YouTube Captions', 'Gnani Prisma Transcription'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="lectures")
    transcript = relationship("Transcript", uselist=False, back_populates="lecture", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="lecture", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="lecture", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="lecture", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="lecture", cascade="all, delete-orphan")
    learning_plans = relationship("LearningPlan", back_populates="lecture", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="lecture", cascade="all, delete-orphan")
    jobs = relationship("ProcessingJob", back_populates="lecture", cascade="all, delete-orphan")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), unique=True, nullable=False)
    raw_text = Column(Text, nullable=False)
    source_language = Column(String(20), default="en")
    # List of {"start": float, "end": float, "text": str}
    segments = Column(JSON, nullable=False, default=list)
    # Translated versions: {"hi": {"text": str, "segments": [...]}, "hinglish": {...}}
    translations = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="transcript")
    chunks = relationship("TranscriptChunk", back_populates="transcript", cascade="all, delete-orphan")


class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transcript_id = Column(String(36), ForeignKey("transcripts.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    start_time = Column(Float, nullable=True)
    end_time = Column(Float, nullable=True)
    content = Column(Text, nullable=False)
    chroma_id = Column(String(100), nullable=True)

    transcript = relationship("Transcript", back_populates="chunks")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=False)
    note_type = Column(String(50), default="detailed")  # 'detailed', 'short', 'topic_wise'
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)  # Markdown or structured text
    structured_data = Column(JSON, nullable=True)
    handwritten_pdf_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="notes")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=False)
    overview = Column(Text, nullable=False)
    main_concepts = Column(JSON, nullable=False, default=list)
    important_findings = Column(JSON, nullable=False, default=list)
    key_takeaways = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="summaries")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=False)
    question_type = Column(String(50), default="conceptual")  # 'short', 'long', 'conceptual'
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="questions")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=False)
    title = Column(String(500), nullable=False)
    difficulty = Column(String(50), default="Medium")  # Easy, Medium, Hard, Mixed
    # List of {"id": int/str, "question": str, "options": [str, str, str, str], "correct_answer": str, "explanation": str}
    questions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="quizzes")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_id = Column(String(36), ForeignKey("quizzes.id"), nullable=False)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    user_answers = Column(JSON, nullable=False, default=dict)
    completed_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="results")


class LearningPlan(Base):
    __tablename__ = "learning_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=False)
    title = Column(String(500), nullable=False)
    target_daily_hours = Column(Float, default=1.5)
    total_days = Column(Integer, default=1)
    status = Column(String(50), default="active")  # active, completed
    created_at = Column(DateTime, default=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="learning_plans")
    sessions = relationship("LearningSession", back_populates="learning_plan", cascade="all, delete-orphan")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_id = Column(String(36), ForeignKey("learning_plans.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(Float, default=0.0)  # lecture timestamp in seconds
    end_time = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    session_notes = Column(Text, nullable=True)
    session_quiz = Column(JSON, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    learning_plan = relationship("LearningPlan", back_populates="sessions")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=False)
    timestamp = Column(Float, nullable=False)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="bookmarks")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=True)
    task_name = Column(String(100), nullable=False)  # 'transcription', 'notes_generation', 'learning_plan'
    status = Column(String(50), default="queued")  # queued, in_progress, completed, failed
    progress = Column(Integer, default=0)  # 0 to 100 percentage
    message = Column(String(500), nullable=True)
    result_data = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lecture = relationship("Lecture", back_populates="jobs")

