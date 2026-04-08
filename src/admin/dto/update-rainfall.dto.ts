import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class UpdateRainfallDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  value_mm?: number;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  duration_minutes?: number;
}
