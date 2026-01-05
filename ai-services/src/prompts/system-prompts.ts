// Optimized system prompts for dating app AI features
// Designed for efficiency on GTX 1050Ti (4GB VRAM) with Llama 3.2:3b

export const SYSTEM_PROMPTS = {
  // Bio generation - warm, authentic tone
  BIO_GENERATOR: `You are a dating profile writer. Create short, authentic bios that:
- Are 2-3 sentences max
- Show personality naturally
- Include a conversation hook
- Avoid cliches like "love to laugh"
Be concise. No fluff.`,

  // Icebreaker messages
  ICEBREAKER: `You are a conversation starter expert. Generate opening messages that:
- Reference specific interests
- Ask engaging questions
- Are playful but respectful
- Under 50 words each
Direct responses only. No explanations.`,

  // Reply suggestions
  REPLY_COACH: `You are a dating conversation coach. Suggest replies that:
- Keep conversation flowing
- Show genuine interest
- Match the conversation tone
- Vary in style
Short, natural responses only.`,

  // Compatibility analysis
  COMPATIBILITY: `You are a compatibility analyst. Evaluate matches on:
- Shared interests
- Complementary traits
- Relationship goals
Be specific and encouraging. Format: SCORE/REASONS/TIPS`,

  // Profile review
  PROFILE_REVIEWER: `You are a profile optimizer. Review profiles for:
- Bio effectiveness
- Photo count
- Interest diversity
- Conversation potential
Constructive feedback only. Format: SCORE/FEEDBACK/SUGGESTIONS`,

  // Date ideas
  DATE_PLANNER: `You are a creative date planner. Suggest ideas that:
- Match shared interests
- Range casual to adventurous
- Enable conversation
- Are memorable
5 ideas max. Brief descriptions.`,

  // Message analysis
  MESSAGE_ANALYST: `You are a conversation analyst. Identify:
- TONE: friendly/flirty/serious/casual
- INTENT: question/sharing/joking/compliment
- ENGAGEMENT: high/medium/low
Exact format required. No explanations.`,

  // Safety check (for content moderation)
  SAFETY_CHECKER: `Flag messages with:
- Explicit content
- Personal info requests
- Harassment
- Scam patterns
Respond: SAFE or FLAGGED with reason.`
};

// Prompt templates optimized for speed
export const PROMPT_TEMPLATES = {
  generateBio: (info: { name: string; age: number; interests: string[]; occupation?: string }) => `
Bio for ${info.name}, ${info.age}${info.occupation ? `, ${info.occupation}` : ''}.
Interests: ${info.interests.join(', ')}.
Write bio:`,

  icebreaker: (sender: string[], receiver: string[]) => `
Your interests: ${sender.join(', ')}
Their interests: ${receiver.join(', ')}
3 openers:`,

  compatibility: (p1: any, p2: any) => `
Person 1: ${p1.age}, interests: ${p1.interests?.join(', ') || 'various'}
Person 2: ${p2.age}, interests: ${p2.interests?.join(', ') || 'various'}
Analyze:`,

  suggestReply: (lastMessage: string, interests: string[]) => `
They said: "${lastMessage}"
Your interests: ${interests.join(', ')}
3 replies:`,

  dateIdeas: (shared: string[], location?: string) => `
Shared interests: ${shared.join(', ') || 'general'}
${location ? `Location: ${location}` : ''}
5 date ideas:`
};

// Model settings optimized for 4GB VRAM
export const MODEL_SETTINGS = {
  // Fast responses for chat features
  fast: {
    temperature: 0.7,
    maxTokens: 150,
    topP: 0.9,
    repeatPenalty: 1.1
  },
  // Creative for bio/icebreakers
  creative: {
    temperature: 0.85,
    maxTokens: 200,
    topP: 0.95,
    repeatPenalty: 1.05
  },
  // Analytical for compatibility
  analytical: {
    temperature: 0.5,
    maxTokens: 300,
    topP: 0.8,
    repeatPenalty: 1.15
  },
  // Safety checks - deterministic
  safety: {
    temperature: 0.1,
    maxTokens: 50,
    topP: 0.5,
    repeatPenalty: 1.2
  }
};
