import { PrismaService } from '../prisma/prisma.service';
import { EngineService } from '../processing/engine.service';
export declare class PredictService {
    private prisma;
    private engine;
    constructor(prisma: PrismaService, engine: EngineService);
    predict(stationId: string, windowHours: number): Promise<{
        station_id: string;
        risk_level: string;
        score: number;
        threshold_mm: number;
        current_mm: number;
        river_level_m: number;
        critical_level_m: number;
        recommendation: string;
        window_hours: number;
        readings_count: number;
        evaluated_at: string;
    }>;
}
