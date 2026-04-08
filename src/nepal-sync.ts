import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NepalSyncModule } from './nepal-sync/nepal-sync.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(NepalSyncModule);
  console.log('FloodWatch Nepal Sync started');
  process.on('SIGTERM', () => app.close());
}

bootstrap().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
