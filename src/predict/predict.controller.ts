import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PredictService } from './predict.service';

@ApiTags('Prediction')
@ApiBearerAuth()
@Controller('predict')
export class PredictController {
  constructor(private predictService: PredictService) {}

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':station_id')
  predict(
    @Param('station_id') stationId: string,
    @Query('window_hours') windowHours = '6',
  ) {
    return this.predictService.predict(stationId, parseInt(windowHours));
  }
}
