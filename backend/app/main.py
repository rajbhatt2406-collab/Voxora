import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.database.session import engine, Base
from app.api.routes import lectures

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("voxora")

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Voxora API",
    description="Backend API for Voxora: AI-Powered Lecture Learning Platform",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount generated static files directory for PDFs
app.mount("/static/generated", StaticFiles(directory=settings.GENERATED_DIR), name="generated")

# Register API routers
app.include_router(lectures.router, prefix="/api", tags=["Lectures & AI Learning"])

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "app": "Voxora",
        "version": "1.0.0",
        "tagline": "Turn Every Video Into Knowledge."
    }

@app.get("/api/notes/download/{filename}")
def download_pdf_file(filename: str):
    file_path = os.path.join(settings.GENERATED_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested PDF file not found")
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

