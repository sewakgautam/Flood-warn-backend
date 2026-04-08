import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WorkerAppModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerAppModule);
  console.log('[Worker] FloodWatch background workers started');
  process.on('SIGTERM', () => app.close());
}

bootstrap().catch((err) => {
  console.error('Worker fatal:', err);
  process.exit(1);
});
