import os
import uuid
import shutil
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.lecture import Lecture, Transcript, Note, Summary, Question, Quiz, QuizResult, LearningPlan, LearningSession, ProcessingJob
from app.schemas.lecture import (
    YouTubeLectureCreate,
    LectureResponse,
    TranscriptResponse,
    TranslateRequest,
    NoteCreateRequest,
    NoteResponse,
    NoteUpdateRequest,
    SummaryResponse,
    QuestionResponse,
    QuizCreateRequest,
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    HandwrittenPdfRequest,
    LearningPlanCreateRequest,
    LearningPlanResponse,
    AskQuestionRequest,
    AskQuestionResponse,
    JobStatusResponse
)
from app.core.config import settings
from app.services.youtube_service import youtube_service
from app.services.notes_service import notes_service
from app.services.translation_service import translation_service
from app.services.pdf_service import pdf_service
from app.services.rag_service import rag_service
from app.workflows.lecture_graph import lecture_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()

# ----------------- BACKGROUND WORKERS -----------------
def process_pipeline_background(job_id: str, lecture_id: str, db_session_factory):
    db: Session = db_session_factory()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not job or not lecture:
            return

        job.status = "in_progress"
        job.progress = 15
        job.message = "Executing LangGraph lecture workflow..."
        db.commit()

        initial_state = {
            "lecture_id": lecture.id,
            "source_type": lecture.source_type,
            "source_url": lecture.source_url,
            "file_path": lecture.file_path,
            "audio_path": lecture.audio_path,
            "language": lecture.language,
            "captions_available": False,
            "segments": [],
            "raw_text": "",
            "transcription_source": "",
            "is_long_lecture": (lecture.duration_seconds > 7200),
            "status": "starting",
            "error": None
        }

        result_state = lecture_pipeline.invoke(initial_state)

        if result_state.get("status") == "failed" or result_state.get("error"):
            err_msg = str(result_state.get("error") or "Processing failed")
            lecture.status = "failed"
            lecture.error_message = err_msg
            job.status = "failed"
            job.error = err_msg
            job.message = f"Failed: {err_msg}"
            db.commit()
            logger.error(f"Lecture {lecture.id} failed: {err_msg}")
            return

        segments = result_state.get("segments", [])
        raw_text = result_state.get("raw_text", "")
        source_label = result_state.get("transcription_source", "Transcribed")

        # Save transcript to database
        transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture.id).first()
        if not transcript:
            transcript = Transcript(
                lecture_id=lecture.id,
                raw_text=raw_text,
                source_language=lecture.language,
                segments=segments
            )
            db.add(transcript)
        else:
            transcript.raw_text = raw_text
            transcript.segments = segments

        lecture.status = "completed"
        lecture.transcription_source = source_label
        lecture.error_message = None
        job.status = "completed"
        job.progress = 100
        job.message = "Lecture transcription and vector indexing complete!"
        db.commit()
        logger.info(f"Lecture {lecture.id} successfully completed ({len(segments)} segments)")

    except Exception as e:
        logger.error(f"Background lecture processing failed: {e}")
        try:
            err_str = str(e)
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error = err_str
                job.message = f"Error: {err_str}"
            lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
            if lecture:
                lecture.status = "failed"
                lecture.error_message = err_str
            db.commit()
        except Exception:
            pass
    finally:
        db.close()


