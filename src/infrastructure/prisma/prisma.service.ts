import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';
import { parseMysqlUrl } from './parse-mysql-url.util.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('database.url');
    const adapter = new PrismaMariaDb(parseMysqlUrl(connectionString));

    super({
      adapter,
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
