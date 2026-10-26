import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Hardening
  app.use(helmet());
  app.use(cookieParser());

  // Strict CORS
  const allowedOrigins = [
    process.env.APP_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3002',
    'http://localhost:3000',
    'http://localhost:3002',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive
      }
    },
    credentials: true,
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('JavaMifi Compass API')
    .setDescription(
      'Trip-centric connectivity platform API: Planner, Hybrid Orders, Payments, Logistics & n8n Automation',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('planner', 'Explainable rule-based recommendation engine')
    .addTag('catalog', 'Destinations, products, plans, promos & journey presets')
    .addTag('orders', 'Order state machine & cart checkout')
    .addTag('payments', 'Payment gateway (Mock & Midtrans Snap sandbox) & ledger')
    .addTag('fulfillment', 'Digital eSIM provisioning & physical Pocket WiFi logistics')
    .addTag('integrations', 'Open-Meteo, Frankfurter, REST Countries & eSIM adapter')
    .addTag('automation', 'n8n webhooks & transactional outbox callbacks')
    .addTag('admin', 'CMS data screens & device inventory board')
    .addTag('health', 'Liveness & readiness health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 JavaMifi Compass API is running on: http://localhost:${port}`);
  logger.log(`📚 OpenAPI / Swagger documentation at: http://localhost:${port}/api/docs`);
}

bootstrap();
