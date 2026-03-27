import json
import uuid
import logging
import httpx
from typing import Optional

from config import settings
from models import Question, DifficultyEnum, QuestionTypeEnum, TestCase

logger = logging.getLogger(__name__)


class OllamaService:
    """Service to interact with Ollama for local LLM inference."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.client = httpx.AsyncClient(timeout=120.0)

    async def _generate(self, prompt: str, system_prompt: str = "") -> str:
        """Generate a response from Ollama."""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "num_predict": 4096,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except httpx.ConnectError:
            logger.warning("Ollama not available, using fallback responses")
            return ""
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            return ""

    async def generate_questions(
        self,
        topics: list[str],
        difficulty: str,
        questions_per_topic: int,
        languages: list[str],
        custom_topics: Optional[list[str]] = None,
    ) -> list[Question]:
        """Generate interview questions using LLM."""
        all_topics = topics + (custom_topics or [])
        all_questions: list[Question] = []

        for topic in all_topics:
            system_prompt = """You are an expert technical interviewer. Generate high-quality interview questions.
            Return ONLY valid JSON array. No markdown, no explanation. Each question object must have:
            - text: the question text
            - type: "coding" or "text" or "system-design"
            - difficulty: the difficulty level
            - sampleCode: starter code if coding question (optional)
            - testCases: array of {input, expectedOutput} for coding questions (optional)
            - timeLimit: time in seconds"""

            prompt = f"""Generate exactly {questions_per_topic} {difficulty} difficulty interview questions about "{topic}".
            Available programming languages: {', '.join(languages)}.

            For coding questions, include test cases and starter code in {languages[0] if languages else 'javascript'}.
            For system design questions, focus on scalability and architecture.
            For text questions, ask about concepts, trade-offs, and real-world applications.

            Mix question types: include at least one coding question if the topic allows it.

            Return as JSON array:
            [
              {{
                "text": "question text",
                "type": "coding|text|system-design",
                "difficulty": "{difficulty}",
                "sampleCode": "// starter code",
                "testCases": [{{"input": "...", "expectedOutput": "..."}}],
                "timeLimit": 600
              }}
            ]"""

            response = await self._generate(prompt, system_prompt)

            try:
                # Try to parse JSON from response
                parsed = self._extract_json(response)
                if parsed and isinstance(parsed, list):
                    for i, q in enumerate(parsed[:questions_per_topic]):
                        question = Question(
                            id=str(uuid.uuid4())[:8],
                            text=q.get("text", f"Question about {topic}"),
                            type=self._map_type(q.get("type", "text")),
                            topic=topic,
                            difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                            language=languages[0] if languages else None,
                            sampleCode=q.get("sampleCode"),
                            testCases=[
                                TestCase(**tc)
                                for tc in q.get("testCases", [])
                                if isinstance(tc, dict) and "input" in tc and "expectedOutput" in tc
                            ] or None,
                            maxScore=10,
                            timeLimit=q.get("timeLimit", 600),
                        )
                        all_questions.append(question)
                else:
                    raise ValueError("Invalid JSON response")

            except Exception as e:
                logger.warning(f"Failed to parse AI questions for {topic}: {e}")
                # Use fallback questions
                all_questions.extend(
                    self._get_fallback_questions(topic, difficulty, questions_per_topic, languages)
                )

        return all_questions

    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        code: Optional[str] = None,
        language: Optional[str] = None,
        execution_result: Optional[dict] = None,
    ) -> dict:
        """Evaluate a candidate's answer using LLM."""
        system_prompt = """You are an expert code reviewer and technical interviewer.
        Evaluate the candidate's answer fairly and constructively.
        Return ONLY valid JSON with no markdown formatting."""

        exec_info = ""
        if execution_result:
            exec_info = f"""
Code Execution Result:
- Status: {execution_result.get('status', 'N/A')}
- Output: {execution_result.get('stdout', 'N/A')}
- Errors: {execution_result.get('stderr', 'None')}
- Test Cases Passed: {execution_result.get('testCasesPassed', 0)}/{execution_result.get('totalTestCases', 0)}
"""

        prompt = f"""Evaluate this interview answer:

QUESTION: {question}

CANDIDATE'S TEXT ANSWER: {answer or 'No text answer provided'}

CANDIDATE'S CODE ({language or 'unknown'}):
```
{code or 'No code provided'}
```
{exec_info}

Return evaluation as JSON:
{{
  "score": <0-10>,
  "codeQuality": <0-10>,
  "correctness": <0-10>,
  "explanationQuality": <0-10>,
  "feedback": "detailed feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}}"""

        response = await self._generate(prompt, system_prompt)

        try:
            parsed = self._extract_json(response)
            if parsed and isinstance(parsed, dict):
                return {
                    "score": min(10, max(0, float(parsed.get("score", 5)))),
                    "codeQuality": min(10, max(0, float(parsed.get("codeQuality", 5)))),
                    "correctness": min(10, max(0, float(parsed.get("correctness", 5)))),
                    "explanationQuality": min(10, max(0, float(parsed.get("explanationQuality", 5)))),
                    "feedback": parsed.get("feedback", "Evaluation completed."),
                    "strengths": parsed.get("strengths", []),
                    "improvements": parsed.get("improvements", []),
                }
        except Exception as e:
            logger.warning(f"Failed to parse evaluation: {e}")

        # Fallback evaluation based on execution results
        score = 5.0
        if execution_result:
            passed = execution_result.get("testCasesPassed", 0)
            total = execution_result.get("totalTestCases", 1)
            score = (passed / max(total, 1)) * 10

        return {
            "score": score,
            "codeQuality": score,
            "correctness": score,
            "explanationQuality": 5.0 if answer else 0.0,
            "feedback": "AI evaluation completed based on test results.",
            "strengths": ["Solution submitted"] if code else [],
            "improvements": ["Consider adding more explanation"],
        }

    async def generate_feedback(
        self, questions: list[dict], answers: list[dict], topics: list[str]
    ) -> dict:
        """Generate overall interview feedback."""
        system_prompt = """You are a supportive technical interviewer providing constructive feedback.
        Return ONLY valid JSON with no markdown."""

        q_summary = "\n".join(
            [f"Q{i+1} ({q.get('topic', 'General')}): {q.get('text', '')[:100]}"
             for i, q in enumerate(questions[:10])]
        )

        a_summary = "\n".join(
            [f"A{i+1}: Score={a.get('aiEvaluation', {}).get('score', 'N/A')}"
             for i, a in enumerate(answers[:10])]
        )

        prompt = f"""Generate overall feedback for this interview:

Topics covered: {', '.join(topics)}

Questions and Scores:
{q_summary}

Answer Scores:
{a_summary}

Return JSON:
{{
  "overallFeedback": "comprehensive feedback paragraph",
  "topicWiseScores": [
    {{"topic": "topic", "score": <number>, "maxScore": <number>, "feedback": "feedback"}}
  ],
  "strengths": ["list of strengths"],
  "weaknesses": ["list of areas to improve"],
  "recommendedTopics": ["topics to study more"]
}}"""

        response = await self._generate(prompt, system_prompt)

        try:
            parsed = self._extract_json(response)
            if parsed and isinstance(parsed, dict):
                return parsed
        except Exception as e:
            logger.warning(f"Failed to parse feedback: {e}")

        # Fallback feedback
        total_score = sum(
            a.get("aiEvaluation", {}).get("score", 0) for a in answers
        )
        max_score = len(questions) * 10

        return {
            "overallFeedback": f"You scored {total_score}/{max_score}. Keep practicing!",
            "topicWiseScores": [
                {
                    "topic": topic,
                    "score": total_score / max(len(topics), 1),
                    "maxScore": max_score / max(len(topics), 1),
                    "feedback": f"Review {topic} concepts for improvement.",
                }
                for topic in topics
            ],
            "strengths": ["Completed the interview"],
            "weaknesses": ["Review core concepts"],
            "recommendedTopics": topics,
        }

    async def generate_followup(
        self, question: str, answer: str, topic: str, difficulty: str
    ) -> list[str]:
        """Generate follow-up questions based on candidate's response."""
        system_prompt = """You are a technical interviewer asking follow-up questions.
        Return ONLY a JSON array of 2-3 follow-up question strings."""

        prompt = f"""Based on this interview exchange about {topic} ({difficulty} difficulty):

Original question: {question}
Candidate's answer: {answer[:500]}

Generate 2-3 insightful follow-up questions that:
1. Dig deeper into the candidate's understanding
2. Challenge edge cases or assumptions
3. Connect to related concepts

Return as JSON array: ["question1", "question2", "question3"]"""

        response = await self._generate(prompt, system_prompt)

        try:
            parsed = self._extract_json(response)
            if parsed and isinstance(parsed, list):
                return [str(q) for q in parsed[:3]]
        except Exception as e:
            logger.warning(f"Failed to parse follow-up questions: {e}")

        return [
            f"Can you explain the time complexity of your solution?",
            f"How would you handle edge cases in your approach?",
            f"What alternative approaches did you consider?",
        ]

    def _extract_json(self, text: str):
        """Extract JSON from LLM response text."""
        if not text:
            return None

        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting from code blocks
        import re
        json_patterns = [
            r'```json\s*([\s\S]*?)\s*```',
            r'```\s*([\s\S]*?)\s*```',
            r'\[[\s\S]*\]',
            r'\{[\s\S]*\}',
        ]

        for pattern in json_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return json.loads(match.group(1) if '```' in pattern else match.group(0))
                except json.JSONDecodeError:
                    continue

        return None

    def _map_type(self, type_str: str) -> QuestionTypeEnum:
        """Map type string to enum."""
        type_map = {
            "coding": QuestionTypeEnum.coding,
            "mcq": QuestionTypeEnum.mcq,
            "text": QuestionTypeEnum.text,
            "system-design": QuestionTypeEnum.system_design,
            "system_design": QuestionTypeEnum.system_design,
        }
        return type_map.get(type_str.lower(), QuestionTypeEnum.text)

    def _get_fallback_questions(
        self, topic: str, difficulty: str, count: int, languages: list[str]
    ) -> list[Question]:
        """Return fallback questions when AI is unavailable."""
        fallbacks = {
            "DSA": [
                Question(
                    id=str(uuid.uuid4())[:8],
                    text="Implement a function to find the maximum subarray sum (Kadane's algorithm). Explain your approach.",
                    type=QuestionTypeEnum.coding,
                    topic="DSA",
                    difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                    language=languages[0] if languages else "javascript",
                    testCases=[
                        TestCase(input="[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput="6", isHidden=False),
                        TestCase(input="[1]", expectedOutput="1", isHidden=False),
                    ],
                    maxScore=10,
                    timeLimit=900,
                ),
                Question(
                    id=str(uuid.uuid4())[:8],
                    text="Implement a binary search algorithm that finds the first occurrence of a target value in a sorted array.",
                    type=QuestionTypeEnum.coding,
                    topic="DSA",
                    difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                    language=languages[0] if languages else "javascript",
                    testCases=[
                        TestCase(input="[1,2,2,3,4], target=2", expectedOutput="1", isHidden=False),
                    ],
                    maxScore=10,
                    timeLimit=600,
                ),
                Question(
                    id=str(uuid.uuid4())[:8],
                    text="Explain the difference between BFS and DFS. When would you use each? Provide a real-world example.",
                    type=QuestionTypeEnum.text,
                    topic="DSA",
                    difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                    maxScore=10,
                    timeLimit=600,
                ),
            ],
            "System Design": [
                Question(
                    id=str(uuid.uuid4())[:8],
                    text="Design a real-time chat application like Slack. Include system architecture, database schema, and how you'd handle message delivery guarantees.",
                    type=QuestionTypeEnum.system_design,
                    topic="System Design",
                    difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                    maxScore=15,
                    timeLimit=1800,
                ),
            ],
            "Frontend": [
                Question(
                    id=str(uuid.uuid4())[:8],
                    text="Implement a custom React hook `useDebounce` that debounces a value with a configurable delay.",
                    type=QuestionTypeEnum.coding,
                    topic="Frontend",
                    difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                    language="javascript",
                    sampleCode="function useDebounce(value, delay) {\n  // Your implementation here\n}",
                    maxScore=10,
                    timeLimit=600,
                ),
                Question(
                    id=str(uuid.uuid4())[:8],
                    text="Explain the Virtual DOM reconciliation algorithm in React. How does React determine which components to re-render?",
                    type=QuestionTypeEnum.text,
                    topic="Frontend",
                    difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                    maxScore=10,
                    timeLimit=600,
                ),
            ],
            "Backend": [
                Question(
                    id=str(uuid.uuid4())[:8],
                    text="Implement a rate limiter middleware that limits each IP to 100 requests per 15-minute window.",
                    type=QuestionTypeEnum.coding,
                    topic="Backend",
                    difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                    language=languages[0] if languages else "javascript",
                    maxScore=10,
                    timeLimit=900,
                ),
            ],
        }

        questions = fallbacks.get(topic, [
            Question(
                id=str(uuid.uuid4())[:8],
                text=f"Explain the key concepts and best practices in {topic}. Provide practical examples.",
                type=QuestionTypeEnum.text,
                topic=topic,
                difficulty=DifficultyEnum(difficulty) if difficulty != "mixed" else DifficultyEnum.medium,
                maxScore=10,
                timeLimit=600,
            )
        ])

        return questions[:count]


# Singleton instance
ollama_service = OllamaService()
