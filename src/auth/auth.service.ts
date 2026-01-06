import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthResponse } from './interfaces/auth-response.interface';
import { AccountStatusService } from './account-status/account-status.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { CredentialService } from './credentials/credential.service';
import { days } from '@nestjs/throttler';
import { EmailVerificationService } from './verification/email-verification.service';

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
  ) { }

  public async register(dto: RegisterDto) {
    const user = await this.credentialService.createUser(dto);

    await this.emailVerification.sendOtp(user.email);

    return {
      message: 'User registered successfully, please verify your email',
      userId: user.id,
    };
  }

  async verifyEmail(email: string, otp: string) {
    await this.emailVerification.verify(email, otp);

    await this.userService.updateStatus(email, UserStatus.ACTIVE);

    return { message: 'Email verified successfully' };
  }

  async login(user: UserEntity): Promise<AuthResponse> {
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.accountStatusService.ensureCanLogin(user);

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    const accessToken = await this.generateAccessToken(payload);

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
      refreshToken: 'face-refresh',
      expiresIn: Number(this.configService.get('JWT_EXPIRES_IN')),
    };
  }

  async validateRefreshToken(userId: string, tokenId: string) {
    const token = await this.prisma.authToken.findUnique({
      where: { id: tokenId },
    });
    if (!token || token.isRevoked || token.expiresAt < new Date()) {
      throw new UnauthorizedException('invalid refresh token');
    }

    return {
      userId,
      tokenId,
    };
  }

  async validateJwtPayload(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found or inactive');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });
  }
  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

   validateUser(email: string, password: string): Promise<any> {
   return this.credentialService.validateUser(email, password);
}

}
