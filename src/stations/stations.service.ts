import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStationDto } from './dto/create-station.dto';

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.station.findMany({
      include: { thresholds: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.station.findUniqueOrThrow({
      where: { id },
      include: { thresholds: true },
    });
  }

  create(dto: CreateStationDto) {
    return this.prisma.station.create({
      data: { ...dto, thresholds: { create: {} } },
      include: { thresholds: true },
    });
  }
}
