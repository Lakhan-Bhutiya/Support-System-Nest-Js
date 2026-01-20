import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { Ticket, TicketPriority, TicketStatus } from '../tickets/entities/ticket.entity';
import { UsersService } from '../users/services/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';


@Injectable()
export class WatchdogService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  @Cron('*/60 * * * * *')
 
  async handleEscalations() {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    console.log('hi');

    try {
      const tickets = await runner.manager.find(Ticket, {
        where: { isEscalated: false },
        relations: ['assignee'],
      });

      const now = new Date();

      for (const ticket of tickets) {
        if (ticket.status !== TicketStatus.RESOLVED && ticket.deadline < now) {
      
          //  SECOND (or more) FAILURE → STOP AUTO
          if (ticket.previousAssignees.length >= 2) {
            ticket.priority = TicketPriority.URGENT;
            ticket.assignee = null;
            ticket.status = TicketStatus.OPEN;
      
            await runner.manager.save(ticket);
      
            await this.audit.log(
              'MULTIPLE_SLA_FAILURE',
              ticket,
              null,
              { failedAgents: ticket.previousAssignees },
            );
      
            const supervisors = await this.usersService.findSupervisors();
            for (const sup of supervisors) {
              await this.notifications.notify(
                sup,
                `Ticket ${ticket.id} failed multiple SLAs. Manual intervention required.`,
              );
            }
      
            continue; //  DO NOT auto-assign anymore
          }
      
          //  FIRST FAILURE → AUTO ESCALATION
          ticket.isEscalated = true;
          ticket.priority = TicketPriority.URGENT;
      
          if (ticket.assignee) {
            ticket.previousAssignees.push(ticket.assignee.id);
          }
      
          const newAgent = await this.usersService.findBestAgent(
            ticket.previousAssignees,
          );
      
          ticket.assignee = newAgent ?? null;
          ticket.status = newAgent ? TicketStatus.IN_PROGRESS : TicketStatus.OPEN;
          ticket.deadline = new Date(Date.now() + 2 * 60 * 1000); // testing SLA
      
          await runner.manager.save(ticket);
      
          await this.audit.log(
            'AUTO_ESCALATION',
            ticket,
            null,
            { previousAssignees: ticket.previousAssignees },
          );
      
          const supervisors = await this.usersService.findSupervisors();
          for (const sup of supervisors) {
            await this.notifications.notify(
              sup,
              `Ticket ${ticket.id} escalated and reassigned.`,
            );
          }
        }
      }
      

      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      console.error('Escalation error:', err);
    } finally {
      await runner.release();
    }
  }
}
