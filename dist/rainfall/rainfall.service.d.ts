import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRainfallDto } from './dto/create-rainfall.dto';
export declare class RainfallService {
    private prisma;
    private predictionsQueue;
    constructor(prisma: PrismaService, predictionsQueue: Queue);
    create(dto: CreateRainfallDto): Promise<{
        id: string;
        station_id: string;
        timestamp: Date;
        value_mm: number;
        created_at: Date;
    }>;
    findAll({ stationId, from, to, limit }: {
        stationId?: string;
        from?: string;
        to?: string;
        limit: string;
    }): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        valueMm: number;
        durationMinutes: number | null;
    }[]>;
}
