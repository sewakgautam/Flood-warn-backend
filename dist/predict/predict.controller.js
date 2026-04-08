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
exports.PredictController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const predict_service_1 = require("./predict.service");
let PredictController = class PredictController {
    constructor(predictService) {
        this.predictService = predictService;
    }
    predict(stationId, windowHours = '6') {
        return this.predictService.predict(stationId, parseInt(windowHours));
    }
};
exports.PredictController = PredictController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60_000 } }),
    (0, common_1.Get)(':station_id'),
    __param(0, (0, common_1.Param)('station_id')),
    __param(1, (0, common_1.Query)('window_hours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PredictController.prototype, "predict", null);
exports.PredictController = PredictController = __decorate([
    (0, swagger_1.ApiTags)('Prediction'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('predict'),
    __metadata("design:paramtypes", [predict_service_1.PredictService])
], PredictController);
//# sourceMappingURL=predict.controller.js.map