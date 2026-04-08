import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateRainfallDto } from './dto/update-rainfall.dto';
import { UpdateRiverLevelDto } from './dto/update-river-level.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('rainfall')
  getRainfall(@Query('station_id') stationId?: string, @Query('limit') limit = '50') {
    return this.adminService.getRainfall(stationId, limit);
  }

  @Patch('rainfall/:id')
  @Roles('admin', 'operator')
  updateRainfall(@Param('id') id: string, @Body() dto: UpdateRainfallDto) {
    return this.adminService.updateRainfall(id, dto);
  }

  @Delete('rainfall/:id')
  @Roles('admin')
  deleteRainfall(@Param('id') id: string) {
    return this.adminService.deleteRainfall(id);
  }

  @Get('river-levels')
  getRiverLevels(@Query('station_id') stationId?: string, @Query('limit') limit = '50') {
    return this.adminService.getRiverLevels(stationId, limit);
  }

  @Patch('river-levels/:id')
  @Roles('admin', 'operator')
  updateRiverLevel(@Param('id') id: string, @Body() dto: UpdateRiverLevelDto) {
    return this.adminService.updateRiverLevel(id, dto);
  }

  @Delete('river-levels/:id')
  @Roles('admin')
  deleteRiverLevel(@Param('id') id: string) {
    return this.adminService.deleteRiverLevel(id);
  }

  @Get('sync-status')
  getSyncStatus() {
    return this.adminService.getSyncStatus();
  }
}
