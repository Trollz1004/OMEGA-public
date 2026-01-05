"""
Prompts for compatibility analysis between users.
Provides insights on potential match quality.
"""

# System prompt for compatibility analysis
COMPATIBILITY_SYSTEM_PROMPT = """You are a relationship compatibility analyst. You evaluate:
- Shared interests and values alignment
- Communication style compatibility
- Lifestyle compatibility
- Potential conversation topics
- Areas of complementary differences

Be balanced and constructive. Highlight positives while noting areas for exploration.
Respond in a structured, concise format."""


COMPATIBILITY_ANALYSIS_TEMPLATE = """Analyze compatibility between these two profiles:

PERSON A:
Name: {user_a_name}
Age: {user_a_age}
Bio: {user_a_bio}
Interests: {user_a_interests}
Looking for: {user_a_looking_for}
Values: {user_a_values}

PERSON B:
Name: {user_b_name}
Age: {user_b_age}
Bio: {user_b_bio}
Interests: {user_b_interests}
Looking for: {user_b_looking_for}
Values: {user_b_values}

Provide:
1. Overall compatibility score (1-100)
2. Top 3 connection points
3. Potential conversation topics (3-5)
4. Areas to explore together
5. One thing to be mindful of

Keep analysis concise and actionable."""


QUICK_COMPATIBILITY_TEMPLATE = """Quick compatibility check:

Person A interests: {user_a_interests}
Person A looking for: {user_a_looking_for}

Person B interests: {user_b_interests}
Person B looking for: {user_b_looking_for}

Rate compatibility 1-10 and give ONE reason why they could connect. Be brief."""


COMPATIBILITY_INSIGHTS_TEMPLATE = """Based on this compatibility analysis, suggest:

Compatibility score: {score}
Shared interests: {shared_interests}
Different interests: {different_interests}

1. Best first date idea that combines interests
2. One question A should ask B
3. One question B should ask A
4. A shared activity to try

Keep suggestions specific and actionable."""
