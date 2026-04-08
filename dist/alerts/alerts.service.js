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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AlertsService = class AlertsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll({ stationId, severity, fromDate, toDate, page, pageSize, }) {
        const take = Math.min(parseInt(pageSize), 100);
        const skip = (parseInt(page) - 1) * take;
        const where = {
            ...(stationId && { stationId }),
            ...(severity && { severity }),
            ...((fromDate || toDate) && {
                createdAt: {
                    ...(fromDate && { gte: new Date(fromDate) }),
                    ...(toDate && { lte: new Date(toDate) }),
                },
            }),
        };
        const [total, results] = await Promise.all([
            this.prisma.alert.count({ where }),
            this.prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        ]);
        return { total, page: parseInt(page), page_size: take, results };
    }
    async create(dto) {
        await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });
        const alert = await this.prisma.alert.create({
            data: {
                stationId: dto.station_id,
                severity: dto.severity,
                message: dto.message,
                source: dto.source ?? 'manual',
            },
        });
        return {
            id: alert.id,
            station_id: alert.stationId,
            severity: alert.severity,
            message: alert.message,
            source: alert.source,
            dispatched: alert.dispatched,
            created_at: alert.createdAt,
        };
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map