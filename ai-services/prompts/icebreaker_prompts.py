"""
Prompts for icebreaker questions and fun conversation starters.
Designed to spark engaging initial conversations.
"""

# System prompt for icebreakers
ICEBREAKER_SYSTEM_PROMPT = """You are a conversation specialist for dating apps. You create:
- Unique, memorable questions
- Fun hypothetical scenarios
- Thought-provoking prompts
- Playful challenges

Questions should be:
- Easy to answer but invite elaboration
- Reveal personality
- Create shared experiences
- Avoid being too personal too fast

Respond with ONLY the questions, numbered."""


ICEBREAKER_GENERATE_TEMPLATE = """Generate {count} icebreaker questions for this match:

Their profile highlights:
- Interests: {interests}
- Bio excerpt: {bio_excerpt}
- Vibe: {vibe}

Question category: {category}
Difficulty: {difficulty}

Create questions that are {style} and relate to their profile."""


ICEBREAKER_CATEGORIES = {
    "hypothetical": "fun 'would you rather' or 'what if' scenarios",
    "experiences": "questions about memorable experiences",
    "preferences": "favorites and personal preferences",
    "dreams": "aspirations, bucket list, future plans",
    "quirky": "unusual, unexpected questions that stand out",
    "deep": "meaningful questions about values and beliefs"
}


ICEBREAKER_TEMPLATES_BY_INTEREST = {
    "travel": [
        "If you could teleport anywhere for dinner tonight, where would we go?",
        "What's the most unexpected thing that happened on one of your trips?",
        "Dream destination you haven't visited yet?"
    ],
    "food": [
        "Controversial opinion: what food combination do you love that others find weird?",
        "If you had to eat one cuisine for a month, what would it be?",
        "Best meal you've ever had - what made it special?"
    ],
    "music": [
        "What song would play when you walk into a room in a movie about your life?",
        "Last concert you went to or want to go to?",
        "Song that instantly puts you in a good mood?"
    ],
    "fitness": [
        "What's your go-to way to convince yourself to work out on lazy days?",
        "If you could master any sport or physical skill overnight, what would it be?",
        "Morning workout or evening - and why?"
    ],
    "books": [
        "Book that changed how you see something?",
        "If your life was a book, what genre would it be?",
        "Current read or what's on your to-read list?"
    ],
    "movies": [
        "Movie you can quote way too much of?",
        "Film that's your guilty pleasure?",
        "If you could live in any movie universe, which one?"
    ],
    "outdoors": [
        "Best sunrise or sunset spot you know?",
        "What's on your outdoor adventure bucket list?",
        "Mountains, beach, or forest - if you had to pick one forever?"
    ],
    "gaming": [
        "Game that you could always go back to no matter how old it gets?",
        "Most hours you've sunk into a single game?",
        "If you could live in any game world, which one?"
    ],
    "art": [
        "Last piece of art (any kind) that made you feel something?",
        "If you could own any artwork, what would it be?",
        "Do you prefer creating or experiencing art?"
    ],
    "default": [
        "What's something you're weirdly passionate about that surprises people?",
        "Best decision you made this year so far?",
        "If you could have dinner with anyone, living or dead, who would it be?"
    ]
}


ICEBREAKER_DIFFICULTY = {
    "easy": "light, fun, quick to answer",
    "medium": "thought-provoking but not too deep",
    "deep": "meaningful, reveals values and personality"
}
