import { Router, Request, Response } from 'express';
import { OllamaService } from '../services/ollama';

export const profileRouter = Router();

// Generate bio
profileRouter.post('/generate-bio', async (req: Request, res: Response) => {
  try {
    const { name, age, interests, occupation, lookingFor } = req.body;

    if (!name || !age || !interests) {
      return res.status(400).json({
        error: 'Name, age, and interests are required'
      });
    }

    const bio = await OllamaService.generateBio({
      name,
      age,
      interests,
      occupation,
      lookingFor
    });

    res.json({ bio: bio.trim() });
  } catch (error) {
    console.error('Bio generation error:', error);
    res.status(500).json({ error: 'Failed to generate bio' });
  }
});

// Review profile
profileRouter.post('/review', async (req: Request, res: Response) => {
  try {
    const { bio, photos, interests, prompts } = req.body;

    const review = await OllamaService.reviewProfile({
      bio,
      photos,
      interests,
      prompts
    });

    res.json(review);
  } catch (error) {
    console.error('Profile review error:', error);
    res.status(500).json({ error: 'Failed to review profile' });
  }
});

// Improve bio
profileRouter.post('/improve-bio', async (req: Request, res: Response) => {
  try {
    const { currentBio, name, interests } = req.body;

    if (!currentBio) {
      return res.status(400).json({ error: 'Current bio is required' });
    }

    const prompt = `Improve this dating profile bio while keeping the same voice and personality:

Current bio: "${currentBio}"
${name ? `Name: ${name}` : ''}
${interests ? `Interests: ${interests.join(', ')}` : ''}

Create an improved version that is:
- More engaging and memorable
- Better at sparking conversation
- Still authentic to the original voice
- 2-3 sentences maximum

Improved bio:`;

    const improved = await OllamaService.generate({
      prompt,
      system: 'You are a dating profile optimization expert. Improve bios while keeping authenticity.',
      temperature: 0.7
    });

    res.json({ improvedBio: improved.trim() });
  } catch (error) {
    console.error('Bio improvement error:', error);
    res.status(500).json({ error: 'Failed to improve bio' });
  }
});

// Generate prompt answers
profileRouter.post('/generate-prompt-answer', async (req: Request, res: Response) => {
  try {
    const { promptQuestion, personality, interests } = req.body;

    if (!promptQuestion) {
      return res.status(400).json({ error: 'Prompt question is required' });
    }

    const prompt = `Answer this dating app prompt in a way that's authentic and conversation-starting:

Prompt: "${promptQuestion}"
${personality ? `Personality traits: ${personality}` : ''}
${interests ? `Interests: ${interests.join(', ')}` : ''}

Write a witty, genuine answer (2-3 sentences max):`;

    const answer = await OllamaService.generate({
      prompt,
      system: 'You are helping someone write authentic dating profile answers. Be creative but genuine.',
      temperature: 0.85
    });

    res.json({ answer: answer.trim() });
  } catch (error) {
    console.error('Prompt answer error:', error);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});
