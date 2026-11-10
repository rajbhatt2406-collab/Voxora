import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from app.core.config import settings
from app.services.openrouter_service import openrouter_service

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.chroma_path = settings.CHROMA_DB_PATH
        self._chroma_client = None  # Lazy: initialized on first use to avoid heavy import at startup
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self._embedder = None

    @property
    def chroma_client(self):
        if self._chroma_client is None:
            self._chroma_client = chromadb.PersistentClient(path=self.chroma_path)
        return self._chroma_client

    @property
    def embedder(self):
        if self._embedder is None:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading local embedding model: {self.embedding_model_name}")
            self._embedder = SentenceTransformer(self.embedding_model_name)
        return self._embedder

    def _get_collection(self, lecture_id: str):
        safe_name = f"lecture_{lecture_id.replace('-', '_')}"
        return self.chroma_client.get_or_create_collection(
            name=safe_name,
            metadata={"hnsw:space": "cosine"}
        )

    def index_transcript(self, lecture_id: str, segments: List[Dict[str, Any]]):
        """
        Group segments into overlapping chunks with start/end timestamps and index into ChromaDB.
        """
        if not segments:
            logger.warning(f"No segments to index for lecture {lecture_id}")
            return

        collection = self._get_collection(lecture_id)

        # Build chunks grouping ~3-5 consecutive segments
        chunks = []
        chunk_window = 4
        chunk_step = 2

        for i in range(0, len(segments), chunk_step):
            window = segments[i:i + chunk_window]
            if not window:
                continue
            chunk_text = " ".join([seg["text"] for seg in window if seg.get("text")])
            if not chunk_text.strip():
                continue

            start_t = window[0].get("start", 0.0)
            end_t = window[-1].get("end", 0.0)
            chunk_id = f"{lecture_id}_chunk_{i}"

            chunks.append({
                "id": chunk_id,
                "text": chunk_text,
                "start": float(start_t),
                "end": float(end_t)
            })

        if not chunks:
            return

        documents = [c["text"] for c in chunks]
        ids = [c["id"] for c in chunks]
        metadatas = [{"lecture_id": lecture_id, "start": c["start"], "end": c["end"]} for c in chunks]

        try:
            # Generate embeddings using local SentenceTransformer
            embeddings = self.embedder.encode(documents, show_progress_bar=False).tolist()

            # Add or upsert to ChromaDB
            collection.upsert(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Indexed {len(chunks)} chunks in ChromaDB for lecture {lecture_id}")
        except Exception as e:
            logger.warning(f"ChromaDB indexing skipped or deferred for lecture {lecture_id}: {e}")

    def query_lecture(self, lecture_id: str, question: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Retrieve relevant lecture chunks using vector search and ground response with OpenRouter LLM.
        """
        collection = self._get_collection(lecture_id)
        count = collection.count()

        if count == 0:
            return {
                "question": question,
                "answer": "This lecture does not have an indexed transcript available yet for semantic question answering.",
                "sources": []
            }

        q_embedding = self.embedder.encode([question], show_progress_bar=False).tolist()
        results = collection.query(
            query_embeddings=q_embedding,
            n_results=min(top_k, count)
        )

        retrieved_docs = results["documents"][0] if results.get("documents") else []
        retrieved_metas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results.get("distances", [[]])[0]

        sources = []
        context_blocks = []

        for idx, doc in enumerate(retrieved_docs):
            meta = retrieved_metas[idx] if idx < len(retrieved_metas) else {}
            start_t = meta.get("start", 0.0)
            end_t = meta.get("end", 0.0)
            dist = distances[idx] if idx < len(distances) else 0.5
            similarity = round(max(0.0, 1.0 - dist), 3)

            sources.append({
                "start_time": start_t,
                "end_time": end_t,
                "text": doc,
                "similarity_score": similarity
            })

            start_min = int(start_t // 60)
            start_sec = int(start_t % 60)
            context_blocks.append(f"[{start_min:02d}:{start_sec:02d}] {doc}")

        context_str = "\n\n".join(context_blocks)

        system_prompt = (
            "You are Voxora AI, a grounded academic lecture assistant. Answer the user's question "
            "based strictly and truthfully on the provided lecture transcript excerpts.\n"
            "Rules:\n"
            "1. Ground your answers strictly in the lecture context.\n"
            "2. If the answer cannot be found or verified in the context, explicitly state: 'The lecture does not cover this specific detail.' Never invent facts.\n"
            "3. Cite relevant timestamps (e.g. [04:12]) when mentioning concepts covered at specific moments in the lecture.\n"
            "4. Keep explanations clear, structured, and pedagogical."
        )

        user_prompt = f"Lecture Context Excerpts:\n{context_str}\n\nStudent Question: {question}"

        answer = openrouter_service.generate_completion(system_prompt, user_prompt, temperature=0.1)

        return {
            "question": question,
            "answer": answer,
            "sources": sources
        }

rag_service = RAGService()

