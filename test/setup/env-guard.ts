import * as dotenv from 'dotenv';
import * as path from 'path';

export function assertTestEnvironment(): void {
  // Load environment variables from .env.test
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

  const dbUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'test') {
    throw new Error(`🚨 REFUSING TO RUN TESTS: NODE_ENV is '${nodeEnv}', expected 'test'.`);
  }

  if (!dbUrl) {
    throw new Error('🚨 DATABASE_URL is not defined in the environment.');
  }

  // Check for neon or production indicators
  if (dbUrl.includes('neon.tech') || dbUrl.includes('production') || dbUrl.includes('ep-raspy-credit')) {
    throw new Error(
      `🚨 REFUSING TO RUN TESTS: DATABASE_URL points to a production or remote database: ${dbUrl}. ` +
      'Please ensure you are using .env.test with the local test container database.'
    );
  }

  // Ensure it's pointing to the test database container port
  if (!dbUrl.includes('5555') && !dbUrl.includes('ai_knowledge_hub_test')) {
    throw new Error(
      `🚨 REFUSING TO RUN TESTS: DATABASE_URL does not point to the expected test port (5555) or test db name ('ai_knowledge_hub_test'). Current URL: ${dbUrl}`
    );
  }
}
