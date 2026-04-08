"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerAppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const prisma_module_1 = require("./prisma/prisma.module");
const workers_module_1 = require("./workers/workers.module");
const processing_module_1 = require("./processing/processing.module");
let WorkerAppModule = class WorkerAppModule {
};
exports.WorkerAppModule = WorkerAppModule;
exports.WorkerAppModule = WorkerAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            bull_1.BullModule.forRootAsync({
                useFactory: () => ({
                    url: process.env.REDIS_URL || 'redis://localhost:6379',
                    defaultJobOptions: {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 30_000 },
                        removeOnComplete: 100,
                        removeOnFail: 50,
                    },
                }),
            }),
            prisma_module_1.PrismaModule,
            processing_module_1.ProcessingModule,
            workers_module_1.WorkersModule,
        ],
    })
], WorkerAppModule);
//# sourceMappingURL=worker.module.js.map