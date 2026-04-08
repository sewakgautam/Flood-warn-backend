import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionsController {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(dto: CreateSubscriptionDto): Promise<{
        id: string;
        user_id: string;
        station_id: string;
        severity: string;
        channels: string[];
        active: boolean;
        created_at: Date;
    }>;
    findAll(userId?: string, stationId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        station: {
            name: string;
        };
        user: {
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        active: boolean;
        stationId: string;
        severity: string;
        channels: string[];
        userId: string;
    })[]>;
}
