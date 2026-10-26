import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    // Default role: CUSTOMER
    let customerRole = await this.prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (!customerRole) {
      customerRole = await this.prisma.role.create({
        data: { name: 'CUSTOMER', description: 'Standard Traveler / Customer' },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
        roles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    await this.auditService.record({
      actorId: user.id,
      action: 'USER_REGISTER',
      resource: 'users',
      resourceId: user.id,
    });

    const token = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map((r) => r.role.name),
      },
    };
  }

  async login(credentials: { email: string; password: string; totpCode?: string }) {
    const email = credentials.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked due to failed attempts. Try again later.');
    }

    const isMatch = await argon2.verify(user.passwordHash, credentials.password);
    if (!isMatch) {
      const attempts = user.loginAttempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockedUntil },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    // Check optional TOTP if enabled for user
    if (user.totpEnabled && user.totpSecret) {
      if (!credentials.totpCode || !authenticator.verify({ token: credentials.totpCode, secret: user.totpSecret })) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    // Reset login attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await this.auditService.record({
      actorId: user.id,
      action: 'USER_LOGIN',
      resource: 'users',
      resourceId: user.id,
    });

    const token = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map((r) => r.role.name),
      },
    };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.session.delete({ where: { id: session.id } });
    const newRefreshToken = await this.generateRefreshToken(session.userId);
    const token = this.generateAccessToken(session.user);

    return {
      token,
      refreshToken: newRefreshToken,
    };
  }

  private generateAccessToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((r: any) => r.role?.name || r),
    };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = `rt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: token,
        expiresAt,
      },
    });

    return token;
  }
}
