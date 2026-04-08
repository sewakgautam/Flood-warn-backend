import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
export declare class WorkersScheduler {
    private prisma;
    private predictionsQueue;
    private readonly logger;
    constructor(prisma: PrismaService, predictionsQueue: Queue);
    pollStations(): Promise<void>;
    checkStationHealth(): Promise<void>;
}
