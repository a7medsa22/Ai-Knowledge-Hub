import { Injectable } from '@nestjs/common';
import { REDIS_CACHE_TTL } from 'src/infrastructure/cache/redis.constant';
import { RedisService } from 'src/infrastructure/cache/redis.service';

@Injectable()
export class OtpRepository {
  constructor(private readonly redis: RedisService) {}
  async save(email: string, otp: string) {
    await this.redis.set(`otp:${email}`, otp, REDIS_CACHE_TTL);
  } 
  async getAttempts(email: string) {
    const attempts = await this.redis.get(`attempts:${email}`);
    return attempts ? parseInt(attempts) : 0;
  }

  async incrementAttempts(email: string) {
    await this.redis.incr(`attempts:${email}`);
    await this.redis.expire(`attempts:${email}`, REDIS_CACHE_TTL);
  }

  async clearAttempts(email: string) {
    await this.redis.del(`attempts:${email}`);
  }

  async find(email: string) {
    const otp = await this.redis.get(`otp:${email}`);
    return otp;
  }
  async delete(email: string) {
    await this.redis.del(`otp:${email}`);
  }
}
