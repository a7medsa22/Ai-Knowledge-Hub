import { Inject, Injectable } from "@nestjs/common";
import type { RedisClientType } from "redis";
import { REDIS_CLIENT } from "./redis.constant";

@Injectable()
export class RedisService {
  constructor(
   @Inject(REDIS_CLIENT)
 private readonly client : RedisClientType,
){}

  async get(key:string): Promise<string | null> {
    return this.client.get(key);
  }
  async set(key:string,value:string, ttl?:number):Promise<void>{
    if(ttl){
        await this.client.set(key,value,{"EX":ttl})
    }else
    await this.client.set(key,value);
  }

  async del(key:string):Promise<void>{
    await this.client.del(key);
    }

    async incr(key:string):Promise<number>{
        return this.client.incr(key);
    }

    async expire(key:string,ttl:number):Promise<void>{
        await this.client.expire(key,ttl);
    }
    

}