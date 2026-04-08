import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EngineService } from '../processing/engine.service';
export declare class PredictionProcessor {
    private prisma;
    private engine;
    private readonly logger;
    constructor(prisma: PrismaService, engine: EngineService);
    process(job: Job<{
        stationId: string;
    }>): Promise<{
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
    private createAlertIfNeeded;
}
