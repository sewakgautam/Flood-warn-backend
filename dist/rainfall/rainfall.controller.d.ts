import { RainfallService } from './rainfall.service';
import { CreateRainfallDto } from './dto/create-rainfall.dto';
export declare class RainfallController {
    private rainfallService;
    constructor(rainfallService: RainfallService);
    create(dto: CreateRainfallDto): Promise<{
        id: string;
        station_id: string;
        timestamp: Date;
        value_mm: number;
        created_at: Date;
    }>;
    findAll(stationId?: string, from?: string, to?: string, limit?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        stationId: string;
        timestamp: Date;
        valueMm: number;
        durationMinutes: number | null;
    }[]>;
}
