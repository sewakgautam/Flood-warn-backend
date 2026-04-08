import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { WorkersModule } from './workers/workers.module';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: () => ({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
    }),
    PrismaModule,
    ProcessingModule,
    WorkersModule,
  ],
})
export class WorkerAppModule {}
