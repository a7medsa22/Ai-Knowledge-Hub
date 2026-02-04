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
import { AuthTokenService } from './verification/tokens/token.service';
import { Request } from 'express';
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
    private readonly tokenService: AuthTokenService,
  ) {}

  /** 
   * Register a new user & send OTP
   */
  public async register(dto: RegisterDto) {
    const user = await this.credentialService.createUser(dto);
    await this.emailVerification.sendOtp(user.email);

    return {
      message: 'User registered. Please verify your email.',
      userId: user.id,
    };
  }
  
  /** Login user & generate tokens */
  public async login(user: UserEntity,req:Request): Promise<AuthResponse> {
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
     const userAgentHeader = req.headers['user-agent'];
    const deviceNameHeader = req.headers['x-device-name'];

    const deviceInfo = {
      userAgent: Array.isArray(userAgentHeader)
        ? userAgentHeader.join(', ')
        : (userAgentHeader ?? 'Unknown agent'),

      deviceName: Array.isArray(deviceNameHeader)
        ? deviceNameHeader.join(', ')
        : (deviceNameHeader ?? 'Unknown device'),

      ipAddress: req.ip ?? 'unknown',
    };

   await this.accountStatusService.ensureCanLogin(user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);

    const  refreshToken = await this.tokenService.generateRefreshToken(user.id,deviceInfo);

    // Update last login
    await this.userService.updateLastActivity(user.id);

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
  // validation strategy
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isActive: true,
        status: true,
      },
    });
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

   
    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new UnauthorizedException();
  } 
  //* Token Management //
    async validateRefreshToken(userId: string, tokenId: string) {
    return this.tokenService.validateRefreshToken(userId, tokenId);
  }
  async refreshTokens(userId: string, tokenId: string) {
    return this.tokenService.refreshToken(userId, tokenId);
  }
  async validateJwtPayload(userId:string) {
    return this.tokenService.validateAndGetUserFromJwt(userId);
  }

  //* Session Management *//
    async getUserSessions(userId: string) {
    return this.tokenService.getUserSessions(userId);
  }
  async revokeSession(userId: string, tokenId: string) {
    return this.tokenService.revokeSession(userId, tokenId);
  }

  //* OTP Management */
  public async verifyEmail(email: string, otp: string) {
    const verified = await this.emailVerification.verify(email, otp);
    if (!verified) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.userService.updateStatus(email, UserStatus.ACTIVE);
    return { message: 'Email verified successfully' };
  }
  // resend OTP
   resendOtp(email: string) {
    return this.emailVerification.resendOtp(email);
  }

  // Revoke all sessions
  async revokeAllSessions(userId: string) {
    return this.tokenService.revokeAllSessions(userId);
  }

}

