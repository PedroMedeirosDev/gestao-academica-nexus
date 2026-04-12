import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Monta a UI do Swagger no mesmo prefixo HTTP da API.
 * (`setup('swagger')` sozinho cai em `/swagger`, fora do `setGlobalPrefix`.)
 */
export function setupSwagger(
  app: INestApplication,
  globalPrefix: string,
): void {
  const config = new DocumentBuilder()
    .setTitle('Nexus API')
    .setDescription(
      'Gestão acadêmica — contratos e erros: `docs/specs/platform/api.spec.md`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Cole o token retornado por `POST /auth/login`',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = `${globalPrefix.replace(/\/$/, '')}/swagger`;
  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: 'Nexus API — Swagger',
  });
}
