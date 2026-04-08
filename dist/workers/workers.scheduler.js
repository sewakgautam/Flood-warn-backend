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
var WorkersScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkersScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkersScheduler = WorkersScheduler_1 = class WorkersScheduler {
    constructor(prisma, predictionsQueue) {
        this.prisma = prisma;
        this.predictionsQueue = predictionsQueue;
        this.logger = new common_1.Logger(WorkersScheduler_1.name);
    }
    async pollStations() {
        try {
            const stations = await this.prisma.station.findMany({
                where: { active: true },
                select: { id: true },
            });
            this.logger.log(`Scheduler: Polling ${stations.length} stations`);
            for (const s of stations) {
                await this.predictionsQueue
                    .add({ stationId: s.id }, { jobId: `predict-${s.id}-${Date.now()}` })
                    .catch(console.error);
            }
        }
        catch (err) {
            this.logger.error('Poll error:', err.message);
        }
    }
    async checkStationHealth() {
        try {
            const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const stations = await this.prisma.station.findMany({ where: { active: true } });
            for (const station of stations) {
                const latest = await this.prisma.rainfall.findFirst({
                    where: { stationId: station.id, timestamp: { gte: cutoff } },
                });
                const newStatus = latest ? 'ONLINE' : 'OFFLINE';
                if (station.status !== newStatus) {
                    await this.prisma.station.update({
                        where: { id: station.id },
                        data: { status: newStatus },
                    });
                    this.logger.log(`Health: Station ${station.id} → ${newStatus}`);
                }
            }
        }
        catch (err) {
            this.logger.error('Health check error:', err.message);
        }
    }
};
exports.WorkersScheduler = WorkersScheduler;
__decorate([
    (0, schedule_1.Interval)(15 * 60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkersScheduler.prototype, "pollStations", null);
__decorate([
    (0, schedule_1.Interval)(30 * 60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkersScheduler.prototype, "checkStationHealth", null);
exports.WorkersScheduler = WorkersScheduler = WorkersScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('predictions')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], WorkersScheduler);
//# sourceMappingURL=workers.scheduler.js.map