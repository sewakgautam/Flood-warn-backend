import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  findAll(
    @Query('station_id') stationId?: string,
    @Query('severity') severity?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page = '1',
    @Query('page_size') pageSize = '20',
  ) {
    return this.alertsService.findAll({ stationId, severity, fromDate, toDate, page, pageSize });
  }

  @Post()
  @Roles('admin', 'operator')
  create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }
}
