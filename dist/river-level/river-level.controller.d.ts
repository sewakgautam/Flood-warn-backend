import { RiverLevelService } from './river-level.service';
import { CreateRiverLevelDto } from './dto/create-river-level.dto';
export declare class RiverLevelController {
    private riverLevelService;
    constructor(riverLevelService: RiverLevelService);
    create(dto: CreateRiverLevelDto): Promise<{
        id: string;
        station_id: string;
        timestamp: Date;
        level_m: number;
        flow_rate_cms: number;
        created_at: Date;
    }>;
    findAll(stationId?: string, limit?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        levelM: number;
        flowRateCms: number | null;
    }[]>;
}
