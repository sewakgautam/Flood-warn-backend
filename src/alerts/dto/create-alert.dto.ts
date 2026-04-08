import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  station_id: string;

  @ApiProperty({ enum: ['NORMAL', 'WATCH', 'WARNING', 'CRITICAL'] })
  @IsEnum(['NORMAL', 'WATCH', 'WARNING', 'CRITICAL'])
  severity: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message: string;

  @ApiProperty({ required: false, enum: ['manual', 'auto'] })
  @IsOptional()
  @IsEnum(['manual', 'auto'])
  source?: string;
}
