import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
export declare class StationsController {
    private stationsService;
    constructor(stationsService: StationsService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        thresholds: {
            id: string;
            createdAt: Date;
            watchRain: number;
            warningRain: number;
            criticalRain: number;
            watchRiver: number;
            warningRiver: number;
            criticalRiver: number;
            stationId: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        location: string;
        latitude: number | null;
        longitude: number | null;
        active: boolean;
        lastSeenAt: Date | null;
        status: string;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__StationClient<{
        thresholds: {
            id: string;
            createdAt: Date;
            watchRain: number;
            warningRain: number;
            criticalRain: number;
            watchRiver: number;
            warningRiver: number;
            criticalRiver: number;
            stationId: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        location: string;
        latitude: number | null;
        longitude: number | null;
        active: boolean;
        lastSeenAt: Date | null;
        status: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    create(dto: CreateStationDto): import(".prisma/client").Prisma.Prisma__StationClient<{
        thresholds: {
            id: string;
            createdAt: Date;
            watchRain: number;
            warningRain: number;
            criticalRain: number;
            watchRiver: number;
            warningRiver: number;
            criticalRiver: number;
            stationId: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        location: string;
        latitude: number | null;
        longitude: number | null;
        active: boolean;
        lastSeenAt: Date | null;
        status: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
