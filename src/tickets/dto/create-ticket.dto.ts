import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Server Down',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @Length(5, 100)
  title: string;

  @ApiProperty({
    example: 'Unable to connect to production server since morning',
    minLength: 10,
  })
  @IsString()
  @Length(10, 1000) 
  description: string;
}
