import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  // Create the NestJS application instance using Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS) to allow requests from other domains
  app.enableCors();

  // Optional: Prefix all routes with '/api' for better organization
  app.setGlobalPrefix('api');

  // Apply a global validation pipe to automatically validate DTOs using class-validator
  app.useGlobalPipes(new ValidationPipe());
  // Serve static files from 'uploads' directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // files will be available at http://localhost:8080/uploads/...
  });

  /**
   * Swagger Configuration for API Documentation
   * - Title, description, version
   * - Bearer Auth (JWT) added to Swagger UI
   */
  const config = new DocumentBuilder()
    .setTitle('JK Tech')
    .setDescription('API documentation for Nest Js ProjectS')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http', // HTTP authentication scheme
        scheme: 'bearer', // 'bearer' keyword used in header
        bearerFormat: 'JWT', // Token format
        name: 'Authorization', // Header name
        description: 'Enter JWT token', // Swagger UI helper text
        in: 'header', // Token location
      },
      'access-token', // Name used in @ApiBearerAuth('access-token')
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger/api', app, document);
  const port = process.env.PORT ?? 8080;
  // Start the application
  await app.listen(port);
}
bootstrap();
