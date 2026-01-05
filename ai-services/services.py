"""
AI Service implementations.
Business logic for all AI features.
"""

import structlog
from typing import List, Optional
from cachetools import TTLCache
from functools import lru_cache

from ollama_client import get_ollama_client, OllamaError
from config import get_settings
from models import (
    BioGenerateRequest, BioImproveRequest, BioFeedbackRequest,
    ConversationStarterRequest, MessageSuggestionRequest,
    CompatibilityRequest, IcebreakerRequest, ProfileReviewRequest,
    ProfileSummary, UserProfile
)
from prompts import (
    BIO_SYSTEM_PROMPT, BIO_GENERATE_TEMPLATE, BIO_IMPROVE_TEMPLATE, BIO_FEEDBACK_TEMPLATE, BIO_TONES,
    CONVERSATION_SYSTEM_PROMPT, CONVERSATION_STARTER_TEMPLATE, MESSAGE_SUGGESTION_TEMPLATE,
    CONVERSATION_STYLES, MESSAGE_GOALS,
    COMPATIBILITY_SYSTEM_PROMPT, COMPATIBILITY_ANALYSIS_TEMPLATE, QUICK_COMPATIBILITY_TEMPLATE,
    ICEBREAKER_SYSTEM_PROMPT, ICEBREAKER_GENERATE_TEMPLATE, ICEBREAKER_CATEGORIES,
    ICEBREAKER_TEMPLATES_BY_INTEREST, ICEBREAKER_DIFFICULTY,
    REVIEW_SYSTEM_PROMPT, PROFILE_REVIEW_TEMPLATE, QUICK_REVIEW_TEMPLATE
)

logger = structlog.get_logger()

# Simple cache for repeated requests
_cache = TTLCache(maxsize=100, ttl=300)


def _cache_key(*args) -> str:
    """Create cache key from arguments."""
    return str(hash(str(args)))


class BioService:
    """Service for profile bio operations."""

    def __init__(self):
        self.client = get_ollama_client()

    async def generate(self, request: BioGenerateRequest) -> dict:
        """Generate a new dating profile bio."""
        tone_desc = BIO_TONES.get(request.tone.value, "casual and approachable")

        prompt = BIO_GENERATE_TEMPLATE.format(
            name=request.name,
            age=request.age,
            occupation=request.occupation,
            interests=", ".join(request.interests),
            looking_for=request.looking_for,
            personality=", ".join(request.personality) if request.personality else "not specified",
            unique_facts=", ".join(request.unique_facts) if request.unique_facts else "none provided",
            tone=tone_desc,
            length=request.length
        )

        bio = await self.client.generate(
            prompt=prompt,
            system_prompt=BIO_SYSTEM_PROMPT,
            max_tokens=200
        )

        return {
            "bio": bio,
            "word_count": len(bio.split()),
            "tone_used": request.tone.value
        }

    async def improve(self, request: BioImproveRequest) -> dict:
        """Improve an existing bio."""
        tone_desc = BIO_TONES.get(request.tone.value, "casual and approachable")

        prompt = BIO_IMPROVE_TEMPLATE.format(
            current_bio=request.current_bio,
            issues=", ".join(request.issues),
            tone=tone_desc
        )

        bio = await self.client.generate(
            prompt=prompt,
            system_prompt=BIO_SYSTEM_PROMPT,
            max_tokens=200
        )

        return {
            "bio": bio,
            "word_count": len(bio.split()),
            "tone_used": request.tone.value
        }

    async def get_feedback(self, request: BioFeedbackRequest) -> dict:
        """Get feedback on a bio."""
        prompt = BIO_FEEDBACK_TEMPLATE.format(bio=request.bio)

        feedback = await self.client.generate(
            prompt=prompt,
            system_prompt=BIO_SYSTEM_PROMPT,
            max_tokens=300
        )

        return {"feedback": feedback}


