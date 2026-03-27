from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class DifficultyEnum(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"
    mixed = "mixed"


class QuestionTypeEnum(str, Enum):
    coding = "coding"
    mcq = "mcq"
    text = "text"
    system_design = "system-design"


class TestCase(BaseModel):
    input: str
    expectedOutput: str
    isHidden: bool = False


class Question(BaseModel):
    id: str
    text: str
    type: QuestionTypeEnum
    topic: str
    difficulty: DifficultyEnum
    language: Optional[str] = None
    testCases: Optional[list[TestCase]] = None
    sampleCode: Optional[str] = None
    followUpQuestions: Optional[list[str]] = None
    maxScore: int = 10
    timeLimit: Optional[int] = None


class GenerateQuestionsRequest(BaseModel):
    topics: list[str]
    difficulty: str
    questionsPerTopic: int = Field(default=3, ge=1, le=20)
    languages: list[str]
    customTopics: Optional[list[str]] = None


class GenerateQuestionsResponse(BaseModel):
    questions: list[Question]
    totalGenerated: int


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    code: Optional[str] = None
    language: Optional[str] = None
    executionResult: Optional[dict] = None


class AnswerEvaluation(BaseModel):
    score: float = Field(ge=0, le=10)
    codeQuality: float = Field(ge=0, le=10)
    correctness: float = Field(ge=0, le=10)
    explanationQuality: float = Field(ge=0, le=10)
    feedback: str
    strengths: list[str]
    improvements: list[str]


class EvaluateAnswerResponse(BaseModel):
    evaluation: AnswerEvaluation


class GenerateFeedbackRequest(BaseModel):
    questions: list[dict]
    answers: list[dict]
    topics: list[str]


class TopicScore(BaseModel):
    topic: str
    score: float
    maxScore: float
    feedback: str


class FeedbackResult(BaseModel):
    overallFeedback: str
    topicWiseScores: list[TopicScore]
    strengths: list[str]
    weaknesses: list[str]
    recommendedTopics: list[str]


class GenerateFeedbackResponse(BaseModel):
    feedback: FeedbackResult


class GenerateFollowUpRequest(BaseModel):
    question: str
    answer: str
    topic: str
    difficulty: str


class GenerateFollowUpResponse(BaseModel):
    followUpQuestions: list[str]
