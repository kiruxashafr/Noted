/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { ApiExceptionFilter } from "@noted/common/errors/api-exception.filter";
const cookieParser = require("cookie-parser");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = "api";
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.use(cookieParser());
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