class ConversationService:
    """Service for conversation assistance."""

    def __init__(self):
        self.client = get_ollama_client()

    def _find_common_interests(
        self,
        interests_a: List[str],
        interests_b: List[str]
    ) -> List[str]:
        """Find common interests between two profiles."""
        set_a = set(i.lower().strip() for i in interests_a)
        set_b = set(i.lower().strip() for i in interests_b)
        return list(set_a.intersection(set_b))

    async def get_starters(self, request: ConversationStarterRequest) -> dict:
        """Generate conversation starters."""
        common = self._find_common_interests(
            request.target_profile.interests,
            request.my_profile.interests
        )

        style_desc = CONVERSATION_STYLES.get(
            request.style.value,
            "genuine and curious"
        )

        prompt = CONVERSATION_STARTER_TEMPLATE.format(
            count=request.count,
            name=request.target_profile.name,
            bio=request.target_profile.bio or "No bio provided",
            interests=", ".join(request.target_profile.interests) or "Not specified",
            photos_context=request.target_profile.photos_context or "Not described",
            sender_name=request.my_profile.name,
            sender_interests=", ".join(request.my_profile.interests) or "Not specified",
            common_interests=", ".join(common) if common else "None identified yet",
            style=style_desc
        )

        response = await self.client.generate(
            prompt=prompt,
            system_prompt=CONVERSATION_SYSTEM_PROMPT,
            max_tokens=250
        )

        # Parse numbered responses
        lines = response.strip().split("\n")
        starters = []
        for line in lines:
            # Remove numbering like "1.", "1)", etc.
            clean = line.strip()
            if clean and clean[0].isdigit():
                clean = clean.lstrip("0123456789.)")
                clean = clean.strip()
            if clean:
                starters.append(clean)

        return {
            "starters": starters[:request.count],
            "common_interests": common
        }

    async def suggest_messages(self, request: MessageSuggestionRequest) -> dict:
        """Suggest reply messages."""
        # Format conversation history
        history_text = ""
        last_message = ""
        for msg in request.conversation_history:
            role = "Me" if msg.get("role") == "user" else "Them"
            content = msg.get("content", "")
            history_text += f"{role}: {content}\n"
            if msg.get("role") != "user":
                last_message = content

        goal_desc = MESSAGE_GOALS.get(request.goal.value, "building connection")

        prompt = MESSAGE_SUGGESTION_TEMPLATE.format(
            count=request.count,
            conversation_history=history_text or "No previous messages",
            last_message=last_message or "Starting conversation",
            their_interests=", ".join(request.their_interests) or "Unknown",
            my_interests=", ".join(request.my_interests) or "Not specified",
            goal=goal_desc
        )

        response = await self.client.generate(
            prompt=prompt,
            system_prompt=CONVERSATION_SYSTEM_PROMPT,
            max_tokens=250
        )

        # Parse suggestions
        lines = response.strip().split("\n")
        suggestions = []
        for line in lines:
            clean = line.strip()
            if clean and clean[0].isdigit():
                clean = clean.lstrip("0123456789.)")
                clean = clean.strip()
            if clean:
                suggestions.append(clean)

        return {
            "suggestions": suggestions[:request.count],
            "goal_used": request.goal.value
        }


class CompatibilityService:
    """Service for compatibility analysis."""

    def __init__(self):
        self.client = get_ollama_client()

    async def analyze(self, request: CompatibilityRequest) -> dict:
        """Analyze compatibility between two profiles."""
        if request.quick_mode:
            prompt = QUICK_COMPATIBILITY_TEMPLATE.format(
                user_a_interests=", ".join(request.user_a.interests),
                user_a_looking_for=request.user_a.looking_for,
                user_b_interests=", ".join(request.user_b.interests),
                user_b_looking_for=request.user_b.looking_for
            )
            max_tokens = 100
        else:
            prompt = COMPATIBILITY_ANALYSIS_TEMPLATE.format(
                user_a_name=request.user_a.name,
                user_a_age=request.user_a.age,
                user_a_bio=request.user_a.bio or "No bio",
                user_a_interests=", ".join(request.user_a.interests) or "Not specified",
                user_a_looking_for=request.user_a.looking_for or "Not specified",
                user_a_values=", ".join(request.user_a.values) or "Not specified",
                user_b_name=request.user_b.name,
                user_b_age=request.user_b.age,
                user_b_bio=request.user_b.bio or "No bio",
                user_b_interests=", ".join(request.user_b.interests) or "Not specified",
                user_b_looking_for=request.user_b.looking_for or "Not specified",
                user_b_values=", ".join(request.user_b.values) or "Not specified"
            )
            max_tokens = 350

        analysis = await self.client.generate(
            prompt=prompt,
            system_prompt=COMPATIBILITY_SYSTEM_PROMPT,
            max_tokens=max_tokens
        )

        # Try to extract score from response
        score = 70  # Default
        for word in analysis.split():
            clean = word.strip("()[]%/")
            if clean.isdigit():
                num = int(clean)
                if 1 <= num <= 100:
                    score = num
                    break

        return {
            "score": score,
            "analysis": analysis,
            "connection_points": [],
            "conversation_topics": []
        }


