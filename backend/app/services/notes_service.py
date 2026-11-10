import logging
from typing import List, Dict, Any, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.openrouter_service import openrouter_service

logger = logging.getLogger(__name__)

class NotesService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,
            chunk_overlap=400,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def _prepare_transcript_context(self, raw_text: str) -> str:
        """
        Hierarchical summarization if lecture transcript exceeds 12,000 characters (~3000 tokens),
        ensuring 8-10 hour long lectures do not blow context or crash OpenRouter rate limits.
        """
        if len(raw_text) <= 12000:
            return raw_text

        chunks = self.text_splitter.split_text(raw_text)
        logger.info(f"Long lecture transcript: split into {len(chunks)} chunks for hierarchical condensation.")

        summaries = []
        for idx, chunk in enumerate(chunks[:12]):  # Process top key chunks
            system_prompt = "You are a concise academic note-taker. Summarize key educational points, definitions, formulas, and examples from this segment."
            user_prompt = f"Transcript segment {idx+1}/{len(chunks)}:\n\n{chunk}"
            try:
                res = openrouter_service.generate_completion(system_prompt, user_prompt, temperature=0.1)
                summaries.append(res)
            except Exception as e:
                logger.warning(f"Chunk {idx} summarization error: {e}")
                summaries.append(chunk[:500])

        return "\n\n".join(summaries)

    def generate_detailed_notes(self, raw_text: str, title: str = "Lecture Notes") -> Dict[str, Any]:
        """Generate structured comprehensive detailed notes."""
        context = self._prepare_transcript_context(raw_text)
        system_prompt = (
            "You are a master university professor. Generate comprehensive, in-depth academic study notes "
            "from the provided lecture transcript.\n"
            "Format the output strictly as JSON with this structure:\n"
            "{\n"
            '  "title": "Comprehensive Notes: ' + title + '",\n'
            '  "markdown_content": "# Detailed Notes\\n\\n## Topic 1: ...\\n\\n### Key Definitions\\n- ...",\n'
            '  "topics": [\n'
            '    {\n'
            '      "heading": "Topic Name",\n'
            '      "subheadings": ["Sub 1", "Sub 2"],\n'
            '      "definitions": [{"term": "Term", "definition": "Def"}],\n'
            '      "explanations": "Detailed prose...",\n'
            '      "examples": ["Example 1..."],\n'
            '      "takeaways": ["Key takeaway..."]\n'
            '    }\n'
            '  ]\n'
            "}"
        )
        user_prompt = f"Lecture Content:\n\n{context}"
        try:
            return openrouter_service.generate_structured_json(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Detailed notes generation failed: {e}")
            # Fallback to plain markdown completion
            md = openrouter_service.generate_completion(
                "You are an academic note-taker. Format in Markdown with clear Headings, Definitions, Examples, and Key Takeaways.",
                f"Lecture Content:\n\n{context}"
            )
            return {
                "title": f"Notes: {title}",
                "markdown_content": md,
                "topics": []
            }

    def generate_short_notes(self, raw_text: str, title: str = "Lecture") -> Dict[str, Any]:
        """Generate concise exam-focused revision notes."""
        context = self._prepare_transcript_context(raw_text)
        system_prompt = (
            "You are an exam revision coach. Generate high-yield concise revision notes.\n"
            "Respond strictly in JSON format:\n"
            "{\n"
            '  "title": "Quick Revision Notes: ' + title + '",\n'
            '  "markdown_content": "Markdown formatted bullet points...",\n'
            '  "definitions": [{"term": "...", "explanation": "..."}],\n'
            '  "revision_points": ["Point 1", "Point 2"],\n'
            '  "exam_tips": ["Tip 1", "Tip 2"]\n'
            "}"
        )
        user_prompt = f"Lecture Content:\n\n{context}"
        try:
            return openrouter_service.generate_structured_json(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Short notes JSON generation failed: {e}")
            md = openrouter_service.generate_completion(
                "Create concise quick revision bullet points, formulas, definitions, and high-yield exam tips.",
                context
            )
            return {
                "title": f"Quick Revision: {title}",
                "markdown_content": md,
                "revision_points": [],
                "exam_tips": []
            }

    def generate_summary(self, raw_text: str) -> Dict[str, Any]:
        """Generate lecture overview, main concepts, important findings, and takeaways."""
        context = self._prepare_transcript_context(raw_text)
        system_prompt = (
            "You are an academic researcher. Analyze the lecture and generate a structured executive summary.\n"
            "Respond strictly in JSON format:\n"
            "{\n"
            '  "overview": "2-3 paragraphs providing an overarching summary...",\n'
            '  "main_concepts": ["Concept 1", "Concept 2", "Concept 3"],\n'
            '  "important_findings": ["Finding 1", "Finding 2"],\n'
            '  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]\n'
            "}"
        )
        user_prompt = f"Lecture Content:\n\n{context}"
        return openrouter_service.generate_structured_json(system_prompt, user_prompt)

    def generate_questions(self, raw_text: str) -> List[Dict[str, Any]]:
        """Generate short-answer, long-answer, and conceptual questions with answers and explanations."""
        context = self._prepare_transcript_context(raw_text)
        system_prompt = (
            "You are a university exam creator. Formulate important questions grounded in the lecture.\n"
            "Respond strictly in JSON format with an array of questions:\n"
            "[\n"
            "  {\n"
            '    "type": "conceptual",\n'  # conceptual, short, long
            '    "question": "What is ...?",\n'
            '    "answer": "Direct answer...",\n'
            '    "explanation": "Detailed theoretical grounding..."\n'
            "  }\n"
            "]"
        )
        user_prompt = f"Lecture Content:\n\n{context}"
        result = openrouter_service.generate_structured_json(system_prompt, user_prompt)
        if isinstance(result, list):
            return result
        return result.get("data", []) or result.get("questions", [])

    def generate_quiz(self, raw_text: str, difficulty: str = "Medium", num_questions: int = 5) -> List[Dict[str, Any]]:
        """Generate multiple choice questions with 4 options, correct answer, and explanation."""
        context = self._prepare_transcript_context(raw_text)
        system_prompt = (
            f"You are an educational quiz master. Create a {num_questions}-question multiple choice quiz "
            f"at '{difficulty}' difficulty level based on the lecture content.\n"
            "Respond strictly in JSON format with an array of questions:\n"
            "[\n"
            "  {\n"
            '    "id": "q1",\n'
            '    "question": "Question text?",\n'
            '    "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '    "correct_answer": "Option A",\n'
            '    "explanation": "Why Option A is correct..."\n'
            "  }\n"
            "]"
        )
        user_prompt = f"Lecture Content:\n\n{context}"
        result = openrouter_service.generate_structured_json(system_prompt, user_prompt)
        if isinstance(result, list):
            return result
        return result.get("data", []) or result.get("questions", [])

    def create_learning_plan(
        self,
        raw_text: str,
        total_duration_seconds: float,
        target_daily_hours: float = 1.5
    ) -> Dict[str, Any]:
        """
        Organize long lectures (e.g. 8-10 hours) into daily structured sessions
        by natural topic boundaries rather than arbitrary time splits.
        """
        target_seconds_per_day = target_daily_hours * 3600
        total_hours = total_duration_seconds / 3600 if total_duration_seconds > 0 else 8.0
        estimated_days = max(1, int(round(total_hours / target_daily_hours)))

        context = self._prepare_transcript_context(raw_text)
        system_prompt = (
            f"You are an expert curriculum designer. A student has an educational lecture of {total_hours:.1f} hours. "
            f"Design a structured {estimated_days}-day learning schedule aiming for ~{target_daily_hours} hours per day.\n"
            "Divide by natural conceptual topic boundaries. Include a title, concise session notes, and a 2-question checkpoint quiz for each day.\n"
            "Respond strictly in JSON format:\n"
            "{\n"
            '  "plan_title": "Comprehensive Mastery Schedule",\n'
            '  "total_days": ' + str(estimated_days) + ',\n'
            '  "target_daily_hours": ' + str(target_daily_hours) + ',\n'
            '  "sessions": [\n'
            '    {\n'
            '      "day_number": 1,\n'
            '      "title": "Day 1: Fundamentals & Architecture",\n'
            '      "description": "Introduction to the core foundations...",\n'
            '      "start_time": 0.0,\n'
            '      "end_time": ' + str(min(target_seconds_per_day, total_duration_seconds or 5400)) + ',\n'
            '      "session_notes": "Summary of today\'s learnings...",\n'
            '      "session_quiz": [\n'
            '        {\n'
            '          "id": "sq1",\n'
            '          "question": "Quick check question?",\n'
            '          "options": ["A", "B", "C", "D"],\n'
            '          "correct_answer": "A",\n'
            '          "explanation": "Explanation..."\n'
            '        }\n'
            '      ]\n'
            '    }\n'
            '  ]\n'
            "}"
        )
        user_prompt = f"Lecture Content Overview:\n\n{context}"
        return openrouter_service.generate_structured_json(system_prompt, user_prompt)

notes_service = NotesService()

