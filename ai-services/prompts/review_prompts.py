"""
Prompts for profile review and feedback.
Provides constructive analysis of dating profiles.
"""

# System prompt for profile reviews
REVIEW_SYSTEM_PROMPT = """You are a dating profile consultant. You provide:
- Honest, constructive feedback
- Specific, actionable suggestions
- Balanced analysis (strengths and improvements)
- Practical tips for better results

Be encouraging but direct. Focus on what can be improved.
Keep feedback concise and prioritized."""


PROFILE_REVIEW_TEMPLATE = """Review this dating profile:

BIO:
"{bio}"

PHOTOS DESCRIBED:
{photos_description}

PROMPTS/ANSWERS (if any):
{prompts}

BASIC INFO:
Age: {age}
Looking for: {looking_for}

Provide a structured review:

1. FIRST IMPRESSION (1-10)
   - What works
   - What could be stronger

2. BIO ANALYSIS
   - Strengths
   - Areas to improve
   - Suggested edits (if any)

3. PROFILE PROMPTS
   - Effectiveness
   - Better alternatives

4. OVERALL TIPS (top 3 priorities)

5. PREDICTED SWIPE RATE: estimate how often this profile gets right-swiped

Be specific and actionable. Reference actual content from their profile."""


QUICK_REVIEW_TEMPLATE = """Quick profile check:

Bio: "{bio}"

Give 3 specific things to improve, in order of importance. One sentence each."""


PHOTO_ADVICE_TEMPLATE = """Based on these photo descriptions, give advice:

Photos:
{photos_description}

Suggest:
1. Which photo should be first
2. Any photos to replace
3. What's missing from the photo lineup
4. Overall photo strategy tips

Be specific to what they have."""


PROMPT_SUGGESTIONS_TEMPLATE = """Suggest better prompt answers for this profile:

Current prompts and answers:
{current_prompts}

Profile context:
Bio: {bio}
Interests: {interests}

For each prompt, provide:
1. Rating of current answer (1-10)
2. Why it works or doesn't
3. A better alternative answer

Keep suggestions authentic to their personality."""


# Review aspects with weights
PROFILE_ASPECTS = {
    "bio_quality": {
        "weight": 0.25,
        "criteria": ["authenticity", "hooks", "uniqueness", "length"]
    },
    "photo_quality": {
        "weight": 0.40,
        "criteria": ["variety", "quality", "personality", "first_photo"]
    },
    "prompts_quality": {
        "weight": 0.20,
        "criteria": ["creativity", "specificity", "conversation_starters"]
    },
    "overall_coherence": {
        "weight": 0.15,
        "criteria": ["consistency", "target_audience", "vibe"]
    }
}
