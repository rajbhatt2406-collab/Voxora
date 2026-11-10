# Voxora — Turn Every Video Into Knowledge

> **AI-powered learning platform** that converts YouTube lectures and uploaded video/audio into structured educational content.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13 (via Anaconda or standalone)
- Node.js v20+ and npm
- FFmpeg (already installed in this environment)
- Git

---

## 📁 Project Structure

```
voxora/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── core/config.py    # Pydantic settings
│   │   ├── api/routes/       # REST API endpoints
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # AI & external service integrations
│   │   ├── workflows/        # LangGraph processing pipeline
│   │   └── database/         # SQLite session management
│   ├── tests/                # Pytest test suite
│   ├── uploads/              # Uploaded media files (auto-created)
│   ├── generated/            # Generated PDFs (auto-created)
│   ├── chroma_db/            # ChromaDB vector store (auto-created)
│   ├── .env                  # API credentials (DO NOT COMMIT)
│   └── requirements.txt
└── frontend/         # Next.js 16 TypeScript frontend
    ├── app/          # Next.js App Router pages
    ├── components/   # Reusable React components
    ├── services/     # API client (api.ts)
    └── types/        # TypeScript type definitions
```

---

## ⚙️ Backend Setup

### 1. Environment Configuration

The `.env` file is in `backend/`. It already contains your credentials:
```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
GNANI_API_KEY=vach_1ytE2CY5X2Ee4...
GNANI_PRISMA_API_URL=https://api.vachana.ai/stt/v3
GNANI_TIMBRE_API_URL=https://api.vachana.ai/api/v1/tts/inference
DATABASE_URL=sqlite:///./voxora.db
CHROMA_DB_PATH=./chroma_db
APP_ENV=development
```

### 2. Install Backend Dependencies

Using the project virtual environment:
```powershell
c:\Voxora\.venv_py313\Scripts\python.exe -m pip install -r backend/requirements.txt
```

Or if starting fresh with your system Python:
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Start the Backend Server

```powershell
cd c:\Voxora\backend
..\venv_py313\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Or using the Voxora venv directly:**
```powershell
$env:PYTHONPATH="c:\Voxora\backend"
c:\Voxora\.venv_py313\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts at: **http://localhost:8000**  
Swagger API Docs: **http://localhost:8000/docs**

---

## ⚙️ Frontend Setup

### 1. Install Dependencies

```powershell
cd c:\Voxora\frontend
npm install
```

### 2. Configure API URL

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Start the Frontend

```powershell
cd c:\Voxora\frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🔑 API Keys Configuration

| Variable | Purpose | Source |
|---|---|---|
| `OPENROUTER_API_KEY` | Nemotron LLM for notes/quiz generation | https://openrouter.ai |
| `GNANI_API_KEY` | Gnani Prisma speech-to-text | https://api.vachana.ai |

> **Note:** Gnani Prisma is configured for uploaded video/audio. YouTube captions use the free `youtube-transcript-api` without an API key.

---

## ✨ Core Features

### 1. Smart Video & Audio Input
- Submit YouTube video URLs → retrieves available captions via `youtube-transcript-api`
- Upload MP4, MKV, MOV, MP3, WAV, M4A, OGG files
- FFmpeg audio extraction + normalization (16kHz mono WAV)
- Gnani Prisma STT transcription with timestamps
- Shows transcription source: *YouTube Captions* or *Gnani Prisma Transcription*

### 2. Multilingual Transcription & Translation
- Original transcript with timestamps preserved
- Translate to: Hindi, Hinglish, Spanish, French, German, Kannada, Tamil, Telugu
- Translations cached to avoid repeated API calls

### 3. AI Study Material Generator (OpenRouter + Nemotron)
- **Detailed Notes**: Topic headings, definitions, examples, key takeaways
- **Short Revision Notes**: Exam-focused bullet points, definitions, tips
- **Lecture Summary**: Overview, main concepts, findings, takeaways
- **Important Questions**: Conceptual, short-answer, long-answer with explanations
- **MCQ Quiz Generator**: 4-option questions, correct answer, explanation, difficulty levels
- Hierarchical summarization for 8-10 hour lectures (chunked processing)

### 4. Handwritten Notes PDF Generator
- Converts lecture notes to handwritten-style PDFs using fpdf2
- Paper styles: Ruled, Grid, Plain
- Paper backgrounds: Ivory, White, Parchment, Yellow Legal
- Customizable ink color, font size, line spacing, margins
- Live browser preview before PDF generation
- Download generated PDF

### 5. Long Lecture Daily Learning Planner
- Segments 8-10 hour lectures by natural topic boundaries
- Creates daily ~1.5 hour study sessions
- Per-session notes and checkpoint quizzes
- Track completed sessions with progress bar

### 6. AI Lecture Assistant (RAG)
- Local embeddings via `sentence-transformers/all-MiniLM-L6-v2`
- ChromaDB persistent vector storage per lecture
- Semantic retrieval of relevant transcript chunks
- Answers grounded strictly in lecture transcript
- Shows timestamp citations `[MM:SS]` for every answer
- Honest "not covered" response when answer not in lecture

---

## 🏗️ Technology Stack

### Backend
| Component | Technology |
|---|---|
| API Framework | FastAPI 0.162 |
| ORM & Database | SQLAlchemy 2.1 + SQLite |
| AI Orchestration | LangGraph 1.2 + LangChain 1.4 |
| LLM Provider | OpenRouter → Nvidia Nemotron 3 Ultra |
| Speech-to-Text | Gnani Prisma STT v3 |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 (local) |
| Vector Store | ChromaDB 1.5 (persistent) |
| Audio Processing | FFmpeg (system) |
| PDF Generation | fpdf2 2.9 |
| Validation | Pydantic 2.14 |

### Frontend
| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| State | React hooks (client components) |
| API Client | Fetch API (typed) |

---

## 🧪 Running Tests

```powershell
$env:PYTHONPATH="c:\Voxora\backend"
c:\Voxora\.venv_py313\Scripts\pytest.exe backend/tests/ -v
```

**Test coverage:**
- YouTube URL validation & video ID extraction
- Handwritten PDF generation (ruled paper, ink colors, ASCII normalization)
- FastAPI health check endpoint
- Lecture list endpoint
- YouTube URL rejection (invalid domain)
- YouTube URL acceptance (mocked metadata + background processing)
- 404 handling for nonexistent lectures and jobs

---

## 🔄 LangGraph Processing Pipeline

```
receive_input → validate_input → [YouTube?] → check_youtube_captions → generate_embeddings
                               → [Upload?]  → prepare_uploaded_media → extract_audio → prisma_transcription → generate_embeddings
