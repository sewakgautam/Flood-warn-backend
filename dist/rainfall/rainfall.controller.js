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
exports.RainfallController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const rainfall_service_1 = require("./rainfall.service");
const create_rainfall_dto_1 = require("./dto/create-rainfall.dto");
let RainfallController = class RainfallController {
    constructor(rainfallService) {
        this.rainfallService = rainfallService;
    }
    create(dto) {
        return this.rainfallService.create(dto);
    }
    findAll(stationId, from, to, limit = '50') {
        return this.rainfallService.findAll({ stationId, from, to, limit });
    }
};
exports.RainfallController = RainfallController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 120, ttl: 60_000 } }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_rainfall_dto_1.CreateRainfallDto]),
    __metadata("design:returntype", void 0)
], RainfallController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('station_id')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], RainfallController.prototype, "findAll", null);
exports.RainfallController = RainfallController = __decorate([
    (0, swagger_1.ApiTags)('Rainfall'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('rainfall'),
    __metadata("design:paramtypes", [rainfall_service_1.RainfallService])
], RainfallController);
//# sourceMappingURL=rainfall.controller.js.map