import { execSync } from 'child_process';

export default async () => {
  console.log('\n🛑 Tearing down global integration test setup...');
  try {
    // Stop docker test containers and remove volumes to clean up space
    console.log('🐳 Stopping test containers and removing volumes...');
    execSync('docker compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
    console.log('✅ Global test teardown finished successfully.\n');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
  }
};
