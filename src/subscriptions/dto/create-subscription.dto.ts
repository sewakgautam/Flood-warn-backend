import { ArrayMinSize, IsArray, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty()
  @IsString()
  station_id: string;

  @ApiProperty({ enum: ['NORMAL', 'WATCH', 'WARNING', 'CRITICAL'] })
  @IsEnum(['NORMAL', 'WATCH', 'WARNING', 'CRITICAL'])
  severity: string;

  @ApiProperty({ type: [String], enum: ['sms', 'email'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['sms', 'email'], { each: true })
  channels: string[];
}
