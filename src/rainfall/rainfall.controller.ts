import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RainfallService } from './rainfall.service';
import { CreateRainfallDto } from './dto/create-rainfall.dto';

@ApiTags('Rainfall')
@ApiBearerAuth()
@Controller('rainfall')
export class RainfallController {
  constructor(private rainfallService: RainfallService) {}

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateRainfallDto) {
    return this.rainfallService.create(dto);
  }

  @Get()
  findAll(
    @Query('station_id') stationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '50',
  ) {
    return this.rainfallService.findAll({ stationId, from, to, limit });
  }
}
