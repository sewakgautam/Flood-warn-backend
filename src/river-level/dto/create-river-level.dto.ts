import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiverLevelDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  station_id: string;

  @ApiProperty()
  @IsDateString()
  timestamp: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(20)
  level_m: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  flow_rate_cms?: number;
}
