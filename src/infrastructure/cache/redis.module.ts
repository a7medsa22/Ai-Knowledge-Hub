import { Global, Inject, Module } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant';
import { createClient } from 'redis';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const redisPassword = config.get<string>('REDIS_PASSWORD');
        const client = redisUrl
          ? createClient({ url: redisUrl })
          : createClient({
              socket: {
                host: config.get<string>('REDIS_HOST', 'localhost'),
                port: config.get<number>('REDIS_PORT', 6379),
              },
              ...(redisPassword ? { password: redisPassword } : {}),
            });
        client.on('error', (err) => console.error('Redis Client Error', err));

        await client.connect();

        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
  
})
export class RedisModule {}
