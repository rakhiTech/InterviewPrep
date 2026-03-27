import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    GenerateFeedbackRequest,
    GenerateFeedbackResponse,
    GenerateFollowUpRequest,
    GenerateFollowUpResponse,
)
from ollama_service import ollama_service

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="InterviewPrepAI - AI Service",
    description="AI-powered question generation, evaluation, and feedback service using Ollama (local LLM)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "InterviewPrepAI AI Service",
        "status": "running",
        "model": settings.OLLAMA_MODEL,
        "ollama_url": settings.OLLAMA_BASE_URL,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            ollama_status = "connected" if resp.status_code == 200 else "unavailable"
    except Exception:
        ollama_status = "unavailable"

    return {
        "status": "healthy",
        "ollama": ollama_status,
        "model": settings.OLLAMA_MODEL,
    }


@app.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(request: GenerateQuestionsRequest):
    """Generate interview questions based on topics and difficulty."""
    logger.info(
        f"Generating questions: topics={request.topics}, "
        f"difficulty={request.difficulty}, "
        f"perTopic={request.questionsPerTopic}"
    )

    try:
        questions = await ollama_service.generate_questions(
            topics=request.topics,
            difficulty=request.difficulty,
            questions_per_topic=request.questionsPerTopic,
            languages=request.languages,
            custom_topics=request.customTopics,
        )

        return GenerateQuestionsResponse(
            questions=questions,
            totalGenerated=len(questions),
        )
    except Exception as e:
        logger.error(f"Question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")


@app.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
async def evaluate_answer(request: EvaluateAnswerRequest):
    """Evaluate a candidate's answer using AI."""
    logger.info(f"Evaluating answer for question: {request.question[:80]}...")

    try:
        evaluation = await ollama_service.evaluate_answer(
            question=request.question,
            answer=request.answer,
            code=request.code,
            language=request.language,
            execution_result=request.executionResult,
        )

        return EvaluateAnswerResponse(evaluation=evaluation)
    except Exception as e:
        logger.error(f"Answer evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@app.post("/generate-feedback", response_model=GenerateFeedbackResponse)
async def generate_feedback(request: GenerateFeedbackRequest):
    """Generate overall interview feedback."""
    logger.info(f"Generating feedback for {len(request.questions)} questions")

    try:
        feedback = await ollama_service.generate_feedback(
            questions=request.questions,
            answers=request.answers,
            topics=request.topics,
        )

        return GenerateFeedbackResponse(feedback=feedback)
    except Exception as e:
        logger.error(f"Feedback generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Feedback generation failed: {str(e)}")


@app.post("/generate-followup", response_model=GenerateFollowUpResponse)
async def generate_followup(request: GenerateFollowUpRequest):
    """Generate follow-up questions based on candidate's response."""
    logger.info(f"Generating follow-up for topic: {request.topic}")

    try:
        follow_ups = await ollama_service.generate_followup(
            question=request.question,
            answer=request.answer,
            topic=request.topic,
            difficulty=request.difficulty,
        )

        return GenerateFollowUpResponse(followUpQuestions=follow_ups)
    except Exception as e:
        logger.error(f"Follow-up generation failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Follow-up generation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
