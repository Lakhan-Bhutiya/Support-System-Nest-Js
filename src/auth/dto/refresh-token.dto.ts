import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5kjsidjisjdiscCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}
