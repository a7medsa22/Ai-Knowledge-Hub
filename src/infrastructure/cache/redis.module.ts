import { Global, Module } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant';
import { createClient } from "redis";
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async ()=>{
        const client = createClient({
            url:process.env.REDIS_URL || 'redis://localhost:6379',
        });
        client.on('error', (err) => console.error('Redis Client Error', err));

        await client.connect();

        return client;


      } ,
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
