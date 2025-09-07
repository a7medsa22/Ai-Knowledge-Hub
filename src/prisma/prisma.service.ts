// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { hidePasswordMiddleware } from './middleware/hide-password';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    // register middleware as early as possible
    this.$use(hidePasswordMiddleware());
    console.log('[PrismaService] middleware registered');
  }

  async onModuleInit() {
    await this.$connect();
    console.log('[PrismaService] connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
