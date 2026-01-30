import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponse } from './interfaces/auth-response.interface';
import { AccountStatusService } from './account-status/account-status.service';
import { UserEntity } from './../users/entities/user.entity';
import { UserStatus } from '../common/enums/user-status.enum';
import { CredentialService } from './credentials/credential.service';
import { EmailVerificationService } from './verification/email-verification.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly accountStatusService: AccountStatusService,
    private readonly credentialService: CredentialService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  /** Register a new user & send OTP */
  public async register(dto: RegisterDto) {
    const user = await this.credentialService.createUser(dto);
    await this.emailVerification.sendOtp(user.email);
    return {
      message: 'User registered. Please verify your email.',
      userId: user.id,
    };
  }

  /** Verify email OTP */
  public async verifyEmail(email: string, otp: string) {
    const verified = await this.emailVerification.verify(email, otp);
    if (!verified) throw new BadRequestException('Invalid or expired OTP');

    await this.userService.updateStatus(email, UserStatus.ACTIVE);
    return { message: 'Email verified successfully' };
  }

  /** Login user & generate tokens */
  public async login(user: UserEntity): Promise<AuthResponse> {
    if (!user) throw new UnauthorizedException('Invalid credentials');

    this.accountStatusService.ensureCanLogin(user);

    // Only allow login if email verified
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Email not verified');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);

    // Store hashed refresh token
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.authToken.create({
      data: {
        authorId: user.id,
        token: hashedToken,
        type: 'REFRESH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7d
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      user: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
      expiresIn: Number(this.configService.get('JWT_EXPIRES_IN')),
    };
  }

  /** Validate refresh token & rotate */
  public async validateRefreshToken(userId: string, refreshToken: string) {
    const tokenRecord = await this.prisma.authToken.findFirst({
      where: { authorId: userId, type: 'REFRESH' },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !tokenRecord ||
      tokenRecord.expiresAt < new Date() ||
      !(await bcrypt.compare(refreshToken, tokenRecord.token))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.authToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    return { userId };
  }

  /** Validate JWT payload */
  public async validateJwtPayload(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException('User not found or inactive');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  /** Generate access token */
  public async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });
  }

  /** Generate refresh token */
  public async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  /** Validate user credentials */
  public async validateUser(email: string, password: string) {
    return this.credentialService.validateUser(email, password);
  }
}