# ----------------- 1. LECTURES -----------------
@router.post("/lectures/youtube", response_model=LectureResponse)
def submit_youtube_lecture(
    payload: YouTubeLectureCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    video_id = youtube_service.extract_video_id(payload.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL. Please provide a valid video link.")

    meta = youtube_service.get_metadata(payload.url)

    lecture = Lecture(
        title=meta.get("title") or f"YouTube Lecture ({video_id})",
        description=meta.get("description", ""),
        source_type="youtube",
        source_url=payload.url,
        duration_seconds=meta.get("duration", 0.0),
        language=payload.language or "en",
        status="processing"
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    # Create tracked processing job
    job = ProcessingJob(
        lecture_id=lecture.id,
        task_name="transcription",
        status="queued",
        progress=5,
        message="Validating YouTube lecture and retrieving captions..."
    )
    db.add(job)
    db.commit()

    from app.database.session import SessionLocal
    background_tasks.add_task(process_pipeline_background, job.id, lecture.id, SessionLocal)

    return lecture


@router.post("/lectures/upload", response_model=LectureResponse)
async def upload_lecture_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("en"),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Validate extension
    filename = file.filename or "uploaded_media"
    ext = filename.split(".")[-1].lower()
    allowed_exts = ["mp3", "wav", "m4a", "ogg", "mp4", "mkv", "mov", "webm", "flac"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(allowed_exts)}"
        )

    # Safe destination path
    safe_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    source_type = "video_upload" if ext in ["mp4", "mkv", "mov", "webm"] else "audio_upload"

    lecture = Lecture(
        title=title or filename.rsplit(".", 1)[0],
        source_type=source_type,
        file_path=file_path,
        language=language,
        status="processing"
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    job = ProcessingJob(
        lecture_id=lecture.id,
        task_name="transcription",
        status="queued",
        progress=5,
        message="File uploaded safely. Initializing audio pipeline..."
    )
    db.add(job)
    db.commit()

    from app.database.session import SessionLocal
    background_tasks.add_task(process_pipeline_background, job.id, lecture.id, SessionLocal)

    return lecture


@router.get("/lectures", response_model=List[LectureResponse])
def get_lectures(db: Session = Depends(get_db)):
    return db.query(Lecture).order_by(Lecture.created_at.desc()).all()


@router.get("/lectures/{lecture_id}", response_model=LectureResponse)
def get_lecture(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.delete("/lectures/{lecture_id}")
def delete_lecture(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    # Clean up uploaded media file if exists
    if lecture.file_path and os.path.exists(lecture.file_path):
        try:
            os.remove(lecture.file_path)
        except Exception:
            pass
    db.delete(lecture)
    db.commit()
    return {"message": "Lecture deleted successfully"}


# ----------------- 2. TRANSCRIPTS & TRANSLATION -----------------
@router.get("/lectures/{lecture_id}/transcript", response_model=TranscriptResponse)
def get_transcript(lecture_id: str, db: Session = Depends(get_db)):
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not ready or not found for this lecture")
    return transcript


@router.post("/lectures/{lecture_id}/translate")
def translate_transcript_endpoint(
    lecture_id: str,
    payload: TranslateRequest,
    db: Session = Depends(get_db)
):
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript or not transcript.segments:
        raise HTTPException(status_code=404, detail="Transcript not found or empty")

    target_lang = payload.target_language.lower()
    translations = transcript.translations or {}

    # Check cache
    if target_lang in translations:
        return translations[target_lang]

    result = translation_service.translate_segments(transcript.segments, target_lang)
    translations[target_lang] = result
    transcript.translations = dict(translations)
    db.commit()
    return result


# ----------------- 3. STUDY MATERIALS GENERATION -----------------
@router.post("/lectures/{lecture_id}/generate-notes", response_model=NoteResponse)
def generate_notes_endpoint(
    lecture_id: str,
    payload: NoteCreateRequest,
    db: Session = Depends(get_db)
):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not lecture or not transcript or not transcript.raw_text:
        raise HTTPException(status_code=400, detail="Lecture transcript is required before generating notes")

    if payload.note_type == "short":
        data = notes_service.generate_short_notes(transcript.raw_text, lecture.title)
        content = data.get("markdown_content") or str(data)
        note = Note(
            lecture_id=lecture.id,
            note_type="short",
            title=data.get("title", f"Short Notes: {lecture.title}"),
            content=content,
            structured_data=data
        )
    else:
        data = notes_service.generate_detailed_notes(transcript.raw_text, lecture.title)
        content = data.get("markdown_content") or str(data)
        note = Note(
            lecture_id=lecture.id,
            note_type="detailed",
            title=data.get("title", f"Detailed Notes: {lecture.title}"),
            content=content,
            structured_data=data
        )

    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.post("/lectures/{lecture_id}/generate-summary", response_model=SummaryResponse)
def generate_summary_endpoint(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript or not transcript.raw_text:
        raise HTTPException(status_code=400, detail="Transcript is required to generate summary")

    data = notes_service.generate_summary(transcript.raw_text)
    summary = Summary(
        lecture_id=lecture.id,
        overview=data.get("overview", ""),
        main_concepts=data.get("main_concepts", []),
        important_findings=data.get("important_findings", []),
        key_takeaways=data.get("key_takeaways", [])
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.post("/lectures/{lecture_id}/generate-questions", response_model=List[QuestionResponse])
def generate_questions_endpoint(lecture_id: str, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript or not transcript.raw_text:
        raise HTTPException(status_code=400, detail="Transcript is required to generate questions")

    questions_data = notes_service.generate_questions(transcript.raw_text)
    created_questions = []

    for q_item in questions_data:
        q = Question(
            lecture_id=lecture.id,
            question_type=q_item.get("type", "conceptual"),
            question_text=q_item.get("question", ""),
            answer_text=q_item.get("answer", ""),
            explanation=q_item.get("explanation", "")
        )
        db.add(q)
        created_questions.append(q)

    db.commit()
    for q in created_questions:
        db.refresh(q)
    return created_questions


@router.post("/lectures/{lecture_id}/generate-quiz", response_model=QuizResponse)
def generate_quiz_endpoint(
    lecture_id: str,
    payload: QuizCreateRequest,
    db: Session = Depends(get_db)
):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not transcript or not transcript.raw_text:
        raise HTTPException(status_code=400, detail="Transcript is required to generate quiz")

    questions_list = notes_service.generate_quiz(
        raw_text=transcript.raw_text,
        difficulty=payload.difficulty,
        num_questions=payload.num_questions
    )

    quiz = Quiz(
        lecture_id=lecture.id,
        title=f"{payload.difficulty} Quiz: {lecture.title}",
        difficulty=payload.difficulty,
        questions=questions_list
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz_endpoint(
    quiz_id: str,
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    correct_count = 0
    review = []
    user_answers = payload.answers

    for q in quiz.questions:
        qid = str(q.get("id"))
        user_ans = user_answers.get(qid, "")
        correct_ans = q.get("correct_answer", "")
        is_correct = (user_ans.strip().lower() == correct_ans.strip().lower())

        if is_correct:
            correct_count += 1

        review.append({
            "id": qid,
            "question": q.get("question"),
            "user_answer": user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation")
        })

    total = len(quiz.questions)
    percentage = round((correct_count / total * 100.0), 1) if total > 0 else 0.0

    result = QuizResult(
        quiz_id=quiz.id,
        score=float(correct_count),
        total_questions=total,
        user_answers=user_answers
    )
    db.add(result)
    db.commit()

    return QuizSubmitResponse(
        quiz_id=quiz.id,
        score=float(correct_count),
        total_questions=total,
        percentage=percentage,
        review=review
    )


@router.get("/lectures/{lecture_id}/materials")
def get_all_materials(lecture_id: str, db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.lecture_id == lecture_id).all()
    summaries = db.query(Summary).filter(Summary.lecture_id == lecture_id).all()
    questions = db.query(Question).filter(Question.lecture_id == lecture_id).all()
    quizzes = db.query(Quiz).filter(Quiz.lecture_id == lecture_id).all()

    return {
        "notes": notes,
        "summaries": summaries,
        "questions": questions,
        "quizzes": quizzes
    }


# ----------------- 4. HANDWRITTEN NOTES GENERATOR -----------------
@router.post("/notes/{note_id}/generate-pdf")
def generate_handwritten_pdf_endpoint(
    note_id: str,
    payload: HandwrittenPdfRequest,
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    content_to_render = payload.text or note.content

    pdf_filename = pdf_service.generate_handwritten_pdf(
        content=content_to_render,
        title=note.title,
        font_style=payload.font_style,
        font_size=payload.font_size,
        ink_color=payload.ink_color,
        paper_style=payload.paper_style,
        line_spacing=payload.line_spacing,
        margin=payload.margin,
        page_background=payload.page_background
    )

    pdf_url = f"/api/notes/download/{pdf_filename}"
    note.handwritten_pdf_url = pdf_url
    db.commit()

    return {
        "pdf_url": pdf_url,
        "filename": pdf_filename,
        "message": "Handwritten PDF generated successfully"
    }


# ----------------- 5. LONG LECTURE TO DAILY LEARNING PLAN -----------------
@router.post("/lectures/{lecture_id}/create-learning-plan", response_model=LearningPlanResponse)
def create_learning_plan_endpoint(
    lecture_id: str,
    payload: LearningPlanCreateRequest,
    db: Session = Depends(get_db)
):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
    if not lecture or not transcript or not transcript.raw_text:
        raise HTTPException(status_code=400, detail="Transcript is required to build a learning plan")

    plan_data = notes_service.create_learning_plan(
        raw_text=transcript.raw_text,
        total_duration_seconds=lecture.duration_seconds,
        target_daily_hours=payload.target_daily_hours
    )

    plan = LearningPlan(
        lecture_id=lecture.id,
        title=plan_data.get("plan_title", f"Daily Learning Plan: {lecture.title}"),
        target_daily_hours=payload.target_daily_hours,
        total_days=plan_data.get("total_days", 5)
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    sessions_raw = plan_data.get("sessions", [])
    created_sessions = []

    for s in sessions_raw:
        session_obj = LearningSession(
            plan_id=plan.id,
            day_number=s.get("day_number", 1),
            title=s.get("title", f"Day {s.get('day_number', 1)}"),
            description=s.get("description", ""),
            start_time=float(s.get("start_time", 0.0)),
            end_time=float(s.get("end_time", 0.0)),
            is_completed=False,
            session_notes=s.get("session_notes"),
            session_quiz=s.get("session_quiz")
        )
        db.add(session_obj)
        created_sessions.append(session_obj)

    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/learning-sessions/{session_id}/toggle")
def toggle_session_complete(session_id: str, db: Session = Depends(get_db)):
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Learning session not found")
    session.is_completed = not session.is_completed
    db.commit()
    return {"id": session.id, "is_completed": session.is_completed}


@router.get("/lectures/{lecture_id}/learning-plans", response_model=List[LearningPlanResponse])
def get_lecture_learning_plans(lecture_id: str, db: Session = Depends(get_db)):
    return db.query(LearningPlan).filter(LearningPlan.lecture_id == lecture_id).all()


# ----------------- 6. AI LECTURE ASSISTANT (RAG) -----------------
@router.post("/lectures/{lecture_id}/ask", response_model=AskQuestionResponse)
def ask_lecture_question_endpoint(
    lecture_id: str,
    payload: AskQuestionRequest,
    db: Session = Depends(get_db)
):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    result = rag_service.query_lecture(lecture_id=lecture.id, question=payload.question)
    return result


# ----------------- 7. JOBS & STATUS -----------------
@router.get("/jobs/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.id,
        lecture_id=job.lecture_id,
        task_name=job.task_name,
        status=job.status,
        progress=job.progress,
        message=job.message,
        result_data=job.result_data,
        error=job.error
    )

