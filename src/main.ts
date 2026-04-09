import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

app.enableCors({ origin:['http://localhost:3500','http://frontend:3500','http://104.223.50.140:3500'], credentials:true, });  
app.setGlobalPrefix('v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('FloodWatch API')
    .setVersion('1.0.0')
    .setDescription('Flood Early Warning API System')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 8000;
  await app.listen(port, '0.0.0.0');
  console.log(`FloodWatch API running on port ${port}`);
}

bootstrap();
