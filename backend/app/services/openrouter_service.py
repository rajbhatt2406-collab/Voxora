import json
import logging
from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenRouterService:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model_name = settings.OPENROUTER_MODEL

    def get_llm(self, temperature: float = 0.2, max_tokens: int = 4096) -> ChatOpenAI:
        """Create and return a ChatOpenAI client pointing to OpenRouter."""
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY is not configured.")
        return ChatOpenAI(
            model=self.model_name,
            api_key=self.api_key,
            base_url=self.base_url,
            temperature=temperature,
            max_tokens=max_tokens,
            default_headers={
                "HTTP-Referer": "https://voxora.local",
                "X-Title": "Voxora Learning Platform"
            }
        )

    def generate_completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        """Generate a response using the configured Nemotron model."""
        try:
            llm = self.get_llm(temperature=temperature)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            response = llm.invoke(messages)
            return response.content if hasattr(response, "content") else str(response)
        except Exception as e:
            logger.error(f"Error calling OpenRouter LLM: {e}")
            raise RuntimeError(f"OpenRouter LLM error: {str(e)}")

    def generate_structured_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Generate structured JSON response with robust cleanup and fallback parsing."""
        full_system = f"{system_prompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON. Do not include markdown code block backticks (like ```json ... ```) or any preamble or explanation."
        raw_text = self.generate_completion(full_system, user_prompt, temperature=0.1)

        # Clean markdown codeblocks if model included them
        clean_text = raw_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError as err:
            logger.warning(f"Direct JSON parse failed: {err}. Attempting substring extraction.")
            # Attempt to extract outermost { ... } or [ ... ]
            start_dict = clean_text.find("{")
            end_dict = clean_text.rfind("}")
            if start_dict != -1 and end_dict != -1 and end_dict > start_dict:
                try:
                    return json.loads(clean_text[start_dict:end_dict + 1])
                except json.JSONDecodeError:
                    pass

            start_list = clean_text.find("[")
            end_list = clean_text.rfind("]")
            if start_list != -1 and end_list != -1 and end_list > start_list:
                try:
                    return {"data": json.loads(clean_text[start_list:end_list + 1])}
                except json.JSONDecodeError:
                    pass

            logger.error(f"Failed to parse LLM response into JSON: {clean_text[:500]}")
            raise ValueError(f"Could not parse structured JSON from LLM: {str(err)}")

openrouter_service = OpenRouterService()

