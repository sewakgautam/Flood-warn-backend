import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EngineService } from '../processing/engine.service';

@Injectable()
export class PredictService {
  constructor(private prisma: PrismaService, private engine: EngineService) {}

  async predict(stationId: string, windowHours: number) {
    await this.prisma.station.findUniqueOrThrow({ where: { id: stationId } });
    return this.engine.runPrediction(stationId, windowHours);
  }
}
