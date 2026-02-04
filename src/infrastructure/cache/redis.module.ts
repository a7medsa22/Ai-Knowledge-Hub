import { Global, Module } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant';
import { createClient } from 'redis';
import { RedisService } from './redis.service';
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const client = createClient({
          socket: {
            host: process.env.REDIS_HOST || 'redis',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
        });
        client.on('error', (err) => console.error('Redis Client Error', err));

        await client.connect();

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
