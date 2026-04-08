import { Module } from '@nestjs/common';
import { PredictController } from './predict.controller';
import { PredictService } from './predict.service';
import { ProcessingModule } from '../processing/processing.module';

@Module({
  imports: [ProcessingModule],
  controllers: [PredictController],
  providers: [PredictService],
})
export class PredictModule {}
