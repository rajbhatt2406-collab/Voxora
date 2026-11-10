import os
import re
import logging
from typing import Dict, Any, List, Optional
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    VideoUnplayable,
    TranscriptsDisabled,
    NoTranscriptFound,
    CouldNotRetrieveTranscript
)
from langchain_community.document_loaders import YoutubeLoader
from langchain_community.document_loaders.youtube import TranscriptFormat

logger = logging.getLogger(__name__)

class YouTubeService:
    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """Extract YouTube video ID from various URL patterns including standard, youtu.be, embed, and shorts."""
        if not url:
            return None
        patterns = [
            r"(?:v=|\/vi\/|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([0-9A-Za-z_-]{11})",
            r"(?:watch\?.*v=)([0-9A-Za-z_-]{11})"
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def get_metadata(url: str) -> Dict[str, Any]:
        """Retrieve video title, duration, author, description using yt-dlp safely."""
        ydl_opts = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return {
                    "title": info.get("title", "YouTube Lecture"),
                    "description": info.get("description", ""),
                    "duration": float(info.get("duration", 0) or 0),
                    "channel": info.get("uploader", ""),
                    "thumbnail": info.get("thumbnail", "")
                }
        except Exception as e:
            logger.warning(f"yt-dlp metadata extraction failed: {e}")
            video_id = YouTubeService.extract_video_id(url)
            return {
                "title": f"YouTube Lecture ({video_id})" if video_id else "YouTube Lecture",
                "description": "",
                "duration": 0.0,
                "channel": "",
                "thumbnail": ""
            }

    @staticmethod
    def fetch_transcript(video_id: str, preferred_lang: str = "en", source_url: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch accessible captions using YouTubeTranscriptApi and LangChain YoutubeLoader.
        Preserves timestamps and converts into standard segment list:
        [{'start': float, 'end': float, 'text': str}]
        """
        logger.info(f"Retrieving YouTube captions for video_id={video_id}, preferred_lang={preferred_lang}")

        # Attempt 1: Direct YouTubeTranscriptApi instance call (fastest & finest-grain timestamps)
        try:
            api = YouTubeTranscriptApi()
            transcript_list = api.list(video_id)

            languages_to_try = [preferred_lang, "en", "hi", "en-US", "en-GB"]
            target_transcript = None

            # Try manual transcript
            try:
                target_transcript = transcript_list.find_manually_created_transcript(languages_to_try)
            except Exception:
                pass

            # Try auto-generated transcript
            if not target_transcript:
                try:
                    target_transcript = transcript_list.find_generated_transcript(languages_to_try)
                except Exception:
                    pass

            # Fallback to any available transcript in the list
            if not target_transcript:
                for t in transcript_list:
                    target_transcript = t
                    break

            if target_transcript:
                raw_snippets = target_transcript.fetch()
                formatted_segments = []
                for snippet in raw_snippets:
                    # In youtube_transcript_api 1.x, snippet is a FetchedTranscriptSnippet object
                    start_val = getattr(snippet, "start", None)
                    dur_val = getattr(snippet, "duration", None)
                    text_val = getattr(snippet, "text", None)

                    if start_val is None and isinstance(snippet, dict):
                        start_val = snippet.get("start", 0.0)
                        dur_val = snippet.get("duration", 0.0)
                        text_val = snippet.get("text", "")

                    start = float(start_val or 0.0)
                    duration = float(dur_val or 0.0)
                    text = str(text_val or "").strip()

                    if text:
                        formatted_segments.append({
                            "start": round(start, 2),
                            "end": round(start + duration, 2),
                            "text": text
                        })

                if formatted_segments:
                    logger.info(f"Successfully retrieved {len(formatted_segments)} caption segments via YouTubeTranscriptApi.")
                    return formatted_segments

        except VideoUnplayable as e:
            logger.error(f"YouTube video {video_id} is unplayable: {e}")
            raise RuntimeError(
                "This YouTube video is unplayable (e.g. members-only, private, or age-restricted). "
                "Please upload the authorized video or audio file directly to transcribe it with Gnani Prisma."
            )
        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.warning(f"Captions unavailable for {video_id}: {e}")
            raise RuntimeError(
                "No captions or subtitles are available for this YouTube video. "
                "Please upload the lecture video or audio file directly to generate an AI transcript using Gnani Prisma."
            )
        except CouldNotRetrieveTranscript as e:
            logger.warning(f"CouldNotRetrieveTranscript for {video_id}: {e}")
            # Try LangChain YoutubeLoader fallback before giving up
            pass
        except Exception as e:
            logger.warning(f"YouTubeTranscriptApi failed with {type(e).__name__}: {e}. Trying LangChain YoutubeLoader...")

        # Attempt 2: LangChain YoutubeLoader
        full_url = source_url or f"https://www.youtube.com/watch?v={video_id}"
        try:
            loader = YoutubeLoader.from_youtube_url(
                full_url,
                add_video_info=False,
                language=[preferred_lang, "en", "hi"],
                transcript_format=TranscriptFormat.CHUNKS,
                chunk_size_seconds=30
            )
            docs = loader.load()
            if docs:
                segments = []
                for doc in docs:
                    start_s = float(doc.metadata.get("start_seconds", 0))
                    text = doc.page_content.strip()
                    if text:
                        segments.append({
                            "start": start_s,
                            "end": start_s + 30.0,
                            "text": text
                        })
                if segments:
                    logger.info(f"Successfully retrieved {len(segments)} segments via LangChain YoutubeLoader.")
                    return segments
        except Exception as e:
            logger.warning(f"LangChain YoutubeLoader also failed: {e}")

        # If both attempts failed
        raise RuntimeError(
            "Could not retrieve captions from this YouTube video. The video may not have captions enabled, "
            "or may require user authentication. Please upload the lecture audio or video file directly."
        )

youtube_service = YouTubeService()
