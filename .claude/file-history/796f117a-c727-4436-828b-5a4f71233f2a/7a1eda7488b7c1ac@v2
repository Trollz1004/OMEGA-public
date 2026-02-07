import axios, { AxiosError } from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface GenerateOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  context?: number[];
}

export class OllamaService {
  static async checkHealth(): Promise<{ available: boolean; model: string; error?: string }> {
    try {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
      const models = response.data.models || [];
      const hasModel = models.some((m: { name: string }) => m.name.includes('llama3'));
      return {
        available: true,
        model: OLLAMA_MODEL,
        error: hasModel ? undefined : 'Llama model not installed. Run: ollama pull llama3.2:3b'
      };
    } catch (error) {
      return {
        available: false,
        model: OLLAMA_MODEL,
        error: 'Ollama service not available'
      };
    }
  }

  static async generate(options: GenerateOptions): Promise<string> {
    const { prompt, system, temperature = 0.7, maxTokens = 500 } = options;

    try {
      const response = await axios.post<OllamaResponse>(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt,
          system,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
            top_p: 0.9,
            repeat_penalty: 1.1
          }
        },
        { timeout: 60000 }
      );

      return response.data.response;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Ollama generate error:', axiosError.message);
      throw new Error(`AI generation failed: ${axiosError.message}`);
    }
  }

  static async generateBio(userInfo: {
    name: string;
    age: number;
    interests: string[];
    occupation?: string;
    lookingFor?: string;
  }): Promise<string> {
    const prompt = `Generate a charming, authentic dating profile bio for:
Name: ${userInfo.name}
Age: ${userInfo.age}
Interests: ${userInfo.interests.join(', ')}
${userInfo.occupation ? `Occupation: ${userInfo.occupation}` : ''}
${userInfo.lookingFor ? `Looking for: ${userInfo.lookingFor}` : ''}

Create a bio that is:
- 2-3 sentences maximum
- Warm and approachable
- Shows personality without being cheesy
- Includes a subtle conversation starter

Bio:`;

    const system = `You are an expert dating profile writer. Create authentic, engaging bios that help people connect. Be concise and avoid cliches.`;

    return this.generate({ prompt, system, temperature: 0.8 });
  }

  static async generateIcebreaker(profile1: { name: string; interests: string[] }, profile2: { name: string; interests: string[] }): Promise<string[]> {
    const commonInterests = profile1.interests.filter(i =>
      profile2.interests.some(p2i => p2i.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(p2i.toLowerCase()))
    );

    const prompt = `Generate 3 creative, personalized icebreaker messages.

Person sending: ${profile1.name} (interests: ${profile1.interests.join(', ')})
Person receiving: ${profile2.name} (interests: ${profile2.interests.join(', ')})
${commonInterests.length > 0 ? `Common interests: ${commonInterests.join(', ')}` : ''}

Create icebreakers that are:
- Playful and engaging
- Reference shared interests when possible
- Ask a question to encourage response
- NOT generic pickup lines

Return exactly 3 icebreakers, one per line:`;

    const system = `You are a dating coach helping people start conversations. Be creative, friendly, and authentic.`;

    const response = await this.generate({ prompt, system, temperature: 0.9 });
    return response.split('\n').filter(line => line.trim()).slice(0, 3);
  }

  static async analyzeCompatibility(profile1: any, profile2: any): Promise<{
    score: number;
    reasons: string[];
    tips: string[];
  }> {
    const prompt = `Analyze dating compatibility between two profiles:

Profile 1:
- Age: ${profile1.age}
- Interests: ${profile1.interests?.join(', ') || 'Not specified'}
- Looking for: ${profile1.lookingFor || 'Not specified'}
- Location: ${profile1.location || 'Not specified'}

Profile 2:
- Age: ${profile2.age}
- Interests: ${profile2.interests?.join(', ') || 'Not specified'}
- Looking for: ${profile2.lookingFor || 'Not specified'}
- Location: ${profile2.location || 'Not specified'}

Provide analysis in this exact format:
SCORE: [0-100]
REASONS:
- [reason 1]
- [reason 2]
- [reason 3]
TIPS:
- [conversation tip 1]
- [conversation tip 2]`;

    const system = `You are a relationship compatibility analyst. Be insightful but optimistic.`;

    const response = await this.generate({ prompt, system, temperature: 0.6 });

    // Parse response
    const scoreMatch = response.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    const reasonsMatch = response.match(/REASONS:([\s\S]*?)(?=TIPS:|$)/);
    const reasons = reasonsMatch
      ? reasonsMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : ['Compatible interests detected'];

    const tipsMatch = response.match(/TIPS:([\s\S]*?)$/);
    const tips = tipsMatch
      ? tipsMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : ['Start with your shared interests'];

    return { score: Math.min(100, Math.max(0, score)), reasons, tips };
  }

  static async suggestReply(
    conversationHistory: { role: 'user' | 'match'; content: string }[],
    userProfile: { name: string; interests: string[] }
  ): Promise<string[]> {
    const historyText = conversationHistory
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'You' : 'Match'}: ${m.content}`)
      .join('\n');

    const prompt = `Suggest 3 reply options for this dating app conversation:

Your interests: ${userProfile.interests.join(', ')}

Conversation:
${historyText}

Generate 3 different reply options that are:
- Natural and conversational
- Show genuine interest
- Move the conversation forward
- Vary in length (short, medium, longer)

Replies (one per line):`;

    const system = `You are a dating conversation coach. Help craft authentic, engaging replies.`;

    const response = await this.generate({ prompt, system, temperature: 0.85 });
    return response.split('\n').filter(line => line.trim() && !line.startsWith('-')).slice(0, 3);
  }

  static async reviewProfile(profile: {
    bio?: string;
    photos?: number;
    interests?: string[];
    prompts?: { question: string; answer: string }[];
  }): Promise<{
    score: number;
    feedback: string[];
    suggestions: string[];
  }> {
    const prompt = `Review this dating profile and provide feedback:

Bio: ${profile.bio || 'No bio set'}
Number of photos: ${profile.photos || 0}
Interests: ${profile.interests?.join(', ') || 'None listed'}
Prompts answered: ${profile.prompts?.length || 0}

Rate the profile and provide:
SCORE: [0-100]
FEEDBACK:
- [what's working]
- [what could improve]
SUGGESTIONS:
- [specific suggestion 1]
- [specific suggestion 2]
- [specific suggestion 3]`;

    const system = `You are a dating profile optimization expert. Be constructive and encouraging.`;

    const response = await this.generate({ prompt, system, temperature: 0.6 });

    const scoreMatch = response.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    const feedbackMatch = response.match(/FEEDBACK:([\s\S]*?)(?=SUGGESTIONS:|$)/);
    const feedback = feedbackMatch
      ? feedbackMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : [];

    const suggestionsMatch = response.match(/SUGGESTIONS:([\s\S]*?)$/);
    const suggestions = suggestionsMatch
      ? suggestionsMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : [];

    return { score: Math.min(100, Math.max(0, score)), feedback, suggestions };
  }
}
