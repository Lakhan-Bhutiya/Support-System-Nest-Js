import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public.decorator';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SignupDto } from '../dto/signup.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
@Public()
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @ApiOperation({
    summary: 'Signup as Customer',
    description: 'Creates a CUSTOMER account. Only customers can signup.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'customer@test.com',
        password: 'StrongPass123',
      },
    },
  })
  // signup / create new customer object 
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);

  }
  @ApiOperation({
    summary: 'Login',
    description: 'Login for CUSTOMER / AGENT / SUPERVISOR',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'admin@test.com',
        password: 'Admin@123',
      },
    },
  })


  // Login  for any user

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  // Refresh token for all users
  
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }
  
}
