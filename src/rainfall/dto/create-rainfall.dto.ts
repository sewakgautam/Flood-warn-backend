import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRainfallDto {
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
  @Max(500)
  value_mm: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  duration_minutes?: number;
}
