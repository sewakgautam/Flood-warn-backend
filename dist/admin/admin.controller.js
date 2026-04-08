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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const update_rainfall_dto_1 = require("./dto/update-rainfall.dto");
const update_river_level_dto_1 = require("./dto/update-river-level.dto");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getRainfall(stationId, limit = '50') {
        return this.adminService.getRainfall(stationId, limit);
    }
    updateRainfall(id, dto) {
        return this.adminService.updateRainfall(id, dto);
    }
    deleteRainfall(id) {
        return this.adminService.deleteRainfall(id);
    }
    getRiverLevels(stationId, limit = '50') {
        return this.adminService.getRiverLevels(stationId, limit);
    }
    updateRiverLevel(id, dto) {
        return this.adminService.updateRiverLevel(id, dto);
    }
    deleteRiverLevel(id) {
        return this.adminService.deleteRiverLevel(id);
    }
    getSyncStatus() {
        return this.adminService.getSyncStatus();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('rainfall'),
    __param(0, (0, common_1.Query)('station_id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRainfall", null);
__decorate([
    (0, common_1.Patch)('rainfall/:id'),
    (0, roles_decorator_1.Roles)('admin', 'operator'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_rainfall_dto_1.UpdateRainfallDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateRainfall", null);
__decorate([
    (0, common_1.Delete)('rainfall/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteRainfall", null);
__decorate([
    (0, common_1.Get)('river-levels'),
    __param(0, (0, common_1.Query)('station_id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRiverLevels", null);
__decorate([
    (0, common_1.Patch)('river-levels/:id'),
    (0, roles_decorator_1.Roles)('admin', 'operator'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_river_level_dto_1.UpdateRiverLevelDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateRiverLevel", null);
__decorate([
    (0, common_1.Delete)('river-levels/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteRiverLevel", null);
__decorate([
    (0, common_1.Get)('sync-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSyncStatus", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map