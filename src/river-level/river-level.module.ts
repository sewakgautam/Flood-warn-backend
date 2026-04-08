import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RiverLevelController } from './river-level.controller';
import { RiverLevelService } from './river-level.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'predictions' })],
  controllers: [RiverLevelController],
  providers: [RiverLevelService],
})
export class RiverLevelModule {}
