import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ForgotPasswordDto, RegisterDto, ResetPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload';
import { AuthResponse } from './interfaces/auth-response.interface';
import { AccountStatusService } from './account-status/account-status.service';
import { UserEntity } from './../users/entities/user.entity';
import { UserStatus } from '../common/enums/user-status.enum';
import { CredentialService } from './credentials/credential.service';
import { EmailVerificationService } from './verification/email-verification.service';
import { AuthTokenService } from './verification/tokens/token.service';
import { Request } from 'express';
import { parseDurationToSeconds } from 'src/common/utils/duration.util';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly configService: ConfigService,
        private readonly accountStatusService: AccountStatusService,
        private readonly credentialService: CredentialService,
        private readonly emailVerification: EmailVerificationService,
        private readonly tokenService: AuthTokenService,
    ) { }

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
    public async login(user: UserEntity, req: Request): Promise<AuthResponse> {
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

        const refreshToken = await this.tokenService.generateRefreshToken(user.id, deviceInfo);

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
            expiresIn: parseDurationToSeconds(this.configService.get<string>('JWT_EXPIRES_IN') ?? '900'),
        };
    }
    /** Validate user credentials */
    public async validateUser(email: string, pass: string) {
        return this.credentialService.validateUser(email, pass);
    }

    /** Validate refresh token */
    public async validateRefreshToken(userId: string, tokenId: string) {
        const isValid = await this.tokenService.validateRefreshToken(userId, tokenId);
        if (!isValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        return { userId, tokenId };
    }

    /** Refresh access token using refresh token */
    public async refreshTokens(userId: string, tokenId: string) {
        return this.tokenService.refreshToken(userId, tokenId);
    }

    /** Validate JWT payload */
    public async validateJwtPayload(userId: string) {
        return this.tokenService.validateAndGetUserFromJwt(userId);
    }

    //* Session Management *//
    /** Get all active sessions for a user */
    async getUserSessions(userId: string) {
        return this.tokenService.getUserSessions(userId);
    }
    async revokeSession(userId: string, tokenId: string) {
        return this.tokenService.revokeSession(userId, tokenId);
    }

    //* OTP Management */
    public async verifyEmail(dto: VerifyEmailDto) {
        const { email, otp } = dto;
        const verified = await this.emailVerification.verify(email, otp);
        if (!verified) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        await this.userService.updateStatus(email, UserStatus.ACTIVE);
        return { message: 'Email verified successfully, please login' };
    }

    /** Reset user password using OTP */
    async resetPassword(dto: ResetPasswordDto) {
        const { email, otp, newPassword } = dto;
        const verified = await this.emailVerification.verify(email, otp);
        if (!verified) {
            throw new BadRequestException('Invalid or expired OTP');
        }
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.credentialService.updatePassword(user.id, newPassword);
        return { message: 'Password reset successfully, please login' };
    }

    /** Resend OTP for email verification */
    async resendOtp(email: string) {
        return this.emailVerification.resendOtp(email);
    }
    /** Revoke all active sessions for a user */
    async revokeAllSessions(userId: string) {
        return this.tokenService.revokeAllSessions(userId);
    }

    /** Logout - revoke specific session */
    async logout(userId: string, tokenId: string) {
        return this.tokenService.revokeSession(userId, tokenId);
    }
    /** Forgot password - send reset OTP */
    /** Send OTP for password reset */
    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.emailVerification.sendResetPasswordOtp(user.email);
        return { message: `OTP sent to email ${user.email}` };
    }
}

