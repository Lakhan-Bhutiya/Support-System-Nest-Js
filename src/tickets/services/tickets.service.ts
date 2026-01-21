import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UsersService } from '../../users/services/users.service';
import { AuditService } from '../../audit/audit.service';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly repo: Repository<Ticket>,
    private readonly usersService: UsersService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTicketDto, jwtUser: any) {
    const creator = await this.usersService.findById(jwtUser.sub);
    if (!creator) throw new NotFoundException('User not found');

    const ticket = this.repo.create({
      ...dto,
      creator,
      status: TicketStatus.OPEN,
      deadline: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes for testing purpose ONLY 

    });

    const saved = await this.repo.save(ticket);

    await this.audit.log('TICKET_CREATED', saved, jwtUser);

    const agent = await this.usersService.findBestAgent([]);
    if (agent) {
      saved.assignee = agent;
      saved.status = TicketStatus.IN_PROGRESS;
      const updated = await this.repo.save(saved);

      await this.audit.log('TICKET_ASSIGNED', updated, null, {
        assigneeId: agent.id,
      });
      return updated;
    }

    return saved;
  }

  async findAllForUser(jwtUser: any) {
    const qb = this.repo.createQueryBuilder('t');
      // Check the role of customer
    if (jwtUser.role === UserRole.CUSTOMER) {
      qb.where('t.creatorId = :id', { id: jwtUser.sub });
    } else if (jwtUser.role === UserRole.AGENT) {           // check the role if it is agent 
      qb.where('t.assigneeId = :id', { id: jwtUser.sub });
    }

    return qb                                               // if role is supervisor than return all things
      .leftJoinAndSelect('t.creator', 'creator')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .getMany();
  }


  // updateStatus it will used by the agent  

  async updateStatus(id: string, status: TicketStatus, jwtUser: any) {
    const ticket = await this.repo.findOne({
      where: { id },
      relations: ['assignee'],
    });


    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === TicketStatus.RESOLVED) {
      throw new BadRequestException('Ticket already resolved');
    }

    if (!ticket.assignee || ticket.assignee.id !== jwtUser.sub) {
      throw new ForbiddenException('Not your ticket');
    }

    if (status !== TicketStatus.RESOLVED) {
      throw new BadRequestException('Agent can only resolve ticket');
    }

    ticket.status = TicketStatus.RESOLVED;
    const updated = await this.repo.save(ticket);

    await this.audit.log('STATUS_CHANGED', updated, jwtUser, { status });

    return updated;
  }


// reassign the ticket 
  async reassign(id: string, assigneeId: string, jwtUser: any) {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const agent = await this.usersService.findById(assigneeId);
    if (!agent || agent.role !== UserRole.AGENT) {
      throw new BadRequestException('Invalid agent');
    }

    ticket.assignee = agent;
    ticket.status = TicketStatus.IN_PROGRESS;
    const updated = await this.repo.save(ticket);

    await this.audit.log('REASSIGNED', updated, jwtUser, { assigneeId });

    return updated;
  }



  //closing the request 
  async closeBySupervisor(id: string, jwtUser: any) {
    const ticket = await this.repo.findOne({ where: { id } });
  
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
  
    if (ticket.status === TicketStatus.RESOLVED) {
      throw new BadRequestException('Ticket already resolved');
    }
  
    ticket.status = TicketStatus.RESOLVED;
  
    const updated = await this.repo.save(ticket);
  
    await this.audit.log('SUPERVISOR_CLOSED',updated,jwtUser,{closedBy:'SUPERVISOR'},);
  
    return updated;
  } 
}
