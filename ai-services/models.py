"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# ============== Enums ==============

class BioTone(str, Enum):
    WITTY = "witty"
    SINCERE = "sincere"
    ADVENTUROUS = "adventurous"
    INTELLECTUAL = "intellectual"
    CASUAL = "casual"
    CONFIDENT = "confident"


class ConversationStyle(str, Enum):
    PLAYFUL = "playful"
    CURIOUS = "curious"
    DIRECT = "direct"
    WITTY = "witty"
    THOUGHTFUL = "thoughtful"


class MessageGoal(str, Enum):
    GET_TO_KNOW = "get_to_know"
    MAKE_PLANS = "make_plans"
    DEEPEN_CONNECTION = "deepen_connection"
    KEEP_LIGHT = "keep_light"
    RECOVER = "recover"


class IcebreakerCategory(str, Enum):
    HYPOTHETICAL = "hypothetical"
    EXPERIENCES = "experiences"
    PREFERENCES = "preferences"
    DREAMS = "dreams"
    QUIRKY = "quirky"
    DEEP = "deep"


class IcebreakerDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    DEEP = "deep"


# ============== Bio Models ==============

class BioGenerateRequest(BaseModel):
    """Request for generating a new bio."""
    name: str = Field(..., min_length=1, max_length=50)
    age: int = Field(..., ge=18, le=100)
    occupation: str = Field(..., max_length=100)
    interests: List[str] = Field(..., min_items=1, max_items=10)
    looking_for: str = Field(..., max_length=200)
    personality: List[str] = Field(default=[], max_items=5)
    unique_facts: List[str] = Field(default=[], max_items=3)
    tone: BioTone = Field(default=BioTone.CASUAL)
    length: int = Field(default=100, ge=50, le=200)


class BioImproveRequest(BaseModel):
    """Request for improving an existing bio."""
    current_bio: str = Field(..., min_length=10, max_length=1000)
    issues: List[str] = Field(default=["too generic", "lacks personality"])
    tone: BioTone = Field(default=BioTone.CASUAL)


class BioFeedbackRequest(BaseModel):
    """Request for bio feedback."""
    bio: str = Field(..., min_length=10, max_length=1000)


class BioResponse(BaseModel):
    """Response with generated/improved bio."""
    bio: str
    word_count: int
    tone_used: str


class BioFeedbackResponse(BaseModel):
    """Response with bio feedback."""
    feedback: str
    scores: Optional[dict] = None


# ============== Conversation Models ==============

class ProfileSummary(BaseModel):
    """Summary of a user's profile."""
    name: str
    bio: str = ""
    interests: List[str] = []
    photos_context: str = ""


class ConversationStarterRequest(BaseModel):
    """Request for conversation starters."""
    target_profile: ProfileSummary
    my_profile: ProfileSummary
    count: int = Field(default=3, ge=1, le=5)
    style: ConversationStyle = Field(default=ConversationStyle.CURIOUS)


class ConversationStarterResponse(BaseModel):
    """Response with conversation starters."""
    starters: List[str]
    common_interests: List[str]


class MessageSuggestionRequest(BaseModel):
    """Request for message suggestions."""
    conversation_history: List[dict]  # [{"role": "user"|"them", "content": "..."}]
    their_interests: List[str] = []
    my_interests: List[str] = []
    goal: MessageGoal = Field(default=MessageGoal.GET_TO_KNOW)
    count: int = Field(default=3, ge=1, le=5)


class MessageSuggestionResponse(BaseModel):
    """Response with message suggestions."""
    suggestions: List[str]
    goal_used: str


# ============== Compatibility Models ==============

class UserProfile(BaseModel):
    """Complete user profile for compatibility analysis."""
    name: str
    age: int = Field(ge=18, le=100)
    bio: str = ""
    interests: List[str] = []
    looking_for: str = ""
    values: List[str] = []


class CompatibilityRequest(BaseModel):
    """Request for compatibility analysis."""
    user_a: UserProfile
    user_b: UserProfile
    quick_mode: bool = Field(default=False)


class CompatibilityResponse(BaseModel):
    """Response with compatibility analysis."""
    score: int = Field(ge=0, le=100)
    analysis: str
    connection_points: List[str] = []
    conversation_topics: List[str] = []
    date_idea: Optional[str] = None


# ============== Icebreaker Models ==============

class IcebreakerRequest(BaseModel):
    """Request for icebreaker questions."""
    their_profile: ProfileSummary
    my_profile: Optional[ProfileSummary] = None
    category: IcebreakerCategory = Field(default=IcebreakerCategory.QUIRKY)
    difficulty: IcebreakerDifficulty = Field(default=IcebreakerDifficulty.EASY)
    count: int = Field(default=3, ge=1, le=5)


class IcebreakerResponse(BaseModel):
    """Response with icebreaker questions."""
    questions: List[str]
    category_used: str


# ============== Profile Review Models ==============

class ProfileReviewRequest(BaseModel):
    """Request for profile review."""
    bio: str = Field(..., min_length=10)
    photos_description: str = ""
    prompts: List[dict] = []  # [{"prompt": "...", "answer": "..."}]
    age: int = Field(ge=18, le=100)
    looking_for: str = ""
    quick_mode: bool = Field(default=False)


class ProfileReviewResponse(BaseModel):
    """Response with profile review."""
    review: str
    overall_score: Optional[int] = Field(default=None, ge=1, le=10)
    top_improvements: List[str] = []


# ============== Health/Status Models ==============

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    ollama_status: dict
    model: str
    version: str
