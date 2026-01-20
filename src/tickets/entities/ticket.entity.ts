import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';

  
  export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
    SUPERVISOR_CLOSED = 'SUPERVISOR_CLOSED'
  }
  
  export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
  }
  
  @Entity()
  export class Ticket {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    title: string;
    
    @Column('text')
    description: string;
    
    @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
    status: TicketStatus;
    
    @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.LOW })
    priority: TicketPriority;

    @Column({ type: 'timestamptz' })
    deadline: Date;
   
    @Column({ default: false })
    isEscalated: boolean;
    
    @Column({ type: 'jsonb', default: [] })
    previousAssignees: string[];
  
    @ManyToOne(() => User)
    creator: User;
    
    @ManyToOne(() => User, { nullable: true })
    assignee: User | null;    
  
    @CreateDateColumn()
    createdAt: Date;
  }
  