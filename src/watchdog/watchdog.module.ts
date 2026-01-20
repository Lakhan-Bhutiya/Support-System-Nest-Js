import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { WatchdogService } from './watchdog.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    UsersModule,
    NotificationsModule,  AuditModule,
  ],
  providers: [WatchdogService],
})
export class WatchdogModule {}
