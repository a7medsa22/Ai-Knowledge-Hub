import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatusService } from './account-status/account-status.service';
import { CredentialService } from './credentials/credential.service';
import { EmailVerificationService } from './verification/email-verification.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../common/enums/user-role.enum';
import { UserStatus } from '../common/enums/user-status.enum';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let credentialService: CredentialService;
  let emailVerification: EmailVerificationService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    password: 'hashedPassword',
    phone: null,
    isActive: true,
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    rejectionReason: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(() => 'signed-token') },
        },
        {
          provide: UsersService,
          useValue: { updateStatus: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => (key.includes('EXPIRES') ? '15m' : 'secret')),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { update: jest.fn(), findUnique: jest.fn(() => mockUser) },
            authToken: {
              create: jest.fn(),
              findFirst: jest.fn(() => ({
                id: 'token-1',
                token: 'hashed',
                expiresAt: new Date(Date.now() + 10000),
                isRevoked: false,
              })),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AccountStatusService,
          useValue: { ensureCanLogin: jest.fn() },
        },
        {
          provide: CredentialService,
          useValue: {
            createUser: jest.fn(() => mockUser),
            validateUser: jest.fn(() => mockUser),
          },
        },
        {
          provide: EmailVerificationService,
          useValue: { sendOtp: jest.fn(), verify: jest.fn(() => true) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    credentialService = module.get<CredentialService>(CredentialService);
    emailVerification = module.get<EmailVerificationService>(
      EmailVerificationService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a user and send OTP', async () => {
      const result = await service.register({
        email: 'test@example.com',
        password: '123456',
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
      });
      expect(credentialService.createUser).toHaveBeenCalled();
      expect(emailVerification.sendOtp).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userId');
    });
  });

  describe('verifyEmail', () => {
    it('should verify OTP and update status', async () => {
      const result = await service.verifyEmail('test@example.com', '123456');
      expect(emailVerification.verify).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
      );
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should throw BadRequestException if OTP invalid', async () => {
      jest.spyOn(emailVerification, 'verify').mockResolvedValueOnce(false);
      await expect(
        service.verifyEmail('test@example.com', '0000'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      const result = await service.login(mockUser as any);
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(prisma.authToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not active', async () => {
      const inactiveUser = {
        ...mockUser,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
      } as any;
      await expect(service.login(inactiveUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate refresh token successfully', async () => {
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValueOnce(true);
      const result = await service.validateRefreshToken(
        'user-123',
        'any-token',
      );
      expect(result).toEqual({ userId: 'user-123' });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValueOnce(false);
      await expect(
        service.validateRefreshToken('user-123', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user info for valid userId', async () => {
      const result = await service.validateJwtPayload('user-123');
      expect(result).toHaveProperty('id', 'user-123');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        ...mockUser,
        status: 'PENDING_EMAIL_VERIFICATION',
      });
      await expect(service.validateJwtPayload('user-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
