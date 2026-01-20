import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketAuditLog } from './entities/ticket-audit.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(TicketAuditLog)
    private readonly repo: Repository<TicketAuditLog>,
  ) {}

  async log(action: string, ticket: Ticket, user: any, details?: any) {
    const entry = this.repo.create({
      action,
      ticket,
      performedBy: user?.sub ? { id: user.sub } as any : null,
      details,
    });
    return this.repo.save(entry);
  }

  async getAll() {
    return this.repo.find({
      relations: ['ticket', 'performedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getByTicket(ticketId: string) {
    return this.repo.find({
      where: { ticket: { id: ticketId } },
      relations: ['ticket', 'performedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
