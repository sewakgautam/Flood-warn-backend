import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StationsModule } from './stations/stations.module';
import { RainfallModule } from './rainfall/rainfall.module';
import { RiverLevelModule } from './river-level/river-level.module';
import { AlertsModule } from './alerts/alerts.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PredictModule } from './predict/predict.module';
import { AdminModule } from './admin/admin.module';
import { PublicModule } from './public/public.module';
import { EmailModule } from './email/email.module';
import { WorkersModule } from './workers/workers.module';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 200 }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StationsModule,
    RainfallModule,
    RiverLevelModule,
    AlertsModule,
    SubscriptionsModule,
    PredictModule,
    AdminModule,
    PublicModule,
    EmailModule,
    WorkersModule,
    ProcessingModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
