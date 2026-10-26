import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module.js';
import { DataEnvelopeInterceptor } from './common/interceptors/data-envelope.interceptor.js';
import { AppZodValidationPipe } from './pipes/zod-validation.pipe.js';

async function bootstrap() {
  // Initialiser le contexte transactionnel AVANT de créer l'application.
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Toute l'API vit sous /api, comme l'API Adonis qu'elle remplace.
  app.setGlobalPrefix('api');

  // En développement toutes les origines passent ; en production, seules celles de CORS_ORIGINS.
  const corsOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin:
      configService.get<string>('NODE_ENV') === 'production'
        ? corsOrigins
        : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // helmet pose les en-têtes de sécurité HTTP standards.
  app.use(helmet());

  // Validation Zod des DTO et enveloppe { data } : le contrat attendu par la SPA.
  app.useGlobalPipes(new AppZodValidationPipe());
  app.useGlobalInterceptors(new DataEnvelopeInterceptor());

  const port = configService.get<number>('PORT') ?? 3340;
  await app.listen(port);
  console.log(`API Elco Sage démarrée sur http://localhost:${port}/api`);
}
await bootstrap();
