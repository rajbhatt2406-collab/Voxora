from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Transcript Segment
class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class TranscriptResponse(BaseModel):
    id: str
    lecture_id: str
    raw_text: str
    source_language: str
    segments: List[TranscriptSegment] = []
    translations: Dict[str, Any] = {}
    created_at: datetime

class TranslateRequest(BaseModel):
    target_language: str = Field(..., description="Language code e.g. 'hi', 'hinglish', 'es', 'fr', 'de'")

# Lecture Schemas
class YouTubeLectureCreate(BaseModel):
    url: str = Field(..., description="Valid YouTube Video URL")
    language: Optional[str] = "en"

class LectureResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    source_type: str
    source_url: Optional[str] = None
    duration_seconds: float = 0.0
    language: str = "en"
    status: str
    transcription_source: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Notes & Study Materials Schemas
class NoteCreateRequest(BaseModel):
    note_type: str = Field("detailed", description="'detailed', 'short', or 'topic_wise'")
    custom_prompt: Optional[str] = None

class NoteResponse(BaseModel):
    id: str
    lecture_id: str
    note_type: str
    title: str
    content: str
    structured_data: Optional[Dict[str, Any]] = None
    handwritten_pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class SummaryResponse(BaseModel):
    id: str
    lecture_id: str
    overview: str
    main_concepts: List[str]
    important_findings: List[str]
    key_takeaways: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionItem(BaseModel):
    question: str
    answer: str
    explanation: Optional[str] = None
    type: str = "conceptual"

class QuestionResponse(BaseModel):
    id: str
    lecture_id: str
    question_type: str
    question_text: str
    answer_text: str
    explanation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuizOption(BaseModel):
    id: str
    text: str

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizCreateRequest(BaseModel):
    difficulty: str = "Medium"
    num_questions: int = 5

class QuizResponse(BaseModel):
    id: str
    lecture_id: str
    title: str
    difficulty: str
    questions: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]

class QuizSubmitResponse(BaseModel):
    quiz_id: str
    score: float
    total_questions: int
    percentage: float
    review: List[Dict[str, Any]]

# Handwritten PDF Schema
class HandwrittenPdfRequest(BaseModel):
    text: Optional[str] = None  # If none, uses note.content
    font_style: str = Field("Caveat", description="'Caveat', 'IndieFlower', 'Kalam', 'PatrickHand'")
    font_size: int = Field(14, ge=10, le=24)
    ink_color: str = Field("#1A365D", description="Hex color e.g. #1A365D (Dark Blue), #0F172A (Black), #701A75 (Purple)")
    paper_style: str = Field("ruled", description="'ruled', 'plain', 'grid'")
    line_spacing: float = Field(1.5, ge=1.0, le=2.5)
    margin: int = Field(20, ge=10, le=40)
    page_background: str = Field("ivory", description="'ivory', 'white', 'parchment', 'yellow_legal'")

# Learning Plan Schemas
class LearningPlanCreateRequest(BaseModel):
    target_daily_hours: float = Field(1.5, ge=0.5, le=4.0)

class LearningSessionResponse(BaseModel):
    id: str
    day_number: int
    title: str
    description: Optional[str] = None
    start_time: float
    end_time: float
    is_completed: bool
    session_notes: Optional[str] = None
    session_quiz: Optional[List[Dict[str, Any]]] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LearningPlanResponse(BaseModel):
    id: str
    lecture_id: str
    title: str
    target_daily_hours: float
    total_days: int
    status: str
    created_at: datetime
    sessions: List[LearningSessionResponse] = []

    class Config:
        from_attributes = True

# RAG Ask Schema
class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2)

class CitationSource(BaseModel):
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    text: str
    similarity_score: Optional[float] = None

class AskQuestionResponse(BaseModel):
    question: str
    answer: str
    sources: List[CitationSource] = []

# Processing Job Status Schema
class JobStatusResponse(BaseModel):
    job_id: str
    lecture_id: Optional[str] = None
    task_name: str
    status: str
    progress: int
    message: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

