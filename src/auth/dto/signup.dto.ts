import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    example: 'user@test.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
    minLength: 8,
  })
  @MinLength(8)
  password: string;
}
