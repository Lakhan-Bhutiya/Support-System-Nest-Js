import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../tickets/entities/ticket.entity';
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

  // Runs every 60 seconds
  @Cron('*/60 * * * * *')
  async handleEscalations() {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      //  IMPORTANT: do NOT filter by isEscalated
      const tickets = await runner.manager.find(Ticket, {
        where: { status: TicketStatus.IN_PROGRESS },
        relations: ['assignee'],
      });

      const now = new Date();

      for (const ticket of tickets) {
        // Skip if SLA not breached
        if (ticket.deadline >= now) continue;

        //  Ensure previousAssignees is always an array
        if (!Array.isArray(ticket.previousAssignees)) {
          ticket.previousAssignees = [];
        }

        //  Always exclude current assignee
        if (
          ticket.assignee &&
          !ticket.previousAssignees.includes(ticket.assignee.id)
        ) {
          ticket.previousAssignees.push(ticket.assignee.id);
        }

        //  SECOND (or more) FAILURE → STOP AUTO ASSIGN
        if (ticket.previousAssignees.length >= 2) {
          ticket.priority = TicketPriority.URGENT;
          ticket.assignee = null;
          ticket.status = TicketStatus.OPEN;

          await runner.manager.save(ticket);

          await this.audit.log(
            'MULTIPLE_SLA_FAILURE',
            ticket,
            null,
            {
              failedAgents: ticket.previousAssignees,
            },
          );

          const supervisors = await this.usersService.findSupervisors();
          for (const sup of supervisors) {
            await this.notifications.notify(
              sup,
              `Ticket ${ticket.id} failed multiple SLAs. Manual intervention required.`,
            );
          }

          continue; //  stop auto reassignment
        }

        //  FIRST FAILURE → AUTO ESCALATION
        ticket.isEscalated = true; // historical flag only
        ticket.priority = TicketPriority.URGENT;

        const newAgent = await this.usersService.findBestAgent(
          ticket.previousAssignees,
        );

        // ticket.assignee = newAgent ?? null; //??
        ticket.status = newAgent
          ? TicketStatus.IN_PROGRESS
          : TicketStatus.OPEN;

        // Reset SLA (2 min for testing)
        ticket.deadline = new Date(Date.now() + 2 * 60 * 1000);

        await runner.manager.save(ticket);

        await this.audit.log(
          'AUTO_ESCALATION',
          ticket,
          null,
          {
            previousAssignees: ticket.previousAssignees,
          },
        );

        const supervisors = await this.usersService.findSupervisors();
        for (const sup of supervisors) {
          await this.notifications.notify(
            sup,
            `Ticket ${ticket.id} escalated and reassigned.`,
          );
        }
      }

      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      console.error('Watchdog escalation error:', err);
    } finally {
      await runner.release();
    }
  }
}
