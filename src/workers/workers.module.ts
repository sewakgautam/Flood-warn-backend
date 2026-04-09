import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PredictionProcessor } from './prediction.processor';
import { WorkersScheduler } from './workers.scheduler';
import { ProcessingModule } from '../processing/processing.module';
import { PublicModule } from '../public/public.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'predictions' }),
    ScheduleModule.forRoot(),
    ProcessingModule,
    PublicModule,
  ],
  providers: [PredictionProcessor, WorkersScheduler],
})
export class WorkersModule {}
