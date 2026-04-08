import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubscriptionDto) {
    await this.prisma.user.findUniqueOrThrow({ where: { id: dto.user_id } });
    await this.prisma.station.findUniqueOrThrow({ where: { id: dto.station_id } });
    const sub = await this.prisma.subscription.create({
      data: {
        userId: dto.user_id,
        stationId: dto.station_id,
        severity: dto.severity,
        channels: dto.channels,
      },
    });
    return {
      id: sub.id,
      user_id: sub.userId,
      station_id: sub.stationId,
      severity: sub.severity,
      channels: sub.channels,
      active: sub.active,
      created_at: sub.createdAt,
    };
  }

  findAll({ userId, stationId }: { userId?: string; stationId?: string }) {
    return this.prisma.subscription.findMany({
      where: {
        ...(userId && { userId }),
        ...(stationId && { stationId }),
        active: true,
      },
      include: {
        user: { select: { name: true, email: true } },
        station: { select: { name: true } },
      },
    });
  }
}
