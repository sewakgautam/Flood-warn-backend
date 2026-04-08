import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RiverLevelService } from './river-level.service';
import { CreateRiverLevelDto } from './dto/create-river-level.dto';

@ApiTags('River')
@ApiBearerAuth()
@Controller('river-level')
export class RiverLevelController {
  constructor(private riverLevelService: RiverLevelService) {}

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateRiverLevelDto) {
    return this.riverLevelService.create(dto);
  }

  @Get()
  findAll(
    @Query('station_id') stationId?: string,
    @Query('limit') limit = '50',
  ) {
    return this.riverLevelService.findAll({ stationId, limit });
  }
}
