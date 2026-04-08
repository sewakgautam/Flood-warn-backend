import { AdminService } from './admin.service';
import { UpdateRainfallDto } from './dto/update-rainfall.dto';
import { UpdateRiverLevelDto } from './dto/update-river-level.dto';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getRainfall(stationId?: string, limit?: string): import(".prisma/client").Prisma.PrismaPromise<({
        station: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        valueMm: number;
        durationMinutes: number | null;
    })[]>;
    updateRainfall(id: string, dto: UpdateRainfallDto): import(".prisma/client").Prisma.Prisma__RainfallClient<{
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        valueMm: number;
        durationMinutes: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deleteRainfall(id: string): Promise<{
        deleted: boolean;
    }>;
    getRiverLevels(stationId?: string, limit?: string): import(".prisma/client").Prisma.PrismaPromise<({
        station: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        levelM: number;
        flowRateCms: number | null;
    })[]>;
    updateRiverLevel(id: string, dto: UpdateRiverLevelDto): import(".prisma/client").Prisma.Prisma__RiverLevelClient<{
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        levelM: number;
        flowRateCms: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deleteRiverLevel(id: string): Promise<{
        deleted: boolean;
    }>;
    getSyncStatus(): Promise<{
        id: string;
        name: string;
        location: string;
        status: string;
        lastSeenAt: Date;
        latestRainfall: {
            id: string;
            createdAt: Date;
            stationId: string;
            timestamp: Date;
            valueMm: number;
            durationMinutes: number | null;
        };
        latestRiverLevel: {
            id: string;
            createdAt: Date;
            stationId: string;
            timestamp: Date;
            levelM: number;
            flowRateCms: number | null;
        };
        isAutoSync: boolean;
    }[]>;
}
