import { PredictService } from './predict.service';
export declare class PredictController {
    private predictService;
    constructor(predictService: PredictService);
    predict(stationId: string, windowHours?: string): Promise<{
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
