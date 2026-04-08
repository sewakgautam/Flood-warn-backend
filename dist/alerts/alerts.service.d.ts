import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
export declare class AlertsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll({ stationId, severity, fromDate, toDate, page, pageSize, }: {
        stationId?: string;
        severity?: string;
        fromDate?: string;
        toDate?: string;
        page: string;
        pageSize: string;
    }): Promise<{
        total: number;
        page: number;
        page_size: number;
        results: {
            id: string;
            createdAt: Date;
            stationId: string;
            severity: string;
            message: string;
            source: string;
            dispatched: boolean;
        }[];
    }>;
    create(dto: CreateAlertDto): Promise<{
        id: string;
        station_id: string;
        severity: string;
        message: string;
        source: string;
        dispatched: boolean;
        created_at: Date;
    }>;
}
