import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exeception.filter';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors();
  app.setGlobalPrefix('/api/v2');
  const config = new DocumentBuilder()
    .setTitle('Fairtrade API')
    .setDescription('API documentation for the fairtrade application')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v2/docs', app, document);
  // const OpenApiSpecification =
  /* … */

  app.use(
    '/reference',
    apiReference({
      theme: 'kepler',
      spec: {
        content: document,
      },
    }),
  );

  await app.listen(8080);
}
bootstrap();
