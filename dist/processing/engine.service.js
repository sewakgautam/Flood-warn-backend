"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const DEFAULT_THRESHOLDS = {
    watchRain: 30, warningRain: 50, criticalRain: 80,
    watchRiver: 2.5, warningRiver: 3.5, criticalRiver: 4.5,
};
const RECOMMENDATIONS = {
    NORMAL: 'All readings within safe limits. No action required.',
    WATCH: 'Readings approaching threshold. Continue monitoring closely.',
    WARNING: 'Issue advisory to downstream communities. Prepare response teams.',
    CRITICAL: 'Immediate evacuation advisory required. Alert all agencies.',
};
let EngineService = class EngineService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async runPrediction(stationId, windowHours = 6) {
        const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
        const [rainfallReadings, latestRiver, stationThresholds] = await Promise.all([
            this.prisma.rainfall.findMany({
                where: { stationId, timestamp: { gte: since } },
                select: { valueMm: true },
            }),
            this.prisma.riverLevel.findFirst({
                where: { stationId },
                orderBy: { timestamp: 'desc' },
                select: { levelM: true },
            }),
            this.prisma.stationThreshold.findUnique({ where: { stationId } }),
        ]);
        const thresholds = { ...DEFAULT_THRESHOLDS, ...stationThresholds };
        const totalRainfallMm = rainfallReadings.reduce((sum, r) => sum + r.valueMm, 0);
        const riverLevelM = latestRiver?.levelM ?? 0;
        let riskLevel;
        if (totalRainfallMm > thresholds.criticalRain || riverLevelM > thresholds.criticalRiver) {
            riskLevel = 'CRITICAL';
        }
        else if (totalRainfallMm > thresholds.warningRain || riverLevelM > thresholds.warningRiver) {
            riskLevel = 'WARNING';
        }
        else if (totalRainfallMm > thresholds.watchRain || riverLevelM > thresholds.watchRiver) {
            riskLevel = 'WATCH';
        }
        else {
            riskLevel = 'NORMAL';
        }
        const rainScore = Math.min(totalRainfallMm / thresholds.criticalRain, 1.0);
        const riverScore = Math.min(riverLevelM / thresholds.criticalRiver, 1.0);
        const score = Math.round(Math.max(rainScore, riverScore) * 100) / 100;
        return {
            station_id: stationId,
            risk_level: riskLevel,
            score,
            threshold_mm: thresholds.warningRain,
            current_mm: Math.round(totalRainfallMm * 100) / 100,
            river_level_m: riverLevelM,
            critical_level_m: thresholds.criticalRiver,
            recommendation: RECOMMENDATIONS[riskLevel],
            window_hours: windowHours,
            readings_count: rainfallReadings.length,
            evaluated_at: new Date().toISOString(),
        };
    }
};
exports.EngineService = EngineService;
exports.EngineService = EngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EngineService);
//# sourceMappingURL=engine.service.js.map