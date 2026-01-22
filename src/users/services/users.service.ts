import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  // Find user By email
  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }
  //Find user by uuid

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }
  //create user from data

  async create(data: Partial<User>): Promise<User> {
    return this.repo.save(data);
  }
  // Find agent who have low task (Used in Ticket )
  async findBestAgent(excludedIds: string[]) {
    const qb = this.repo
  .createQueryBuilder('u')
  .leftJoin(
    'ticket',
    't',
    't.assigneeId = u.id AND t.status = :status',
    { status: 'IN_PROGRESS' },
  )
  .where('u.role = :role', { role: 'AGENT' })
  .andWhere('u.isActive = true');

if (excludedIds.length > 0) {
  qb.andWhere('u.id NOT IN (:...excludedIds)', { excludedIds });
}

return qb
  .groupBy('u.id')
  .orderBy('COUNT(t.id)', 'ASC')
  .addOrderBy('u.createdAt', 'ASC')
  .getOne();

  }
  //create agent 
  async createAgent(dto: CreateAgentDto) {
    try {
      const hash = await bcrypt.hash(dto.password, 10);
      return await this.repo.save({
        email: dto.email,
        password: hash,
        role: UserRole.AGENT,
      });
    } catch (err) {
      if (err.code === '23505') { // Postgres unique violation
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }
  // return agent with number of task 
  async getAgentsWithLoad() {
    return this.repo
      .createQueryBuilder('u')
      .leftJoin('ticket', 't', 't.assigneeId = u.id AND t.status = :status', {
        status: 'IN_PROGRESS',
      })
      .where('u.role = :role', { role: 'AGENT' })
      .groupBy('u.id')
      .select(['u.id', 'u.email', 'COUNT(t.id) as "activeTickets"'])
      .getRawMany();
  }
  //find supervisor for the notification and also used in watchdog
  async findSupervisors() {
    return this.repo.find({
      where: { role: UserRole.SUPERVISOR },
    });
  }
  
}
