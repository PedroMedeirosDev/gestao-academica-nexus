import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

type AuthedRequest = Request & {
  user: { userId: string; email: string; role: UserRole };
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login (corpo: email + senha)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Token JWT' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'id, email, role' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.user);
  }
}
