import logging
from typing import Dict, Any, TypedDict, Optional
from langgraph.graph import StateGraph, END
from app.services.youtube_service import youtube_service
from app.services.gnani_prisma_service import gnani_prisma_service
from app.services.rag_service import rag_service
from app.utils.media import extract_audio_from_video

logger = logging.getLogger(__name__)

class LectureWorkflowState(TypedDict):
    lecture_id: str
    source_type: str  # 'youtube', 'video_upload', 'audio_upload'
    source_url: Optional[str]
    file_path: Optional[str]
    audio_path: Optional[str]
    language: str
    captions_available: bool
    segments: list
    raw_text: str
    transcription_source: str
    is_long_lecture: bool
    status: str
    error: Optional[str]

# 1. receive_input
def node_receive_input(state: LectureWorkflowState) -> Dict[str, Any]:
    logger.info(f"Node [receive_input]: Processing Lecture {state.get('lecture_id')}")
    return {"status": "validating"}

# 2. validate_input
def node_validate_input(state: LectureWorkflowState) -> Dict[str, Any]:
    st = state.get("source_type")
    if st == "youtube" and not state.get("source_url"):
        return {"status": "failed", "error": "Missing YouTube video URL."}
    if st in ("video_upload", "audio_upload") and not state.get("file_path"):
        return {"status": "failed", "error": "Missing media file path on server."}
    return {"status": "validated"}

# 3. Router
def route_input_type(state: LectureWorkflowState) -> str:
    if state.get("status") == "failed":
        return "failed"
    if state.get("source_type") == "youtube":
        return "check_youtube_captions"
    return "prepare_uploaded_media"

# 4. check_youtube_captions
def node_check_youtube_captions(state: LectureWorkflowState) -> Dict[str, Any]:
    url = state["source_url"]
    video_id = youtube_service.extract_video_id(url)
    if not video_id:
        return {
            "status": "failed",
            "error": f"Invalid YouTube URL: {url}. Please provide a valid watch, embed, or shorts link.",
            "captions_available": False
        }
    try:
        segments = youtube_service.fetch_transcript(
            video_id=video_id,
            preferred_lang=state.get("language", "en"),
            source_url=url
        )
        return {
            "captions_available": True,
            "segments": segments,
            "raw_text": " ".join([s["text"] for s in segments]),
            "transcription_source": "YouTube Captions",
            "status": "transcription_complete"
        }
    except Exception as e:
        logger.warning(f"YouTube captions retrieval failed for {video_id}: {e}")
        return {
            "captions_available": False,
            "status": "failed",
            "error": str(e)
        }

def route_youtube_captions(state: LectureWorkflowState) -> str:
    if state.get("status") == "failed" or not state.get("captions_available"):
        return "failed"
    return "generate_embeddings"

# 5. prepare_uploaded_media
def node_prepare_uploaded_media(state: LectureWorkflowState) -> Dict[str, Any]:
    logger.info("Node [prepare_uploaded_media]: Preparing uploaded media for transcription")
    file_path = state.get("file_path")
    return {"status": "needs_audio_extraction", "audio_path": file_path}

def route_media_preparation(state: LectureWorkflowState) -> str:
    if state.get("status") == "failed":
        return "failed"
    return "extract_audio"

# 6. extract_audio
def node_extract_audio(state: LectureWorkflowState) -> Dict[str, Any]:
    try:
        file_path = state.get("file_path")
        logger.info(f"Node [extract_audio]: Normalizing {file_path} to 16kHz mono WAV")
        audio_path = extract_audio_from_video(file_path)
        return {"audio_path": audio_path, "status": "audio_extracted"}
    except Exception as e:
        logger.error(f"FFmpeg extraction error: {e}")
        return {"status": "failed", "error": f"FFmpeg audio extraction failed: {str(e)}"}

def route_extracted_audio(state: LectureWorkflowState) -> str:
    if state.get("status") == "failed":
        return "failed"
    return "prisma_transcription"

# 7. prisma_transcription
def node_prisma_transcription(state: LectureWorkflowState) -> Dict[str, Any]:
    audio_path = state.get("audio_path")
    try:
        logger.info(f"Node [prisma_transcription]: Submitting {audio_path} to Gnani Prisma STT")
        segments = gnani_prisma_service.transcribe_audio(
            audio_file_path=audio_path,
            language=state.get("language", "en")
        )
        return {
            "segments": segments,
            "raw_text": " ".join([s["text"] for s in segments]),
            "transcription_source": "Gnani Prisma Transcription",
            "status": "transcription_complete"
        }
    except Exception as e:
        logger.error(f"Gnani Prisma transcription error: {e}")
        return {"status": "failed", "error": str(e)}

def route_prisma_transcription(state: LectureWorkflowState) -> str:
    if state.get("status") == "failed" or not state.get("segments"):
        return "failed"
    return "generate_embeddings"

# 8. generate_embeddings & store_vectors
def node_generate_embeddings(state: LectureWorkflowState) -> Dict[str, Any]:
    lecture_id = state.get("lecture_id")
    segments = state.get("segments", [])
    try:
        logger.info(f"Node [generate_embeddings]: Indexing {len(segments)} segments into ChromaDB")
        rag_service.index_transcript(lecture_id, segments)
        return {"status": "completed"}
    except Exception as e:
        logger.error(f"Vector indexing node warning: {e}")
        # Non-fatal for the transcript itself, mark completed
        return {"status": "completed"}

def build_lecture_workflow():
    workflow = StateGraph(LectureWorkflowState)

    workflow.add_node("receive_input", node_receive_input)
    workflow.add_node("validate_input", node_validate_input)
    workflow.add_node("check_youtube_captions", node_check_youtube_captions)
    workflow.add_node("prepare_uploaded_media", node_prepare_uploaded_media)
    workflow.add_node("extract_audio", node_extract_audio)
    workflow.add_node("prisma_transcription", node_prisma_transcription)
    workflow.add_node("generate_embeddings", node_generate_embeddings)

    workflow.set_entry_point("receive_input")
    workflow.add_edge("receive_input", "validate_input")

    workflow.add_conditional_edges(
        "validate_input",
        route_input_type,
        {
            "check_youtube_captions": "check_youtube_captions",
            "prepare_uploaded_media": "prepare_uploaded_media",
            "failed": END
        }
    )

    workflow.add_conditional_edges(
        "check_youtube_captions",
        route_youtube_captions,
        {
            "generate_embeddings": "generate_embeddings",
            "failed": END
        }
    )

    workflow.add_conditional_edges(
        "prepare_uploaded_media",
        route_media_preparation,
        {
            "extract_audio": "extract_audio",
            "failed": END
        }
    )

    workflow.add_conditional_edges(
        "extract_audio",
        route_extracted_audio,
        {
            "prisma_transcription": "prisma_transcription",
            "failed": END
        }
    )

    workflow.add_conditional_edges(
        "prisma_transcription",
        route_prisma_transcription,
        {
            "generate_embeddings": "generate_embeddings",
            "failed": END
        }
    )

    workflow.add_edge("generate_embeddings", END)

    return workflow.compile()

lecture_pipeline = build_lecture_workflow()
