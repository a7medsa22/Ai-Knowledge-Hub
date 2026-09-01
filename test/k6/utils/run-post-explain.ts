import { PrismaClient } from '@prisma/client';
import { runAllBaselineQueryPlans } from './explain-analyzer';

async function main() {
  const prisma = new PrismaClient();
  const results = await runAllBaselineQueryPlans(prisma);
  console.log('=== POST-BENCHMARK EXPLAIN ANALYZE AUDIT RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