class IcebreakerService:
    """Service for icebreaker questions."""

    def __init__(self):
        self.client = get_ollama_client()

    def _get_template_questions(self, interests: List[str]) -> List[str]:
        """Get template questions based on interests."""
        questions = []
        for interest in interests[:3]:  # First 3 interests
            interest_lower = interest.lower()
            for key, templates in ICEBREAKER_TEMPLATES_BY_INTEREST.items():
                if key in interest_lower or interest_lower in key:
                    questions.extend(templates[:1])  # Add 1 from each match
                    break

        # Add defaults if not enough
        if len(questions) < 2:
            questions.extend(ICEBREAKER_TEMPLATES_BY_INTEREST["default"][:2])

        return questions[:3]

    async def generate(self, request: IcebreakerRequest) -> dict:
        """Generate icebreaker questions."""
        category_desc = ICEBREAKER_CATEGORIES.get(
            request.category.value,
            "interesting and unique"
        )
        difficulty_desc = ICEBREAKER_DIFFICULTY.get(
            request.difficulty.value,
            "approachable"
        )

        # Determine vibe from bio
        bio = request.their_profile.bio or ""
        vibe = "friendly"
        if any(word in bio.lower() for word in ["adventure", "travel", "hike"]):
            vibe = "adventurous"
        elif any(word in bio.lower() for word in ["book", "read", "learn"]):
            vibe = "intellectual"
        elif any(word in bio.lower() for word in ["funny", "laugh", "humor"]):
            vibe = "playful"

        prompt = ICEBREAKER_GENERATE_TEMPLATE.format(
            count=request.count,
            interests=", ".join(request.their_profile.interests) or "various",
            bio_excerpt=bio[:200] if bio else "Not provided",
            vibe=vibe,
            category=category_desc,
            difficulty=difficulty_desc,
            style=category_desc
        )

        response = await self.client.generate(
            prompt=prompt,
            system_prompt=ICEBREAKER_SYSTEM_PROMPT,
            max_tokens=200
        )

        # Parse questions
        lines = response.strip().split("\n")
        questions = []
        for line in lines:
            clean = line.strip()
            if clean and clean[0].isdigit():
                clean = clean.lstrip("0123456789.)")
                clean = clean.strip()
            if clean and "?" in clean:
                questions.append(clean)

        # Fallback to templates if AI didn't generate enough
        if len(questions) < request.count:
            template_qs = self._get_template_questions(request.their_profile.interests)
            for q in template_qs:
                if q not in questions and len(questions) < request.count:
                    questions.append(q)

        return {
            "questions": questions[:request.count],
            "category_used": request.category.value
        }


class ProfileReviewService:
    """Service for profile reviews."""

    def __init__(self):
        self.client = get_ollama_client()

    async def review(self, request: ProfileReviewRequest) -> dict:
        """Review a dating profile."""
        prompts_text = ""
        if request.prompts:
            for p in request.prompts:
                prompts_text += f"Prompt: {p.get('prompt', 'N/A')}\n"
                prompts_text += f"Answer: {p.get('answer', 'N/A')}\n\n"
        else:
            prompts_text = "No prompts provided"

        if request.quick_mode:
            prompt = QUICK_REVIEW_TEMPLATE.format(bio=request.bio)
            max_tokens = 150
        else:
            prompt = PROFILE_REVIEW_TEMPLATE.format(
                bio=request.bio,
                photos_description=request.photos_description or "No description provided",
                prompts=prompts_text,
                age=request.age,
                looking_for=request.looking_for or "Not specified"
            )
            max_tokens = 400

        review = await self.client.generate(
            prompt=prompt,
            system_prompt=REVIEW_SYSTEM_PROMPT,
            max_tokens=max_tokens
        )

        # Try to extract score
        score = None
        for word in review.split():
            clean = word.strip("()[]%/:")
            if clean.isdigit():
                num = int(clean)
                if 1 <= num <= 10:
                    score = num
                    break

        return {
            "review": review,
            "overall_score": score,
            "top_improvements": []
        }


# Service singletons
_bio_service: Optional[BioService] = None
_conversation_service: Optional[ConversationService] = None
_compatibility_service: Optional[CompatibilityService] = None
_icebreaker_service: Optional[IcebreakerService] = None
_review_service: Optional[ProfileReviewService] = None


def get_bio_service() -> BioService:
    global _bio_service
    if _bio_service is None:
        _bio_service = BioService()
    return _bio_service


def get_conversation_service() -> ConversationService:
    global _conversation_service
    if _conversation_service is None:
        _conversation_service = ConversationService()
    return _conversation_service


def get_compatibility_service() -> CompatibilityService:
    global _compatibility_service
    if _compatibility_service is None:
        _compatibility_service = CompatibilityService()
    return _compatibility_service


def get_icebreaker_service() -> IcebreakerService:
    global _icebreaker_service
    if _icebreaker_service is None:
        _icebreaker_service = IcebreakerService()
    return _icebreaker_service


def get_review_service() -> ProfileReviewService:
    global _review_service
    if _review_service is None:
        _review_service = ProfileReviewService()
    return _review_service
