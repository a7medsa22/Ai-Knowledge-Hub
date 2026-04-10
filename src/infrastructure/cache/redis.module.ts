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
      useFactory: async (config:ConfigService) => {
        const client = createClient({
          socket:{
            host: config.get<string>('REDIS_HOST'),
            port: config.get<number>('REDIS_PORT'),
          },
          password: config.get<string>('REDIS_PASSWORD')
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
