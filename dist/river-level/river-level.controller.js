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
exports.RiverLevelController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const river_level_service_1 = require("./river-level.service");
const create_river_level_dto_1 = require("./dto/create-river-level.dto");
let RiverLevelController = class RiverLevelController {
    constructor(riverLevelService) {
        this.riverLevelService = riverLevelService;
    }
    create(dto) {
        return this.riverLevelService.create(dto);
    }
    findAll(stationId, limit = '50') {
        return this.riverLevelService.findAll({ stationId, limit });
    }
};
exports.RiverLevelController = RiverLevelController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 120, ttl: 60_000 } }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_river_level_dto_1.CreateRiverLevelDto]),
    __metadata("design:returntype", void 0)
], RiverLevelController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('station_id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RiverLevelController.prototype, "findAll", null);
exports.RiverLevelController = RiverLevelController = __decorate([
    (0, swagger_1.ApiTags)('River'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('river-level'),
    __metadata("design:paramtypes", [river_level_service_1.RiverLevelService])
], RiverLevelController);
//# sourceMappingURL=river-level.controller.js.map