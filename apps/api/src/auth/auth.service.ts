import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const hash = user.passwordHash.trim();
    const ok = await bcrypt.compare(dto.password, hash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken };
  }

  me(session: { userId: string; email: string; role: UserRole }) {
    return {
      id: session.userId,
      email: session.email,
      role: session.role,
    };
  }
}
