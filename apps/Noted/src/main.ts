import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app/app.module";
import { ApiExceptionFilter } from "@noted/common/errors/api-exception.filter";
const cookieParser = require("cookie-parser");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = "api";
  
  // Устанавливаем глобальный префикс ПЕРЕД настройкой Swagger
  app.setGlobalPrefix(globalPrefix);

  // Swagger настройка
  const config = new DocumentBuilder()
    .setTitle('Noted API')
    .setDescription('API для системы заметок Noted')
    .setVersion('1.0')
    .addTag('Authentication')
    .addCookieAuth('refreshToken', {
      type: 'http',
      in: 'Cookie',
      name: 'refreshToken',
      description: 'Refresh Token для аутентификации'
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Настраиваем Swagger UI с правильным префиксом
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      defaultModelsExpandDepth: -1,
      tryItOutEnabled: true,
    },
  });

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
  
  // Включим CORS для Swagger UI и фронтенда
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger documentation available at: http://localhost:${port}/docs`);
}

bootstrap();