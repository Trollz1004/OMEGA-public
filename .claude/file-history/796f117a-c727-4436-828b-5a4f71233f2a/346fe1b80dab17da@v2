import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';

import { ollamaRouter } from './routes/ollama';
import { profileRouter } from './routes/profile';
import { chatRouter } from './routes/chat';
import { matchingRouter } from './routes/matching';
import { OllamaService } from './services/ollama';

config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  const ollamaStatus = await OllamaService.checkHealth();
  res.json({
    status: 'healthy',
    service: 'dating-platform-ai',
    version: '1.0.0',
    ollama: ollamaStatus,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/ollama', ollamaRouter);
app.use('/api/profile', profileRouter);
app.use('/api/chat', chatRouter);
app.use('/api/matching', matchingRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Services running on port ${PORT}`);
  console.log(`Ollama endpoint: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
  console.log(`Model: ${process.env.OLLAMA_MODEL || 'llama3.2:3b'}`);
});
