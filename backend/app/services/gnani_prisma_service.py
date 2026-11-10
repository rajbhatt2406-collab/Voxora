import os
import requests
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.utils.media import extract_audio_from_video, slice_audio, cleanup_temp_chunks, get_media_duration

logger = logging.getLogger(__name__)

class GnaniPrismaService:
    """
    Official client for Gnani Prisma Speech-to-Text (v3).
    Endpoint: https://api.vachana.ai/stt/v3
    Header: X-API-Key-ID: <GNANI_API_KEY>
    Body: multipart/form-data
      - audio_file: WAV file (16kHz mono)
      - language_code: target language (e.g. en-IN, hi-IN, indic-auto)
      - model: prisma-v3.0
      - format: transcribe
    Note: Gnani REST API enforces a 30-second duration limit per call.
    Long lectures are automatically normalized and sliced into sequential chunks.
    """
    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.api_url = settings.GNANI_PRISMA_API_URL or "https://api.vachana.ai/stt/v3"

    def _map_language_code(self, lang: str) -> str:
        lang_map = {
            "en": "en-IN",
            "hi": "hi-IN",
            "kn": "kn-IN",
            "ta": "ta-IN",
            "te": "te-IN",
            "bn": "bn-IN",
            "mr": "mr-IN",
            "gu": "gu-IN",
            "ml": "ml-IN",
            "hinglish": "hi-IN",
            "auto": "indic-auto"
        }
        return lang_map.get(lang.lower(), "en-IN")

    def transcribe_audio(
        self,
        audio_file_path: str,
        language: str = "en"
    ) -> List[Dict[str, Any]]:
        """
        Submit audio file to Gnani Prisma STT API.
        Handles both short clips and long lectures by automatic normalization and slicing.
        Returns normalized segments with start, end, text.
        """
        if not self.api_key:
            logger.error("GNANI_API_KEY is not configured.")
            raise ValueError("GNANI_API_KEY is not configured. Please set a valid Gnani API key.")

        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

        # Ensure audio is 16kHz mono WAV format
        normalized_wav = extract_audio_from_video(audio_file_path)
        gnani_lang = self._map_language_code(language)

        total_duration = get_media_duration(normalized_wav)
        logger.info(
            f"Gnani Prisma STT: Processing audio (duration={total_duration:.1f}s, "
            f"target_lang={gnani_lang}) at {self.api_url}"
        )

        # Slice long audio into <= 28-second chunks to respect Gnani 30-second limit
        chunks = slice_audio(normalized_wav, chunk_duration_sec=28.0)
        logger.info(f"Audio divided into {len(chunks)} chunks for sequential transcription.")

        all_segments: List[Dict[str, Any]] = []

        try:
            for idx, chunk_info in enumerate(chunks):
                chunk_file = chunk_info["chunk_path"]
                offset_sec = chunk_info["start_sec"]
                duration_sec = chunk_info["duration_sec"]

                logger.info(
                    f"Transcribing chunk {idx+1}/{len(chunks)} "
                    f"[{offset_sec:.1f}s - {offset_sec + duration_sec:.1f}s]..."
                )

                chunk_segments = self._transcribe_single_chunk(
                    chunk_file_path=chunk_file,
                    language_code=gnani_lang,
                    offset_sec=offset_sec,
                    chunk_duration=duration_sec
                )

                if chunk_segments:
                    all_segments.extend(chunk_segments)

        finally:
            cleanup_temp_chunks(chunks)

        if not all_segments:
            logger.warning("Gnani Prisma returned no recognizable speech in the audio.")
            all_segments.append({
                "start": 0.0,
                "end": max(5.0, round(total_duration, 2)),
                "text": "No distinct speech was detected in this lecture recording."
            })

        logger.info(f"Gnani Prisma completed: {len(all_segments)} total segments generated.")
        return all_segments

    def _transcribe_single_chunk(
        self,
        chunk_file_path: str,
        language_code: str,
        offset_sec: float,
        chunk_duration: float
    ) -> List[Dict[str, Any]]:
        """Transcribe an individual <= 28s WAV chunk with Gnani Prisma REST v3."""
        headers = {
            "X-API-Key-ID": self.api_key
        }

        with open(chunk_file_path, "rb") as f:
            files = {
                "audio_file": (os.path.basename(chunk_file_path), f, "audio/wav")
            }
            data = {
                "language_code": language_code,
                "model": "prisma-v3.0",
                "format": "transcribe"
            }

            try:
                response = requests.post(
                    self.api_url,
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=90
                )

                if response.status_code == 401:
                    logger.error("Gnani Prisma authentication failed (HTTP 401). Invalid X-API-Key-ID.")
                    raise RuntimeError(
                        "Gnani Prisma authentication failed (HTTP 401): Invalid API key. "
                        "Please verify your GNANI_API_KEY."
                    )
                elif response.status_code == 429:
                    logger.error("Gnani Prisma rate limit reached (HTTP 429).")
                    raise RuntimeError("Gnani Prisma rate limit reached. Please retry in a few moments.")
                elif response.status_code != 200:
                    err_text = response.text[:300]
                    logger.error(f"Gnani Prisma error HTTP {response.status_code}: {err_text}")
                    raise RuntimeError(f"Gnani Prisma API error (HTTP {response.status_code}): {err_text}")

                res_json = response.json()
                return self._parse_prisma_chunk_response(res_json, offset_sec, chunk_duration)

            except requests.exceptions.RequestException as e:
                logger.error(f"Gnani Prisma request error on chunk at {offset_sec}s: {e}")
                raise RuntimeError(f"Failed to communicate with Gnani Prisma STT: {str(e)}")

    def _parse_prisma_chunk_response(
        self,
        res_json: Dict[str, Any],
        offset_sec: float,
        chunk_duration: float
    ) -> List[Dict[str, Any]]:
        """Parse chunk response and apply timestamp offset."""
        transcript_text = res_json.get("transcript") or res_json.get("text") or res_json.get("result", "")
        transcript_text = str(transcript_text).strip()

        if not transcript_text:
            return []

        # If detailed word timestamps are available
        words = res_json.get("words")
        if words and isinstance(words, list) and len(words) > 0:
            segments: List[Dict[str, Any]] = []
            curr_words = []
            seg_start = offset_sec

            for w in words:
                w_text = w.get("word") or w.get("text", "")
                w_start = offset_sec + float(w.get("start_time") or w.get("start", 0.0))
                w_end = offset_sec + float(w.get("end_time") or w.get("end", 0.0))

                curr_words.append(w_text)
                if len(curr_words) >= 10:
                    segments.append({
                        "start": round(seg_start, 2),
                        "end": round(w_end, 2),
                        "text": " ".join(curr_words)
                    })
                    curr_words = []
                    seg_start = w_end

            if curr_words:
                segments.append({
                    "start": round(seg_start, 2),
                    "end": round(offset_sec + chunk_duration, 2),
                    "text": " ".join(curr_words)
                })
            return segments

        # Otherwise return the chunk text spanning this chunk's start and end
        return [{
            "start": round(offset_sec, 2),
            "end": round(offset_sec + chunk_duration, 2),
            "text": transcript_text
        }]

gnani_prisma_service = GnaniPrismaService()
