import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  @Entity()
  export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    message: string;
  
    @ManyToOne(() => User)
    user: User;
  
    @Column({ default: false })
    isRead: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  