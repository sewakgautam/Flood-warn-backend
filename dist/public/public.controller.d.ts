import { PrismaService } from '../prisma/prisma.service';
export declare class PublicController {
    private prisma;
    constructor(prisma: PrismaService);
    mapData(): Promise<{
        stations: {
            id: string;
            name: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            lastSeenAt: Date;
            risk: string;
            riverLevel: {
                levelM: number;
                flowRateCms: number;
                timestamp: Date;
            };
            rainfall: {
                valueMm: number;
                timestamp: Date;
            };
            thresholds: {
                watchRiver: number;
                warningRiver: number;
                criticalRiver: number;
            };
        }[];
        updatedAt: string;
    }>;
}
