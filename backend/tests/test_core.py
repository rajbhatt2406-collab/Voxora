import os
import pytest
from app.services.youtube_service import youtube_service
from app.services.pdf_service import pdf_service

def test_youtube_video_id_extraction():
    url1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    url2 = "https://youtu.be/dQw4w9WgXcQ?t=10"
    url3 = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    url4 = "https://www.youtube.com/shorts/dQw4w9WgXcQ"

    assert youtube_service.extract_video_id(url1) == "dQw4w9WgXcQ"
    assert youtube_service.extract_video_id(url2) == "dQw4w9WgXcQ"
    assert youtube_service.extract_video_id(url3) == "dQw4w9WgXcQ"
    assert youtube_service.extract_video_id(url4) == "dQw4w9WgXcQ"
    assert youtube_service.extract_video_id("https://google.com") is None

def test_handwritten_pdf_generation():
    test_content = (
        "# Introduction to Quantum Mechanics\n\n"
        "## Wave-Particle Duality\n"
        "Matter exhibits properties of both particles and waves.\n\n"
        "- De Broglie wavelength: lambda = h / p\n"
        "- Heisenberg uncertainty principle: delta_x * delta_p >= hbar / 2\n\n"
        "### Key Takeaways\n"
        "Observation collapses the probability wave function."
    )
    filename = pdf_service.generate_handwritten_pdf(
        content=test_content,
        title="Physics Lecture Notes",
        font_style="Caveat",
        ink_color="#1A365D",
        paper_style="ruled",
        page_background="ivory"
    )
    assert filename.endswith(".pdf")
    from app.core.config import settings
    pdf_full_path = os.path.join(settings.GENERATED_DIR, filename)
    assert os.path.exists(pdf_full_path)
    assert os.path.getsize(pdf_full_path) > 1000  # valid pdf file

