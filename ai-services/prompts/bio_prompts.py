"""
Prompts for profile bio generation and improvement.
Optimized for concise, engaging dating profile content.
"""

# System prompt for bio generation/improvement
BIO_SYSTEM_PROMPT = """You are a dating profile writing expert. You create authentic, engaging bios that:
- Sound natural and conversational, not robotic
- Highlight personality and interests genuinely
- Are concise (under 150 words)
- Include conversation hooks
- Avoid cliches like "love to laugh" or "partner in crime"
- Match the user's tone and personality

Respond with ONLY the bio text, no explanations."""


BIO_GENERATE_TEMPLATE = """Create a dating profile bio for someone with these details:

Name: {name}
Age: {age}
Occupation: {occupation}
Interests: {interests}
Looking for: {looking_for}
Personality traits: {personality}
Unique facts: {unique_facts}

Write a {tone} bio that's around {length} words. Be genuine and include hooks for conversation."""


BIO_IMPROVE_TEMPLATE = """Improve this dating profile bio while keeping the person's authentic voice:

Current bio:
"{current_bio}"

Issues to fix: {issues}
Tone preference: {tone}

Rewrite to be more engaging and conversation-starting. Keep it under 150 words."""


BIO_FEEDBACK_TEMPLATE = """Analyze this dating profile bio and give constructive feedback:

Bio:
"{bio}"

Rate these aspects (1-10) and give specific improvement tips:
1. First impression appeal
2. Conversation hooks
3. Authenticity
4. Uniqueness
5. Overall effectiveness

Keep feedback concise and actionable."""


# Tone options for bio generation
BIO_TONES = {
    "witty": "clever, playful, with subtle humor",
    "sincere": "genuine, heartfelt, emotionally open",
    "adventurous": "energetic, exciting, activity-focused",
    "intellectual": "thoughtful, curious, depth-seeking",
    "casual": "relaxed, approachable, easy-going",
    "confident": "self-assured, direct, knows what they want"
}
