import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReassignTicketDto {
  @ApiProperty()
  @IsUUID()
  assigneeId: string;
}
