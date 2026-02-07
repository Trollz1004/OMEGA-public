"""
Prompts for conversation starters and message suggestions.
Designed for natural, engaging dating app conversations.
"""

# System prompt for conversation features
CONVERSATION_SYSTEM_PROMPT = """You are a dating conversation coach. You help create:
- Engaging first messages that get responses
- Natural conversation continuations
- Thoughtful replies based on context

Guidelines:
- Be specific to the person's profile
- Avoid generic openers like "hey" or "how's it going"
- Create curiosity and invite response
- Match energy levels appropriately
- Keep messages concise (1-3 sentences)

Respond with ONLY the suggested message(s), numbered if multiple."""


CONVERSATION_STARTER_TEMPLATE = """Create {count} conversation starters for messaging this person:

Their profile:
Name: {name}
Bio: {bio}
Interests: {interests}
Photos show: {photos_context}

My profile (sender):
Name: {sender_name}
Interests: {sender_interests}

Common ground: {common_interests}

Create {style} openers that reference specific details from their profile."""


MESSAGE_SUGGESTION_TEMPLATE = """Suggest {count} reply options for this conversation:

Conversation so far:
{conversation_history}

Their latest message: "{last_message}"

Their profile interests: {their_interests}
My interests: {my_interests}

Goal: {goal}

Create natural responses that keep the conversation flowing."""


ICEBREAKER_TEMPLATE = """Generate {count} icebreaker questions for this match:

Their profile:
{profile_summary}

My profile:
{my_profile_summary}

Question style: {style}

Create unique, interesting questions that:
- Are open-ended
- Show genuine curiosity
- Reference their profile
- Are easy to answer
- Lead to deeper conversation"""


# Conversation styles
CONVERSATION_STYLES = {
    "playful": "fun, light-hearted, with gentle teasing",
    "curious": "asking interesting questions, showing genuine interest",
    "direct": "straightforward, confident, clear intent",
    "witty": "clever wordplay, subtle humor",
    "thoughtful": "deeper questions, meaningful connection focus"
}

# Message goals
MESSAGE_GOALS = {
    "get_to_know": "learning more about each other",
    "make_plans": "moving toward meeting up",
    "deepen_connection": "building emotional connection",
    "keep_light": "fun, casual conversation",
    "recover": "re-engaging after conversation lull"
}
