import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketsService } from './services/tickets.service';
import { TicketsController } from './controllers/tickets.controller';
import { UsersModule } from 'src/users/users.module';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from 'src/audit/audit.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    UsersModule,
    AuditModule,
  ],
  
  providers: [TicketsService,TicketsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },],
  controllers: [TicketsController],
})
export class TicketsModule {}
 