"""
API integration tests for Voxora backend.
ChromaDB and SentenceTransformer are mocked to avoid heavy filesystem/model loading.
"""
import sys
import pytest
from unittest.mock import patch, MagicMock

# ---------------------------------------------------------------------------
# Patch chromadb BEFORE importing the application so RAGService.__init__
# (which calls chromadb.PersistentClient) never touches real storage.
# ---------------------------------------------------------------------------
_mock_chroma_client = MagicMock()
_mock_chroma_client.get_or_create_collection.return_value = MagicMock()
_mock_chroma_client.list_collections.return_value = []

sys.modules.setdefault("chromadb", MagicMock())

with patch("chromadb.PersistentClient", return_value=_mock_chroma_client):
    from fastapi.testclient import TestClient
    from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_health_check():
    """API root returns healthy status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "Voxora"
    assert data["status"] == "healthy"


def test_get_lectures_returns_list():
    """GET /api/lectures returns a list (empty or populated)."""
    response = client.get("/api/lectures")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_youtube_invalid_url_rejected():
    """POST /api/lectures/youtube rejects non-YouTube URLs."""
    response = client.post(
        "/api/lectures/youtube",
        json={"url": "https://notyoutube.com/abc123"}
    )
    assert response.status_code == 400
    assert "Invalid YouTube URL" in response.json()["detail"]


def test_youtube_valid_url_accepted():
    """POST /api/lectures/youtube accepts a valid YouTube URL (mocked processing)."""
    with patch("app.api.routes.lectures.youtube_service.get_metadata") as mock_meta, \
         patch("app.api.routes.lectures.process_pipeline_background") as mock_bg:
        mock_meta.return_value = {
            "title": "Test Lecture on Machine Learning",
            "description": "A test ML lecture",
            "duration": 3600.0,
            "channel": "TestChannel",
            "thumbnail": ""
        }
        mock_bg.return_value = None

        response = client.post(
            "/api/lectures/youtube",
            json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "language": "en"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Lecture on Machine Learning"
        assert data["source_type"] == "youtube"
        assert data["status"] == "processing"


def test_get_nonexistent_lecture_returns_404():
    """GET /api/lectures/{id} with invalid ID returns 404."""
    response = client.get("/api/lectures/nonexistent-id-12345")
    assert response.status_code == 404


def test_jobs_nonexistent_returns_404():
    """GET /api/jobs/{id}/status with invalid ID returns 404."""
    response = client.get("/api/jobs/nonexistent-job-id/status")
    assert response.status_code == 404
