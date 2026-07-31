import { logger } from './lib/observability/logger';

export async function register() {
  // Initialization logic for server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('Next.js Node.js runtime initialized');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    logger.info('Next.js Edge runtime initialized');
  }
}
