import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AuditService } from './audit.service';
@Roles(UserRole.SUPERVISOR)
@ApiBearerAuth('access-token ')
@ApiTags('Audit (Supervisor)')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @ApiOperation({
    summary: 'Get All Audit Logs',
    description: 'SUPERVISOR only. Shows all ticket audit history.',
  })
  @Get()
  getAll() {
    return this.audit.getAll();
  }
  @ApiOperation({
    summary: 'Get Ticket Audit',
    description: 'SUPERVISOR only. Shows full lifecycle of one ticket.',
  })

  @Get('ticket/:id')
  getByTicket(@Param('id') id: string) {
    return this.audit.getByTicket(id);
  }
}
