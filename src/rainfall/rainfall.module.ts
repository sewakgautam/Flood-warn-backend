import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RainfallController } from './rainfall.controller';
import { RainfallService } from './rainfall.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'predictions' })],
  controllers: [RainfallController],
  providers: [RainfallService],
})
export class RainfallModule {}
