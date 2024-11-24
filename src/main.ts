import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
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
