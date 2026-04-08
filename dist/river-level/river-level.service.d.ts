import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRiverLevelDto } from './dto/create-river-level.dto';
export declare class RiverLevelService {
    private prisma;
    private predictionsQueue;
    constructor(prisma: PrismaService, predictionsQueue: Queue);
    create(dto: CreateRiverLevelDto): Promise<{
        id: string;
        station_id: string;
        timestamp: Date;
        level_m: number;
        flow_rate_cms: number;
        created_at: Date;
    }>;
    findAll({ stationId, limit }: {
        stationId?: string;
        limit: string;
    }): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        levelM: number;
        flowRateCms: number | null;
    }[]>;
}
