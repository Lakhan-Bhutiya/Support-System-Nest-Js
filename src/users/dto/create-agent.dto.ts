import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class CreateAgentDto {
  // DTO For Agent 
  //EMAIL
  @ApiProperty({ example: 'agent3@test.com' })
  @IsEmail()
  email: string;
  
  // PASSWORD
  @ApiProperty({ example: 'StrongPass123', minLength: 8 })
  @MinLength(8)
  password: string;
}
