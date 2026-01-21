import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketAuditLog } from './entities/ticket-audit.entity';
import { Ticket } from '../tickets/entities/ticket.entity';


@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(TicketAuditLog)
    private readonly repo: Repository<TicketAuditLog>,
  ) {}
  // for entry in database we using log

  async log(action: string, ticket: Ticket, user: any, details?: any) {
    const entry = this.repo.create({
      action,
      ticket,
      performedBy: user?.sub ? { id: user.sub } as any : null,
      details,
    });
    return this.repo.save(entry);
  }
  // getting all ticket we used in controller 
  async getAll() {
    return this.repo.find({
      relations: ['ticket', 'performedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  //pacific log for any ticket  

  async getByTicket(ticketId: string) {
    return this.repo.find({
      where: { ticket: { id: ticketId } },
      relations: ['ticket', 'performedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
