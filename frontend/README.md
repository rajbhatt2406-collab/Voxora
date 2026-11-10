# Voxora — Frontend Application

Modern AI-powered lecture learning workspace built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 🌟 Overview

The Voxora frontend provides an intuitive, responsive workspace for students and researchers to turn lecture videos and audio recordings into structured academic knowledge:

- **Interactive Lecture Workspace:** Tabbed workspace featuring lecture overview, timestamped transcripts, multi-language translation, detailed academic notes, short revision notes, summaries, Q&As, interactive 4-choice quizzes with explanations, and a grounded RAG AI tutor.
- **Handwritten Notes Studio:** Interactive editor and real-time canvas preview for generating realistic ruled, grid, or plain handwritten-style PDF study sheets with customizable ink colors, typography, margins, and paper textures.
- **Daily Study Planner:** Breaks down dense 8–10 hour marathon lectures into manageable daily milestones with progress tracking and checkpoint quizzes.
- **Multilingual Support:** Transcribe and translate lecture transcripts into English, Hindi, Hinglish, Spanish, French, German, and regional Indian languages.
- **Universal Ingestion:** Supports YouTube video links as well as direct audio/video uploads (MP4, MKV, MP3, WAV, etc.) with drag-and-drop.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Type Safety:** TypeScript 5 (Strict Mode)
- **Utilities:** `canvas-confetti`, `jspdf`, `clsx`, `tailwind-merge`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher (or pnpm / yarn)
- **Backend:** A running [Voxora FastAPI backend](../backend/) (default port: `8000`)

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure the backend endpoint:

```bash
cp .env.example .env.local
```

In `.env.local`:

```env
# URL pointing to the FastAPI backend API prefix
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

> **Note:** `NEXT_PUBLIC_API_URL` is exposed to the browser. Never store sensitive API secrets (like OpenAI, OpenRouter, or Gnani tokens) in frontend environment variables. Those are securely handled by the FastAPI backend.

### 3. Development Server

Start the local development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation

Run the following checks to ensure code quality before submitting contributions:

```bash
# Run ESLint (enforces React 19 rules and strict types)
npm run lint

# Validate TypeScript type check without emitting files
npx tsc --noEmit

# Test optimized production build
npm run build
```

---

## 📁 Frontend Directory Structure

```text
frontend/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout with responsive Navbar and Footer
│   ├── page.tsx                # Landing page (hero, features, workflow)
│   ├── globals.css             # Tailwind CSS v4 directives and color variables
│   ├── dashboard/page.tsx      # Overview metrics & lecture inventory
│   ├── upload/page.tsx         # YouTube ingestion & media upload interface
│   ├── handwritten/page.tsx    # Handwritten PDF notes generator & preview
│   ├── planner/page.tsx        # Multi-day study roadmap planner
│   ├── assistant/page.tsx      # Global RAG AI assistant chat
│   ├── settings/page.tsx       # User preferences & platform integrations
│   └── lectures/[id]/page.tsx  # Dynamic lecture workspace coordinator
├── components/                 # Reusable UI & layout components
│   ├── Navbar.tsx              # Responsive navigation with mobile menu drawer
│   ├── Footer.tsx              # Platform footer
│   └── lectures/               # Modular lecture workspace tabs
│       ├── LectureOverviewTab.tsx
│       ├── LectureTranscriptTab.tsx
│       ├── LectureNotesTab.tsx
│       ├── LectureSummaryTab.tsx
│       ├── LectureQuestionsTab.tsx
│       ├── LectureQuizTab.tsx
│       └── LectureAssistantTab.tsx
├── services/
│   └── api.ts                  # Centralized typed HTTP API service layer
├── types/
│   └── index.ts                # TypeScript data interfaces & API contracts
├── public/                     # Static assets & brand icons
├── .env.example                # Safe environment variable template
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript compiler configuration
└── package.json                # Project scripts & dependencies
```

---

## 🚢 Production Deployment (Vercel)

The Voxora frontend is architected for seamless deployment on [Vercel](https://vercel.com):

1. **Connect Repository:** Import your fork of `Voxora` into the Vercel Dashboard.
2. **Project Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** `.next`
3. **Environment Variables:**
   - Set `NEXT_PUBLIC_API_URL` to your production backend URL (e.g. `https://api.yourdomain.com/api`).
4. **Deploy:** Click **Deploy**.

> **Important Architecture Note:**
> Vercel hosts the Next.js frontend as a serverless application. The FastAPI backend must be hosted separately (e.g. on Render, Railway, AWS EC2, or a Linux VPS) because it requires Python 3.13, FFmpeg for audio extraction, persistent SQLite / ChromaDB disk storage, and background processing workers.
