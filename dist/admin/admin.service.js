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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getRainfall(stationId, limit) {
        return this.prisma.rainfall.findMany({
            where: { ...(stationId && { stationId }) },
            orderBy: { timestamp: 'desc' },
            take: Math.min(parseInt(limit), 200),
            include: { station: { select: { name: true } } },
        });
    }
    updateRainfall(id, dto) {
        return this.prisma.rainfall.update({
            where: { id },
            data: {
                ...(dto.value_mm !== undefined && { valueMm: dto.value_mm }),
                ...(dto.timestamp && { timestamp: new Date(dto.timestamp) }),
                ...(dto.duration_minutes !== undefined && { durationMinutes: dto.duration_minutes }),
            },
        });
    }
    async deleteRainfall(id) {
        await this.prisma.rainfall.delete({ where: { id } });
        return { deleted: true };
    }
    getRiverLevels(stationId, limit) {
        return this.prisma.riverLevel.findMany({
            where: { ...(stationId && { stationId }) },
            orderBy: { timestamp: 'desc' },
            take: Math.min(parseInt(limit), 200),
            include: { station: { select: { name: true } } },
        });
    }
    updateRiverLevel(id, dto) {
        return this.prisma.riverLevel.update({
            where: { id },
            data: {
                ...(dto.level_m !== undefined && { levelM: dto.level_m }),
                ...(dto.flow_rate_cms !== undefined && { flowRateCms: dto.flow_rate_cms }),
                ...(dto.timestamp && { timestamp: new Date(dto.timestamp) }),
            },
        });
    }
    async deleteRiverLevel(id) {
        await this.prisma.riverLevel.delete({ where: { id } });
        return { deleted: true };
    }
    async getSyncStatus() {
        const stations = await this.prisma.station.findMany({
            orderBy: { lastSeenAt: 'desc' },
            include: {
                rainfallReadings: { orderBy: { timestamp: 'desc' }, take: 1 },
                riverLevels: { orderBy: { timestamp: 'desc' }, take: 1 },
            },
        });
        return stations.map((s) => ({
            id: s.id,
            name: s.name,
            location: s.location,
            status: s.status,
            lastSeenAt: s.lastSeenAt,
            latestRainfall: s.rainfallReadings[0] ?? null,
            latestRiverLevel: s.riverLevels[0] ?? null,
            isAutoSync: s.id.startsWith('DHM-'),
        }));
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map