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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        await this.prisma.user.findUniqueOrThrow({ where: { id: dto.user_id } });
        await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });
        const sub = await this.prisma.subscription.create({
            data: {
                userId: dto.user_id,
                stationId: dto.station_id,
                severity: dto.severity,
                channels: dto.channels,
            },
        });
        return {
            id: sub.id,
            user_id: sub.userId,
            station_id: sub.stationId,
            severity: sub.severity,
            channels: sub.channels,
            active: sub.active,
            created_at: sub.createdAt,
        };
    }
    findAll({ userId, stationId }) {
        return this.prisma.subscription.findMany({
            where: {
                ...(userId && { userId }),
                ...(stationId && { stationId }),
                active: true,
            },
            include: {
                user: { select: { name: true, email: true } },
                station: { select: { name: true } },
            },
        });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map