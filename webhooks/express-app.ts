/**
 * Express Application with Webhook Support
 * FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE
 *
 * This Express app is configured with proper middleware for webhook handling:
 * - Raw body parsing for webhook routes (required for signature verification)
 * - JSON parsing for other routes
 * - Error handling middleware
 * - Health check endpoint
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import { handleStripeWebhook } from './stripe-webhook';
import { handleSquareWebhook } from './square-webhook';

/**
 * Custom error type for webhook errors
 */
interface WebhookError extends Error {
  statusCode?: number;
  provider?: string;
}

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // =========================================================================
  // WEBHOOK ROUTES (Must be defined BEFORE json middleware)
  // These routes need raw body for signature verification
  // =========================================================================

  // Stripe webhook - requires raw body
  app.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );

  // Square webhook - requires raw body
  app.post(
    '/webhooks/square',
    express.raw({ type: 'application/json' }),
    handleSquareWebhook
  );

  // =========================================================================
  // STANDARD MIDDLEWARE (After webhook routes)
  // =========================================================================

  // Parse JSON bodies for all other routes
  app.use(express.json({ limit: '10mb' }));

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // =========================================================================
  // HEALTH CHECK & STATUS ROUTES
  // =========================================================================

  /**
   * Health check endpoint
   * Returns 200 if the server is running
   */
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  /**
   * Webhook status endpoint
   * Returns configuration status for debugging (non-sensitive)
   */
  app.get('/webhooks/status', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'active',
      providers: {
        stripe: {
          configured: !!process.env.STRIPE_WEBHOOK_SECRET,
          endpoint: '/webhooks/stripe',
        },
        square: {
          configured: !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY && !!process.env.SQUARE_WEBHOOK_URL,
          endpoint: '/webhooks/square',
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Root endpoint
   */
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'FOR THE KIDS Platform - Webhook Service',
      version: 'Gospel V1.4.1 SURVIVAL MODE',
      endpoints: {
        health: '/health',
        webhookStatus: '/webhooks/status',
        stripeWebhook: '/webhooks/stripe',
        squareWebhook: '/webhooks/square',
      },
    });
  });

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  /**
   * 404 handler for unknown routes
   */
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Global error handler
   */
  app.use((err: WebhookError, req: Request, res: Response, next: NextFunction) => {
    console.error('[Server] Error:', err.message);
    console.error('[Server] Stack:', err.stack);

    const statusCode = err.statusCode || 500;
    const response: Record<string, unknown> = {
      error: err.name || 'Internal Server Error',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      timestamp: new Date().toISOString(),
    };

    if (err.provider) {
      response.provider = err.provider;
    }

    if (process.env.NODE_ENV !== 'production' && err.stack) {
      response.stack = err.stack;
    }

    res.status(statusCode).json(response);
  });

  return app;
}

/**
 * Start the Express server
 */
export function startServer(port?: number): void {
  const app = createApp();
  const serverPort = port || parseInt(process.env.PORT || '3000', 10);

  app.listen(serverPort, () => {
    console.log('========================================');
    console.log('FOR THE KIDS Platform - Webhook Service');
    console.log('Gospel V1.4.1 SURVIVAL MODE');
    console.log('========================================');
    console.log(`Server running on port ${serverPort}`);
    console.log('');
    console.log('Webhook Endpoints:');
    console.log(`  - Stripe:  http://localhost:${serverPort}/webhooks/stripe`);
    console.log(`  - Square:  http://localhost:${serverPort}/webhooks/square`);
    console.log('');
    console.log('Configuration Status:');
    console.log(`  - STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not Set'}`);
    console.log(`  - SQUARE_WEBHOOK_SIGNATURE_KEY: ${process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? 'Set' : 'Not Set'}`);
    console.log(`  - SQUARE_WEBHOOK_URL: ${process.env.SQUARE_WEBHOOK_URL ? 'Set' : 'Not Set'}`);
    console.log('========================================');
  });
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: ReturnType<typeof startServer>): void {
  const shutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default createApp;
