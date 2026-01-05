import { Router, Request, Response } from 'express';
import { OllamaService } from '../services/ollama';

export const ollamaRouter = Router();

// Check Ollama status
ollamaRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await OllamaService.checkHealth();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check Ollama status' });
  }
});

// Raw generate endpoint
ollamaRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, system, temperature, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await OllamaService.generate({
      prompt,
      system,
      temperature,
      maxTokens
    });

    res.json({ response });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});
