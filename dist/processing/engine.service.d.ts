import { PrismaService } from '../prisma/prisma.service';
export declare class EngineService {
    private prisma;
    constructor(prisma: PrismaService);
    runPrediction(stationId: string, windowHours?: number): Promise<{
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
