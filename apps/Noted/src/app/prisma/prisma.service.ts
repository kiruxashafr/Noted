import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  constructor(configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.get<string>("DATABASE_URL"),
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error("Failed to connect to the database", error.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
