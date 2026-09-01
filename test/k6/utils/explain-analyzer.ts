// test/k6/utils/explain-analyzer.ts
import { PrismaClient } from '@prisma/client';

export interface ExplainPlanResult {
  queryName: string;
  executionTimeMs: number;
  planningTimeMs: number;
  scanType: string;
  sharedHitBlocks: number;
  sharedReadBlocks: number;
  rawPlanText: string;
}

export async function runQueryExplainPlan(
  prisma: PrismaClient,
  queryName: string,
  rawSql: string,
): Promise<ExplainPlanResult> {
  const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${rawSql}`;
  const rawResult: any = await prisma.$queryRawUnsafe(explainSql);

  const planObj = rawResult[0]['QUERY PLAN'][0];
  const rootNode = planObj['Plan'];

  const executionTimeMs = planObj['Execution Time'] || 0;
  const planningTimeMs = planObj['Planning Time'] || 0;
  const sharedHitBlocks = rootNode['Shared Hit Blocks'] || 0;
  const sharedReadBlocks = rootNode['Shared Read Blocks'] || 0;
  const scanType = rootNode['Node Type'] || 'Unknown';

  const planTextSql = `EXPLAIN (ANALYZE, BUFFERS) ${rawSql}`;
  const textResult: any = await prisma.$queryRawUnsafe(planTextSql);
  const rawPlanText = textResult.map((r: any) => r['QUERY PLAN']).join('\n');

  return {
    queryName,
    executionTimeMs,
    planningTimeMs,
    scanType,
    sharedHitBlocks,
    sharedReadBlocks,
    rawPlanText,
  };
}

export async function runAllBaselineQueryPlans(prisma: PrismaClient): Promise<ExplainPlanResult[]> {
  console.log('🔍 Running EXPLAIN (ANALYZE, BUFFERS) query plan audit...');

  const sampleVector = '[' + new Array(1536).fill(0.01).join(',') + ']';

  const vectorQuery = `
    SELECT e.id, e."docId", e.content, 1 - (e.vector <=> '${sampleVector}'::vector) as similarity
    FROM "embeddings" e JOIN "docs" d ON e."docId" = d.id
    WHERE 1 - (e.vector <=> '${sampleVector}'::vector) > 0.5
    ORDER BY similarity DESC LIMIT 5
  `;

  const docsJoinQuery = `
    SELECT d.id, d.title, d.content, d."authorId", u.email, u.name, COUNT(n.id) as note_count
    FROM "docs" d
    JOIN "users" u ON d."authorId" = u.id
    LEFT JOIN "notes" n ON d.id = n."docId"
    WHERE d."isPublic" = true
    GROUP BY d.id, u.id
    ORDER BY d."updatedAt" DESC LIMIT 10
  `;

  const results: ExplainPlanResult[] = [];

  try {
    const vectorResult = await runQueryExplainPlan(prisma, 'pgvector Similarity Search', vectorQuery);
    results.push(vectorResult);

    const docsResult = await runQueryExplainPlan(prisma, 'Public Docs List & Join', docsJoinQuery);
    results.push(docsResult);
  } catch (error) {
    console.error('⚠️ Query EXPLAIN execution error:', error.message);
  }

  return results;
}
