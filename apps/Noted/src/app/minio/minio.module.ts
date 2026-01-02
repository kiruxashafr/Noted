// src/files/minio/minio.module.ts
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";
import { MINIO_TOKEN } from "./minio.decorator";

@Global()
@Module({
  exports: [MINIO_TOKEN],
  providers: [
    {
      inject: [ConfigService],
      provide: MINIO_TOKEN,
      useFactory: async (configService: ConfigService): Promise<Minio.Client> => {
        const client = new Minio.Client({
          endPoint: configService.getOrThrow("MINIO_ENDPOINT"),
          port: +configService.getOrThrow("MINIO_PORT"),
          accessKey: configService.getOrThrow("MINIO_ACCESSKEY"),
          secretKey: configService.getOrThrow("MINIO_SECRETKEY"),
          useSSL: false,
        });
        return client;
      },
    },
  ],
})
export class MinioModule {}
