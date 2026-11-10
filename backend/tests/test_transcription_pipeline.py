"""
Targeted tests for Voxora Transcription Pipeline.
Tests both YouTube caption retrieval and Gnani Prisma STT audio processing independently.
"""
import os
import io
import wave
import struct
import pytest
from unittest.mock import patch, MagicMock

from app.services.youtube_service import youtube_service
from app.services.gnani_prisma_service import gnani_prisma_service
from app.utils.media import extract_audio_from_video, slice_audio, get_media_duration, cleanup_temp_chunks

# ---------------------------------------------------------------------------
# TEST A: YOUTUBE CAPTION RETRIEVAL WORKFLOW
# ---------------------------------------------------------------------------

def test_youtube_url_variants_id_extraction():
    """Validates ID extraction across standard, short, embed, and shorts YouTube URLs."""
    urls = {
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ": "dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ?si=abcdef12345": "dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ": "dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ": "dQw4w9WgXcQ",
        "https://www.youtube.com/v/dQw4w9WgXcQ": "dQw4w9WgXcQ",
    }
    for url, expected_id in urls.items():
        assert youtube_service.extract_video_id(url) == expected_id

    # Invalid URLs
    assert youtube_service.extract_video_id("https://vimeo.com/123456") is None
    assert youtube_service.extract_video_id("not-a-url") is None
    assert youtube_service.extract_video_id("") is None


def test_youtube_caption_retrieval_success_mocked():
    """Validates YouTube caption parsing and formatting into normalized segments."""
    mock_snippet_1 = MagicMock(start=0.0, duration=4.5, text="Welcome to the machine learning lecture.")
    mock_snippet_2 = MagicMock(start=4.5, duration=5.0, text="Today we discuss gradient descent.")

    mock_transcript = MagicMock()
    mock_transcript.fetch.return_value = [mock_snippet_1, mock_snippet_2]

    mock_transcript_list = MagicMock()
    mock_transcript_list.find_manually_created_transcript.return_value = mock_transcript

    with patch("app.services.youtube_service.YouTubeTranscriptApi") as mock_api_cls:
        mock_instance = MagicMock()
        mock_instance.list.return_value = mock_transcript_list
        mock_api_cls.return_value = mock_instance

        segments = youtube_service.fetch_transcript("mockVideo123", preferred_lang="en")

        assert len(segments) == 2
        assert segments[0]["start"] == 0.0
        assert segments[0]["end"] == 4.5
        assert segments[0]["text"] == "Welcome to the machine learning lecture."
        assert segments[1]["start"] == 4.5
        assert segments[1]["end"] == 9.5
        assert segments[1]["text"] == "Today we discuss gradient descent."


def test_youtube_unplayable_video_informative_error():
    """Validates that unplayable videos (members-only, private) raise clear, descriptive errors."""
    from youtube_transcript_api._errors import VideoUnplayable

    with patch("app.services.youtube_service.YouTubeTranscriptApi") as mock_api_cls:
        mock_instance = MagicMock()
        mock_instance.list.side_effect = VideoUnplayable("testId", "Members-only content", ["sub_reason"])
        mock_api_cls.return_value = mock_instance

        with pytest.raises(RuntimeError) as exc_info:
            youtube_service.fetch_transcript("testId", preferred_lang="en")

        assert "unplayable" in str(exc_info.value).lower()
        assert "upload" in str(exc_info.value).lower()


def test_youtube_missing_captions_informative_error():
    """Validates that videos without captions raise clear, descriptive instructions to upload media."""
    from youtube_transcript_api._errors import NoTranscriptFound

    with patch("app.services.youtube_service.YouTubeTranscriptApi") as mock_api_cls, \
         patch("app.services.youtube_service.YoutubeLoader") as mock_loader_cls:
        mock_instance = MagicMock()
        mock_instance.list.side_effect = NoTranscriptFound("testId", ["en"], {})
        mock_api_cls.return_value = mock_instance

        mock_loader = MagicMock()
        mock_loader.load.return_value = []
        mock_loader_cls.from_youtube_url.return_value = mock_loader

        with pytest.raises(RuntimeError) as exc_info:
            youtube_service.fetch_transcript("testId", preferred_lang="en")

        assert "captions" in str(exc_info.value).lower()
        assert "upload" in str(exc_info.value).lower()


