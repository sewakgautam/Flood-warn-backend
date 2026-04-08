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
var PredictionProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const engine_service_1 = require("../processing/engine.service");
const DEDUP_WINDOW_MS = 2 * 60 * 60 * 1000;
let PredictionProcessor = PredictionProcessor_1 = class PredictionProcessor {
    constructor(prisma, engine) {
        this.prisma = prisma;
        this.engine = engine;
        this.logger = new common_1.Logger(PredictionProcessor_1.name);
    }
    async process(job) {
        const { stationId } = job.data;
        this.logger.log(`Running prediction for station: ${stationId}`);
        const result = await this.engine.runPrediction(stationId);
        if (['WATCH', 'WARNING', 'CRITICAL'].includes(result.risk_level)) {
            await this.createAlertIfNeeded(stationId, result.risk_level, result.recommendation);
        }
        await this.prisma.station.update({
            where: { id: stationId },
            data: { lastSeenAt: new Date(), status: 'ONLINE' },
        });
        return result;
    }
    async createAlertIfNeeded(stationId, severity, message) {
        const since = new Date(Date.now() - DEDUP_WINDOW_MS);
        const existing = await this.prisma.alert.findFirst({
            where: { stationId, severity, createdAt: { gte: since } },
        });
        if (existing) {
            this.logger.log(`Dedup: alert ${severity} for ${stationId} already exists`);
            return;
        }
        const alert = await this.prisma.alert.create({
            data: { stationId, severity, message, source: 'auto' },
        });
        this.logger.log(`Created alert ${alert.id} — ${severity} for ${stationId}`);
    }
};
exports.PredictionProcessor = PredictionProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PredictionProcessor.prototype, "process", null);
exports.PredictionProcessor = PredictionProcessor = PredictionProcessor_1 = __decorate([
    (0, bull_1.Processor)('predictions'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, engine_service_1.EngineService])
], PredictionProcessor);
//# sourceMappingURL=prediction.processor.js.map