import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  //method for notification

  async notify(user: User, message: string) {
    return this.repo.save({ user, message });
  }

  async findForUser(userId: string) {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  // method forr mark as read 

  async markAsRead(id: string, userId: string) {
    const notification = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
  
    if (!notification) throw new NotFoundException('Notification not found');
  
    await this.repo.remove(notification);
    return { message: 'Notification consumed' };
  }
  
}