# ---------------------------------------------------------------------------
# TEST B: AUDIO / VIDEO UPLOAD & GNANI PRISMA STT WORKFLOW
# ---------------------------------------------------------------------------

def test_audio_normalization_and_duration(tmp_path):
    """Generates synthetic WAV audio and validates normalization and duration retrieval."""
    test_wav = str(tmp_path / "sample.wav")
    with wave.open(test_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        samples = [0] * (16000 * 3)  # 3 seconds
        wf.writeframes(struct.pack("<" + ("h" * len(samples)), *samples))

    dur = get_media_duration(test_wav)
    assert 2.8 <= dur <= 3.2

    norm_wav = extract_audio_from_video(test_wav)
    assert os.path.exists(norm_wav)
    assert os.path.getsize(norm_wav) > 0


def test_audio_slicing_respects_gnani_30s_limit(tmp_path):
    """Validates that audio exceeding 28s is cleanly sliced into chunks of <= 28s."""
    test_wav = str(tmp_path / "long_sample.wav")
    with wave.open(test_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        samples = [0] * (16000 * 65)  # 65 seconds
        wf.writeframes(struct.pack("<" + ("h" * len(samples)), *samples))

    chunks = slice_audio(test_wav, chunk_duration_sec=28.0)
    assert len(chunks) == 3  # 0-28s, 28-56s, 56-65s
    assert chunks[0]["start_sec"] == 0.0
    assert chunks[0]["duration_sec"] == 28.0
    assert chunks[1]["start_sec"] == 28.0
    assert chunks[2]["start_sec"] == 56.0

    cleanup_temp_chunks(chunks)
    for c in chunks:
        if c.get("is_temp"):
            assert not os.path.exists(c["chunk_path"])


def test_gnani_prisma_request_headers_and_parsing(tmp_path):
    """Validates that Gnani Prisma STT sends X-API-Key-ID and parses chunk timestamps correctly."""
    test_wav = str(tmp_path / "test_prisma.wav")
    with wave.open(test_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        samples = [0] * (16000 * 5)
        wf.writeframes(struct.pack("<" + ("h" * len(samples)), *samples))

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "success": True,
        "transcript": "Hello and welcome to the database lecture.",
        "model": "prisma-v3.0"
    }

    with patch("requests.post", return_value=mock_resp) as mock_post:
        segments = gnani_prisma_service.transcribe_audio(test_wav, language="en")

        # Verify X-API-Key-ID header was sent
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args[1]
        assert "X-API-Key-ID" in call_kwargs["headers"]
        assert call_kwargs["data"]["language_code"] == "en-IN"
        assert call_kwargs["data"]["model"] == "prisma-v3.0"

        # Verify parsed segments
        assert len(segments) == 1
        assert segments[0]["start"] == 0.0
        assert segments[0]["text"] == "Hello and welcome to the database lecture."


def test_gnani_prisma_authentication_failure_handling(tmp_path):
    """Validates that HTTP 401 raises an actionable authentication error message."""
    test_wav = str(tmp_path / "test_auth_fail.wav")
    with wave.open(test_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        samples = [0] * (16000 * 2)
        wf.writeframes(struct.pack("<" + ("h" * len(samples)), *samples))

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = '{"error": "MISSING_API_KEY"}'

    with patch("requests.post", return_value=mock_resp):
        with pytest.raises(RuntimeError) as exc_info:
            gnani_prisma_service.transcribe_audio(test_wav, language="en")

        assert "authentication failed" in str(exc_info.value).lower()
        assert "gnani_api_key" in str(exc_info.value).lower()
