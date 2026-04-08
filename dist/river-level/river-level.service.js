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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiverLevelService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
let RiverLevelService = class RiverLevelService {
    constructor(prisma, predictionsQueue) {
        this.prisma = prisma;
        this.predictionsQueue = predictionsQueue;
    }
    async create(dto) {
        await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });
        const reading = await this.prisma.riverLevel.create({
            data: {
                stationId: dto.station_id,
                timestamp: new Date(dto.timestamp),
                levelM: dto.level_m,
                flowRateCms: dto.flow_rate_cms,
            },
        });
        this.predictionsQueue
            .add({ stationId: dto.station_id }, { jobId: `predict-${dto.station_id}-${Date.now()}` })
            .catch(console.error);
        return {
            id: reading.id,
            station_id: reading.stationId,
            timestamp: reading.timestamp,
            level_m: reading.levelM,
            flow_rate_cms: reading.flowRateCms,
            created_at: reading.createdAt,
        };
    }
    findAll({ stationId, limit }) {
        return this.prisma.riverLevel.findMany({
            where: { ...(stationId && { stationId }) },
            orderBy: { timestamp: 'desc' },
            take: Math.min(parseInt(limit), 500),
        });
    }
};
exports.RiverLevelService = RiverLevelService;
exports.RiverLevelService = RiverLevelService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('predictions')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], RiverLevelService);
//# sourceMappingURL=river-level.service.js.map