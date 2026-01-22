import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { UsersService } from '../services/users.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@Roles(UserRole.SUPERVISOR)
@ApiBearerAuth('access-token')
@ApiTags('Users (Supervisor)')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService : UsersService){}


// Create Agent 
@ApiOperation({
  summary: 'Create Agent',
  description: 'SUPERVISOR only. Creates a new AGENT user.',
})
@ApiBody({
  schema: {
  example: {
    email: 'agent1@test.com',
    password: 'Agent@123',
    },
  },
})
@Roles(UserRole.SUPERVISOR) 
@Post('agents')
  createAgent(@Body() dto: CreateAgentDto) {
    return this.usersService.createAgent(dto);
  }


//List of Agent   
@ApiOperation({
  summary: 'List Agents with Load',
  description: 'SUPERVISOR only. Shows agents and active ticket count.',
})
@Roles(UserRole.SUPERVISOR)  
@Get('agents')
getAgents() {
  return this.usersService.getAgentsWithLoad();
}

}