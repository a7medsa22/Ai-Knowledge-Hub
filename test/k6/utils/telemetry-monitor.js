// test/k6/utils/telemetry-monitor.js
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

class TelemetryMonitor {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });
    this.snapshots = [];
    this.intervalTimer = null;
  }

  async captureSnapshot() {
    const mem = process.memoryUsage();
    const nodeRssMemoryMb = Math.round(mem.rss / 1024 / 1024);
    const nodeHeapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);

    let postgresActiveConnections = 0;
    let postgresIdleConnections = 0;

    try {
      const connResult = await this.prisma.$queryRaw`
        SELECT state, count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state;
      `;
      for (const row of connResult) {
        if (row.state === 'active') postgresActiveConnections = Number(row.count);
        if (row.state === 'idle') postgresIdleConnections = Number(row.count);
      }
    } catch (e) {
      // Ignore query failure
    }

    let redisMemoryUsedMb = 0;
    let bullMqQueueWaitingJobs = 0;

    try {
      const redisInfo = await this.redis.info('memory');
      const match = redisInfo.match(/used_memory:(\d+)/);
      if (match) redisMemoryUsedMb = Math.round(parseInt(match[1], 10) / 1024 / 1024);

      bullMqQueueWaitingJobs = await this.redis.llen('bull:embedding:waiting');
    } catch (e) {
      // Ignore redis info failure
    }

    const snapshot = {
      timestamp: new Date().toISOString(),
      nodeRssMemoryMb,
      nodeHeapUsedMb,
      postgresActiveConnections,
      postgresIdleConnections,
      redisMemoryUsedMb,
      bullMqQueueWaitingJobs,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  start(intervalMs = 5000) {
    this.intervalTimer = setInterval(() => {
      this.captureSnapshot().catch(() => {});
    }, intervalMs);
  }

  async stop() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    await this.prisma.$disconnect();
    await this.redis.quit();
    return this.snapshots;
  }
}

module.exports = { TelemetryMonitor };
