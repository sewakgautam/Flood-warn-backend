import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateRiverLevelDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  level_m?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flow_rate_cms?: number;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
