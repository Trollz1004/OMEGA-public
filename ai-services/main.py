"""
Dating App AI Services - FastAPI Application
Provides AI-powered features for dating app profiles and conversations.
Optimized for GTX 1050Ti (4GB VRAM) with Ollama/Llama.
"""

import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import get_settings, RECOMMENDED_MODELS
from ollama_client import get_ollama_client, OllamaError
from models import (
    BioGenerateRequest, BioImproveRequest, BioFeedbackRequest,
    BioResponse, BioFeedbackResponse,
    ConversationStarterRequest, ConversationStarterResponse,
    MessageSuggestionRequest, MessageSuggestionResponse,
    CompatibilityRequest, CompatibilityResponse,
    IcebreakerRequest, IcebreakerResponse,
    ProfileReviewRequest, ProfileReviewResponse,
    HealthResponse
)
from services import (
    get_bio_service, get_conversation_service,
    get_compatibility_service, get_icebreaker_service,
    get_review_service
)

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()
settings = get_settings()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info(
        "Starting AI Services",
        model=settings.ollama_model,
        host=settings.ollama_host
    )

    # Check Ollama connection
    client = get_ollama_client()
    health = await client.health_check()
    if not health.get("ollama_running"):
        logger.warning(
            "Ollama not available at startup",
            error=health.get("error")
        )
    else:
        logger.info(
            "Ollama connection verified",
            model_available=health.get("model_available")
        )

    yield

    # Shutdown
    logger.info("Shutting down AI Services")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered dating app features using Ollama/Llama",
    lifespan=lifespan
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Exception Handler ==============

@app.exception_handler(OllamaError)
async def ollama_exception_handler(request: Request, exc: OllamaError):
    """Handle Ollama-specific errors."""
    logger.error("Ollama error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=503,
        content={
            "error": "AI service temporarily unavailable",
            "detail": str(exc),
            "hint": "Ensure Ollama is running with the configured model"
        }
    )


# ============== Health Endpoints ==============

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check service health and Ollama connection."""
    client = get_ollama_client()
    ollama_status = await client.health_check()

    return HealthResponse(
        status="healthy" if ollama_status.get("ollama_running") else "degraded",
        ollama_status=ollama_status,
        model=settings.ollama_model,
        version=settings.app_version
    )


@app.get("/models", tags=["Health"])
async def get_recommended_models():
    """Get recommended models for GTX 1050Ti."""
    return {
        "current_model": settings.ollama_model,
        "recommended_models": RECOMMENDED_MODELS,
        "note": "For GTX 1050Ti with 4GB VRAM, 'balanced' is recommended"
    }


# ============== Bio Endpoints ==============

@app.post("/bio/generate", response_model=BioResponse, tags=["Bio"])
@limiter.limit("10/minute")
async def generate_bio(request: Request, data: BioGenerateRequest):
    """
    Generate a new dating profile bio.

    Creates an engaging, personalized bio based on provided details.
    """
    service = get_bio_service()
    result = await service.generate(data)
    return BioResponse(**result)


@app.post("/bio/improve", response_model=BioResponse, tags=["Bio"])
@limiter.limit("10/minute")
async def improve_bio(request: Request, data: BioImproveRequest):
    """
    Improve an existing dating profile bio.

    Enhances the bio while maintaining the user's authentic voice.
    """
    service = get_bio_service()
    result = await service.improve(data)
    return BioResponse(**result)


@app.post("/bio/feedback", response_model=BioFeedbackResponse, tags=["Bio"])
@limiter.limit("15/minute")
async def get_bio_feedback(request: Request, data: BioFeedbackRequest):
    """
    Get feedback on a dating profile bio.

    Provides constructive criticism and improvement suggestions.
    """
    service = get_bio_service()
    result = await service.get_feedback(data)
    return BioFeedbackResponse(**result)


# ============== Conversation Endpoints ==============

@app.post("/conversation/starters", response_model=ConversationStarterResponse, tags=["Conversation"])
@limiter.limit("20/minute")
async def get_conversation_starters(request: Request, data: ConversationStarterRequest):
    """
    Generate conversation starters for a match.

    Creates personalized opening messages based on both profiles.
    """
    service = get_conversation_service()
    result = await service.get_starters(data)
    return ConversationStarterResponse(**result)


@app.post("/conversation/suggest", response_model=MessageSuggestionResponse, tags=["Conversation"])
@limiter.limit("30/minute")
async def suggest_messages(request: Request, data: MessageSuggestionRequest):
    """
    Suggest reply messages during a conversation.

    Generates contextual responses based on conversation history.
    """
    service = get_conversation_service()
    result = await service.suggest_messages(data)
    return MessageSuggestionResponse(**result)


# ============== Compatibility Endpoints ==============

@app.post("/compatibility/analyze", response_model=CompatibilityResponse, tags=["Compatibility"])
@limiter.limit("15/minute")
async def analyze_compatibility(request: Request, data: CompatibilityRequest):
    """
    Analyze compatibility between two profiles.

    Provides compatibility score, connection points, and conversation topics.
    Set quick_mode=true for faster, shorter analysis.
    """
    service = get_compatibility_service()
    result = await service.analyze(data)
    return CompatibilityResponse(**result)


# ============== Icebreaker Endpoints ==============

@app.post("/icebreaker/generate", response_model=IcebreakerResponse, tags=["Icebreaker"])
@limiter.limit("20/minute")
async def generate_icebreakers(request: Request, data: IcebreakerRequest):
    """
    Generate icebreaker questions for a match.

    Creates unique conversation starters based on their profile.
    """
    service = get_icebreaker_service()
    result = await service.generate(data)
    return IcebreakerResponse(**result)


# ============== Profile Review Endpoints ==============

@app.post("/profile/review", response_model=ProfileReviewResponse, tags=["Profile Review"])
@limiter.limit("5/minute")
async def review_profile(request: Request, data: ProfileReviewRequest):
    """
    Get a comprehensive profile review.

    Provides detailed feedback on bio, photos, and prompts.
    Set quick_mode=true for faster, brief feedback.
    """
    service = get_review_service()
    result = await service.review(data)
    return ProfileReviewResponse(**result)


# ============== Utility Endpoints ==============

@app.get("/", tags=["Root"])
async def root():
    """API root - returns service info."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers,
        reload=settings.debug
    )
