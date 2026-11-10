import os
import requests
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class GnaniTimbreService:
    """
    Client for Gnani Timbre Text-to-Speech inference API.
    Endpoint: https://api.vachana.ai/api/v1/tts/inference
    Header: token: <GNANI_API_KEY>
    """
    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.api_url = settings.GNANI_TIMBRE_API_URL

    def synthesize_speech(
        self,
        text: str,
        output_file_path: str,
        language: str = "en",
        gender: str = "female"
    ) -> Optional[str]:
        if not self.api_key:
            logger.warning("GNANI_API_KEY is not set. Skipping TTS generation.")
            return None

        headers = {
            "token": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "language": language,
            "gender": gender,
            "audio_format": "wav"
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                with open(output_file_path, "wb") as f:
                    f.write(response.content)
                return output_file_path
            else:
                logger.error(f"Gnani Timbre returned {response.status_code}: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Gnani Timbre TTS failed: {e}")
            return None

gnani_timbre_service = GnaniTimbreService()

