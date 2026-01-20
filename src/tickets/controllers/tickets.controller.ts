import { Controller, Post, Get, Body, Req, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ReassignTicketDto } from '../dto/reassign-ticket.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { TicketsService } from '../services/tickets.service';


@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@Controller('tickets')

export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}
  @ApiOperation({
    summary: 'Create Ticket',
    description: 'CUSTOMER only. Creates a support ticket.',
  })
  @ApiBody({
    schema: {
      example: {
        title: 'Login Issue',
        description: 'Unable to login since morning',
      },
    },
  })
  @Roles(UserRole.CUSTOMER)
  //Create the ticket 
  @Post()
  create(@Body() dto: CreateTicketDto, @Req() req) {
    return this.ticketsService.create(dto, req.user);
  }
  @ApiOperation({
    summary: 'Get Tickets',
    description: `
  CUSTOMER → own tickets  
  AGENT → assigned tickets  
  SUPERVISOR → all tickets
  `,
  })
  // Return the tickets 
  @Get()
  findAll(@Req() req) {
    return this.ticketsService.findAllForUser(req.user);
  }
  @ApiOperation({
    summary: 'Resolve Ticket',
    description: 'AGENT only. Marks assigned ticket as RESOLVED.',
  })
  @ApiBody({
    schema: {
      example: {
        status: 'RESOLVED',
      },
    },
  })
  // Agent will change the status if they work

  @Roles(UserRole.AGENT)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req,
  ) {
    return this.ticketsService.updateStatus(id, dto.status, req.user);
  }
  @ApiOperation({
    summary: 'Reassign Ticket',
    description: 'SUPERVISOR only. Reassigns ticket to another agent.',
  })
  @ApiBody({
    schema: {
      example: {
        assigneeId: 'uuid-of-agent',
      },
    },
  })
  // supervisor can change assignment of agent 

  @Roles(UserRole.SUPERVISOR)
  @Patch(':id/reassign')
  reassign(
  @Param('id') id: string,
  @Body() dto: ReassignTicketDto,
  @Req() req,
) {
  return this.ticketsService.reassign(id, dto.assigneeId, req.user);
}
@ApiOperation({
  summary: 'Close Ticket (Supervisor)',
  description: 'SUPERVISOR only. Force-closes a ticket.',
})
@Roles(UserRole.SUPERVISOR)
//supervisor can close the ticket 
@Patch(':id/close')
closeTicket(@Param('id') id: string, @Req() req) {
  return this.ticketsService.closeBySupervisor(id, req.user);
}
}