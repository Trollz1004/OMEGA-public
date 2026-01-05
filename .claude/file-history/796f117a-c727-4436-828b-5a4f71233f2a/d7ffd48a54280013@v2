import { Router, Request, Response } from 'express';
import { OllamaService } from '../services/ollama';

export const matchingRouter = Router();

// Analyze compatibility
matchingRouter.post('/compatibility', async (req: Request, res: Response) => {
  try {
    const { profile1, profile2 } = req.body;

    if (!profile1 || !profile2) {
      return res.status(400).json({
        error: 'Both profiles are required'
      });
    }

    const analysis = await OllamaService.analyzeCompatibility(profile1, profile2);
    res.json(analysis);
  } catch (error) {
    console.error('Compatibility error:', error);
    res.status(500).json({ error: 'Failed to analyze compatibility' });
  }
});

// Get match insights
matchingRouter.post('/insights', async (req: Request, res: Response) => {
  try {
    const { userProfile, matchProfile } = req.body;

    if (!userProfile || !matchProfile) {
      return res.status(400).json({
        error: 'Both user and match profiles are required'
      });
    }

    const prompt = `Generate dating match insights:

Your profile:
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Looking for: ${userProfile.lookingFor || 'Not specified'}

Match profile:
- Name: ${matchProfile.name}
- Interests: ${matchProfile.interests?.join(', ') || 'Not specified'}
- Bio: ${matchProfile.bio || 'Not provided'}

Provide:
1. What you have in common
2. Interesting differences to explore
3. Best date idea for you two
4. Conversation topic to try`;

    const response = await OllamaService.generate({
      prompt,
      system: 'You are a matchmaking advisor. Be insightful and encouraging.',
      temperature: 0.7,
      maxTokens: 400
    });

    res.json({ insights: response });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Suggest date ideas
matchingRouter.post('/date-ideas', async (req: Request, res: Response) => {
  try {
    const { profile1, profile2, location } = req.body;

    const sharedInterests = profile1?.interests?.filter((i: string) =>
      profile2?.interests?.some((p2i: string) =>
        p2i.toLowerCase().includes(i.toLowerCase())
      )
    ) || [];

    const prompt = `Suggest 5 creative date ideas for two people:

Shared interests: ${sharedInterests.join(', ') || 'Getting to know each other'}
Person 1 likes: ${profile1?.interests?.join(', ') || 'Various activities'}
Person 2 likes: ${profile2?.interests?.join(', ') || 'Various activities'}
${location ? `Location: ${location}` : ''}

Generate 5 unique date ideas that:
- Match their shared interests
- Range from casual to adventurous
- Include indoor and outdoor options
- Are conversation-friendly

Format: numbered list with brief description for each.`;

    const response = await OllamaService.generate({
      prompt,
      system: 'You are a creative date planner. Suggest fun, memorable experiences.',
      temperature: 0.85,
      maxTokens: 500
    });

    const ideas = response
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 5);

    res.json({ dateIdeas: ideas });
  } catch (error) {
    console.error('Date ideas error:', error);
    res.status(500).json({ error: 'Failed to generate date ideas' });
  }
});

// Explain why you matched
matchingRouter.post('/why-matched', async (req: Request, res: Response) => {
  try {
    const { profile1, profile2, matchScore } = req.body;

    const prompt = `Explain why these two people matched on a dating app:

Person 1:
- Age: ${profile1?.age || 'Unknown'}
- Interests: ${profile1?.interests?.join(', ') || 'Not specified'}
- Looking for: ${profile1?.lookingFor || 'Connection'}

Person 2:
- Age: ${profile2?.age || 'Unknown'}
- Interests: ${profile2?.interests?.join(', ') || 'Not specified'}
- Looking for: ${profile2?.lookingFor || 'Connection'}

${matchScore ? `Match score: ${matchScore}%` : ''}

Write a friendly, encouraging explanation (2-3 sentences) of why they're a good match:`;

    const response = await OllamaService.generate({
      prompt,
      system: 'You are a friendly matchmaker. Be positive and specific.',
      temperature: 0.7,
      maxTokens: 150
    });

    res.json({ explanation: response.trim() });
  } catch (error) {
    console.error('Match explanation error:', error);
    res.status(500).json({ error: 'Failed to explain match' });
  }
});
