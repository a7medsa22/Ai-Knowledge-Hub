import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as path from 'path';

export default async () => {
  console.log('\n🚀 Starting global integration test setup...');

  // Load environment variables from .env.test
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

  try {
    // 1. Start docker test containers and wait until they are healthy
    console.log('🐳 Starting test containers (PostgreSQL & Redis)...');
    execSync('docker compose -f docker-compose.test.yml up -d --wait', { stdio: 'inherit' });

    // 2. Run migrations on the test database
    console.log('🔄 Running database migrations on test container...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });

    console.log('✅ Global test setup finished successfully.\n');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
};
