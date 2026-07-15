import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = new URL(process.env.DATABASE_URL || 'mysql://root:2006@localhost:3306/mymoneydb');

    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', process.env.CONNECTION_LIMIT || '30');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', process.env.POOL_TIMEOUT || '10');
    }

    super({
      datasources: { db: { url: url.toString() } },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
