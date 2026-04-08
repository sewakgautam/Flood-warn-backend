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
exports.RainfallService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
let RainfallService = class RainfallService {
    constructor(prisma, predictionsQueue) {
        this.prisma = prisma;
        this.predictionsQueue = predictionsQueue;
    }
    async create(dto) {
        await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });
        const reading = await this.prisma.rainfall.create({
            data: {
                stationId: dto.station_id,
                timestamp: new Date(dto.timestamp),
                valueMm: dto.value_mm,
                durationMinutes: dto.duration_minutes,
            },
        });
        this.predictionsQueue
            .add({ stationId: dto.station_id }, { jobId: `predict-${dto.station_id}-${Date.now()}` })
            .catch(console.error);
        return {
            id: reading.id,
            station_id: reading.stationId,
            timestamp: reading.timestamp,
            value_mm: reading.valueMm,
            created_at: reading.createdAt,
        };
    }
    findAll({ stationId, from, to, limit }) {
        return this.prisma.rainfall.findMany({
            where: {
                ...(stationId && { stationId }),
                ...((from || to) && {
                    timestamp: {
                        ...(from && { gte: new Date(from) }),
                        ...(to && { lte: new Date(to) }),
                    },
                }),
            },
            orderBy: { timestamp: 'desc' },
            take: Math.min(parseInt(limit), 500),
        });
    }
};
exports.RainfallService = RainfallService;
exports.RainfallService = RainfallService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('predictions')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], RainfallService);
//# sourceMappingURL=rainfall.service.js.map