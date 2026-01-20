import { Injectable, UnauthorizedException, Inject, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { UserRole } from '../../users/entities/user.entity';
import { randomUUID } from 'crypto';
import { SignupDto } from '../dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    @Inject('REDIS_CLIENT') private redis,

  ) {}

  async signup(dto: SignupDto) {
    try {
      const hash = await bcrypt.hash(dto.password, 10);
      return await this.usersService.create({
        email: dto.email,
        password: hash,
        role: UserRole.CUSTOMER,
      });
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw err;
    } 
  }
  
  

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  private async issueTokens(id: string, email: string, role: UserRole) {
    const tokenId = randomUUID();

    const accessToken = this.jwt.sign(
      { sub: id, email, role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );

    const refreshToken = this.jwt.sign(
      { sub: id, tokenId },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const isBlacklisted = await this.redis.get(`bl:${payload.tokenId}`);
      if (isBlacklisted) throw new UnauthorizedException();

      await this.redis.set(`bl:${payload.tokenId}`, '1', 'EX', 7 * 24 * 3600);

      return this.issueTokens(payload.sub, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
