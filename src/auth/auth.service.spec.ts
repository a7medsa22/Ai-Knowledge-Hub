import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CredentialService } from './credentials/credential.service';
import { EmailVerificationService } from './verification/email-verification.service';
import { UsersService } from 'src/users/users.service';
import { AuthTokenService } from './verification/tokens/token.service';
import { AccountStatusService } from './account-status/account-status.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UserStatus } from '../common/enums/user-status.enum';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

describe('AuthService', () => {
  let service: AuthService;
  let credentialService: CredentialService;
  let emailVerification: EmailVerificationService;
  let usersService: UsersService;
  let tokenService: AuthTokenService;
  let accountStatusService: AccountStatusService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CredentialService,
          useValue: {
            createUser: jest.fn(),
            validateUser: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: EmailVerificationService,
          useValue: {
            sendOtp: jest.fn(),
            verify: jest.fn(),
            sendResetPasswordOtp: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            update: jest.fn(),
            updateLastActivity: jest.fn(),
          },
        },
        {
          provide: AuthTokenService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn(),
            refreshToken: jest.fn(),
            validateAndGetUserFromJwt: jest.fn(),
            getUserSessions: jest.fn(),
            revokeSession: jest.fn(),
            revokeAllSessions: jest.fn(),
          },
        },
        {
          provide: AccountStatusService,
          useValue: {
            ensureCanLogin: jest.fn(),
            activateAccount: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('900'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    credentialService = module.get<CredentialService>(CredentialService);
    emailVerification = module.get<EmailVerificationService>(EmailVerificationService);
    usersService = module.get<UsersService>(UsersService);
    tokenService = module.get<AuthTokenService>(AuthTokenService);
    accountStatusService = module.get<AccountStatusService>(AccountStatusService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('register', () => {
    it('should register a user and send OTP', async () => {
      const mockUser = { id: 'user-id', email: 'test@test.com' };
      (credentialService.createUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@test.com',
        password: '123',
        name: 'Test User',
      });

      expect(result.userId).toBe('user-id');
      expect(result.message).toBe('User registered. Please verify your email.');
      expect(emailVerification.sendOtp).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('login', () => {
    it('should login user and generate tokens', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test User',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      } as any;

      const mockRequest = {
        headers: {
          'user-agent': 'Chrome',
          'x-device-name': 'My Laptop',
        },
        ip: '127.0.0.1',
      } as any as Request;

      (tokenService.generateAccessToken as jest.Mock).mockResolvedValue('access-token');
      (tokenService.generateRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      const result = await service.login(mockUser, mockRequest);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(accountStatusService.ensureCanLogin).toHaveBeenCalledWith(mockUser);
      expect(usersService.updateLastActivity).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@test.com' };
      (emailVerification.verify as jest.Mock).mockResolvedValue(true);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (accountStatusService.activateAccount as jest.Mock).mockReturnValue({ status: UserStatus.ACTIVE });

      const result = await service.verifyEmail({
        email: 'test@test.com',
        otp: '123456',
      });

      expect(result.message).toBe('Email verified successfully, please login');
      expect(usersService.update).toHaveBeenCalledWith('user-id', { status: UserStatus.ACTIVE });
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      (emailVerification.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.verifyEmail({ email: 'test@test.com', otp: 'wrong-otp' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      (emailVerification.verify as jest.Mock).mockResolvedValue(true);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyEmail({ email: 'test@test.com', otp: '123456' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password OTP', async () => {
      const mockUser = { id: 'user-id', email: 'test@test.com' };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.forgotPassword({ email: 'test@test.com' });

      expect(result.message).toBe('OTP sent to email test@test.com');
      expect(emailVerification.sendResetPasswordOtp).toHaveBeenCalledWith('test@test.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'test@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@test.com' };
      (emailVerification.verify as jest.Mock).mockResolvedValue(true);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.resetPassword({
        email: 'test@test.com',
        otp: '123456',
        newPassword: 'new-password',
      });

      expect(result.message).toBe('Password reset successfully, please login');
      expect(credentialService.updatePassword).toHaveBeenCalledWith('user-id', 'new-password');
    });
  });
});
