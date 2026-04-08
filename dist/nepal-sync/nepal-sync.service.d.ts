import { OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class NepalSyncService implements OnApplicationBootstrap {
    private prisma;
    private readonly logger;
    private readonly dhmProxyUrl;
    constructor(prisma: PrismaService);
    onApplicationBootstrap(): Promise<void>;
    runSync(): Promise<void>;
    private stripHtml;
    private fetchDHMData;
    private fetchRainfall;
    private fetchDischarge;
    private crossValidate;
    private saveReading;
    private syncAllDHM;
    private syncCrossValidated;
}
