import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@test.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
  })
  @MinLength(8)
  password: string;
}
