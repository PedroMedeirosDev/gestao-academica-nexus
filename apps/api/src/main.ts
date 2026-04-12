import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { validationExceptionFactory } from './common/pipes/validation-exception.factory';
import { setupSwagger } from './swagger';

const API_GLOBAL_PREFIX = 'api/v1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  setupSwagger(app, API_GLOBAL_PREFIX);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.enableCors({ origin: true });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
