import { Router, Request, Response } from 'express';
import { OllamaService } from '../services/ollama';

export const chatRouter = Router();

// Generate icebreakers
chatRouter.post('/icebreakers', async (req: Request, res: Response) => {
  try {
    const { senderProfile, receiverProfile } = req.body;

    if (!senderProfile || !receiverProfile) {
      return res.status(400).json({
        error: 'Both sender and receiver profiles are required'
      });
    }

    const icebreakers = await OllamaService.generateIcebreaker(
      senderProfile,
      receiverProfile
    );

    res.json({ icebreakers });
  } catch (error) {
    console.error('Icebreaker error:', error);
    res.status(500).json({ error: 'Failed to generate icebreakers' });
  }
});

// Suggest reply
chatRouter.post('/suggest-reply', async (req: Request, res: Response) => {
  try {
    const { conversationHistory, userProfile } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({
        error: 'Conversation history array is required'
      });
    }

    if (conversationHistory.length === 0) {
      return res.status(400).json({
        error: 'Conversation history cannot be empty'
      });
    }

    const suggestions = await OllamaService.suggestReply(
      conversationHistory,
      userProfile || { name: 'User', interests: [] }
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Reply suggestion error:', error);
    res.status(500).json({ error: 'Failed to suggest replies' });
  }
});

// Get conversation tips
chatRouter.post('/tips', async (req: Request, res: Response) => {
  try {
    const { conversationHistory, matchProfile } = req.body;

    const historyText = conversationHistory
      ?.slice(-5)
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n') || 'New conversation';

    const prompt = `Analyze this dating app conversation and give tips:

${matchProfile ? `Match interests: ${matchProfile.interests?.join(', ') || 'Unknown'}` : ''}

Recent messages:
${historyText}

Provide 3 tips to improve the conversation:`;

    const response = await OllamaService.generate({
      prompt,
      system: 'You are a dating coach. Give brief, actionable conversation tips.',
      temperature: 0.7,
      maxTokens: 300
    });

    const tips = response
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3);

    res.json({ tips });
  } catch (error) {
    console.error('Tips error:', error);
    res.status(500).json({ error: 'Failed to generate tips' });
  }
});

// Detect conversation tone/intent
chatRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `Analyze this dating app message:
"${message}"

Respond in this exact format:
TONE: [friendly/flirty/serious/casual/interested/disinterested]
INTENT: [asking question/sharing info/joking/complimenting/suggesting meetup/small talk]
ENGAGEMENT: [high/medium/low]
RESPONSE_PRIORITY: [high/medium/low]`;

    const response = await OllamaService.generate({
      prompt,
      system: 'You are a conversation analyst. Be concise and accurate.',
      temperature: 0.3,
      maxTokens: 100
    });

    // Parse response
    const toneMatch = response.match(/TONE:\s*(\w+)/i);
    const intentMatch = response.match(/INTENT:\s*(.+?)(?:\n|$)/i);
    const engagementMatch = response.match(/ENGAGEMENT:\s*(\w+)/i);
    const priorityMatch = response.match(/RESPONSE_PRIORITY:\s*(\w+)/i);

    res.json({
      tone: toneMatch?.[1]?.toLowerCase() || 'neutral',
      intent: intentMatch?.[1]?.trim() || 'unknown',
      engagement: engagementMatch?.[1]?.toLowerCase() || 'medium',
      responsePriority: priorityMatch?.[1]?.toLowerCase() || 'medium'
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
});
