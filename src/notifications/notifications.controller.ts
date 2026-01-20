import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Patch, Param,  } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
@Roles(UserRole.SUPERVISOR)
@ApiTags('Notifications (Supervisor)')
@ApiBearerAuth('access-token')
@Controller('notifications')

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @ApiOperation({
    summary: 'Get Notifications',
    description: 'SUPERVISOR only. Shows escalation notifications.',
  })
  //Supervisor will get the notification 
  @Get()
  getMy(@Req() req) {
    return this.service.findForUser(req.user.sub);
  }
 
  @ApiOperation({
    summary: 'Mark Notification as Read',
    description: 'SUPERVISOR only. Consumes (deletes) notification.',
  })

 // Supervisor Will change the  read status 
@Patch(':id/read')
markRead(@Param('id') id: string, @Req() req) {
  return this.service.markAsRead(id, req.user.sub);
}
 
}

