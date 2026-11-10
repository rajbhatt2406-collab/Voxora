import logging
from typing import List, Dict, Any
from app.services.openrouter_service import openrouter_service

logger = logging.getLogger(__name__)

class TranslationService:
    @staticmethod
    def translate_segments(
        segments: List[Dict[str, Any]],
        target_language: str
    ) -> Dict[str, Any]:
        """
        Translate transcript segments while strictly preserving start/end timestamps.
        Supports Hinglish, Hindi, Spanish, French, German, Kannada, Tamil, etc.
        """
        lang_names = {
            "hi": "Hindi (हिंदी)",
            "hinglish": "Hinglish (Hindi written in Roman / English script)",
            "es": "Spanish (Español)",
            "fr": "French (Français)",
            "de": "German (Deutsch)",
            "kn": "Kannada (ಕನ್ನಡ)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
            "bn": "Bengali (বাংলা)",
            "mr": "Marathi (मराठी)"
        }
        target_lang_desc = lang_names.get(target_language.lower(), target_language)

        # Batch segments into groups to preserve timestamps and context without exceeding token limits
        batch_size = 25
        translated_segments = []

        for i in range(0, len(segments), batch_size):
            batch = segments[i:i + batch_size]
            prompt_data = [
                {"id": idx, "start": seg["start"], "end": seg["end"], "text": seg["text"]}
                for idx, seg in enumerate(batch)
            ]

            system_prompt = (
                f"You are an expert educational translator specializing in translating lecture transcripts to {target_lang_desc}. "
                "You MUST maintain exact factual fidelity, educational terms, and natural flow. "
                "If translating to Hinglish, keep technical terminology in familiar English words while translating colloquial and explanatory phrasing to Romanized Hindi. "
                "Respond ONLY with a JSON array of objects: [{\"id\": 0, \"text\": \"translated text\"}, ...]. "
                "Maintain exactly the same number of items with matching IDs."
            )

            user_prompt = f"Translate the following lecture segments:\n{prompt_data}"

            try:
                result = openrouter_service.generate_structured_json(system_prompt, user_prompt)
                items = result if isinstance(result, list) else result.get("data", [])
                
                # Match back to original segment timestamps
                item_dict = {item.get("id"): item.get("text", "") for item in items if isinstance(item, dict)}
                for idx, seg in enumerate(batch):
                    trans_text = item_dict.get(idx, seg["text"])
                    translated_segments.append({
                        "start": seg["start"],
                        "end": seg["end"],
                        "text": trans_text
                    })
            except Exception as e:
                logger.error(f"Error translating batch {i}: {e}. Keeping original as fallback.")
                for seg in batch:
                    translated_segments.append(seg)

        full_translated_text = " ".join([s["text"] for s in translated_segments])
        return {
            "text": full_translated_text,
            "segments": translated_segments,
            "target_language": target_language
        }

translation_service = TranslationService()

