"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const core_1 = require("@nestjs/core");
const throttler_2 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const stations_module_1 = require("./stations/stations.module");
const rainfall_module_1 = require("./rainfall/rainfall.module");
const river_level_module_1 = require("./river-level/river-level.module");
const alerts_module_1 = require("./alerts/alerts.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const predict_module_1 = require("./predict/predict.module");
const admin_module_1 = require("./admin/admin.module");
const public_module_1 = require("./public/public.module");
const workers_module_1 = require("./workers/workers.module");
const processing_module_1 = require("./processing/processing.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 200 }]),
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
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            stations_module_1.StationsModule,
            rainfall_module_1.RainfallModule,
            river_level_module_1.RiverLevelModule,
            alerts_module_1.AlertsModule,
            subscriptions_module_1.SubscriptionsModule,
            predict_module_1.PredictModule,
            admin_module_1.AdminModule,
            public_module_1.PublicModule,
            workers_module_1.WorkersModule,
            processing_module_1.ProcessingModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_2.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map