```

---

## ⚠️ Known Limitations

1. **Gnani Prisma**: Requires valid API key and internet access. If the STT service is unreachable, an error is returned and the user is informed clearly.

2. **OpenRouter Nemotron model**: The free tier (`nvidia/nemotron-3-ultra-550b-a55b:free`) has rate limits. If unavailable, an error message is shown with model configuration instructions.

3. **YouTube captions**: Only publicly accessible captions can be retrieved. Private videos or videos with disabled captions cannot be transcribed this way — the user is prompted to upload their own authorized file instead.

4. **Local embeddings**: The first request downloads ~90MB sentence-transformers model. Subsequent requests use the cached model.

5. **SQLite**: Currently using SQLite for simplicity. The architecture is PostgreSQL-ready (`DATABASE_URL` can be swapped in `.env`).

6. **File storage**: Files are stored locally. The architecture supports migration to cloud object storage (S3/GCS).

---

## 📝 API Reference

Full interactive docs available at: **http://localhost:8000/docs**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/lectures/youtube` | Submit YouTube URL |
| POST | `/api/lectures/upload` | Upload video/audio file |
| GET | `/api/lectures` | List all lectures |
| GET | `/api/lectures/{id}` | Get lecture details |
| DELETE | `/api/lectures/{id}` | Delete lecture |
| GET | `/api/lectures/{id}/transcript` | Get transcript with timestamps |
| POST | `/api/lectures/{id}/translate` | Translate transcript |
| POST | `/api/lectures/{id}/generate-notes` | Generate detailed or short notes |
| POST | `/api/lectures/{id}/generate-summary` | Generate lecture summary |
| POST | `/api/lectures/{id}/generate-questions` | Generate Q&A |
| POST | `/api/lectures/{id}/generate-quiz` | Generate MCQ quiz |
| GET | `/api/lectures/{id}/materials` | Get all study materials |
| POST | `/api/notes/{id}/generate-pdf` | Generate handwritten PDF |
| GET | `/api/notes/download/{filename}` | Download PDF file |
| POST | `/api/lectures/{id}/create-learning-plan` | Create daily study plan |
| GET | `/api/lectures/{id}/learning-plans` | Get learning plans |
| PATCH | `/api/learning-sessions/{id}/toggle` | Toggle session completion |
| POST | `/api/lectures/{id}/ask` | Ask RAG-grounded question |
| POST | `/api/quizzes/{id}/submit` | Submit quiz answers |
| GET | `/api/jobs/{id}/status` | Check background job status |

---

## 🛡️ Security Notes

- API keys stored exclusively in backend `.env` file
- `.env` is listed in `.gitignore` — never committed
- File uploads validated by extension and MIME type
- Path traversal protection in file serving
- CORS configured for `localhost:3000`

---

*Built with ❤️ for students worldwide — Voxora v1.0.0*

