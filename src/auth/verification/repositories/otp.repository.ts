import { RedisService } from "src/infrastructure/cache/redis.service";

export class OtpRepository {
    constructor(private readonly redis: RedisService) { }

    async getAttempts(email: string) {
        const attempts = await this.redis.get(`attempts:${email}`);
        return attempts ? parseInt(attempts) : 0;
    }

    async incrementAttempts(email: string) {
    await this.redis.incr(`attempts:${email}`);
    await this.redis.expire(`attempts:${email}`, 3600); 
  }

  async clearAttempts(email: string) {
    await this.redis.del(`attempts:${email}`);
  }
}