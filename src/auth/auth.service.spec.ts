import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CredentialService } from './credentials/credential.service';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { EmailVerificationService } from './verification/email-verification.service';
import { UsersService } from 'src/users/users.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthService - Register & VerifyEmail', () => {
  let service: AuthService;
  let credentialService: CredentialService;
  let emailVerification: EmailVerificationService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CredentialService,
          useValue: {
            createUser: jest.fn(),
            validateUser: jest.fn(),
          },
        },
        {
          provide: EmailVerificationService,
          useValue: {
            sendOtp: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            updateStatus: jest.fn(),
          },
        },
        // Mock other dependencies but we won't use them here
        { provide: 'AuthTokenService', useValue: {} },
        { provide: 'JwtService', useValue: {} },
        { provide: 'ConfigService', useValue: { get: jest.fn() } },
        { provide: 'AccountStatusService', useValue: { ensureCanLogin: jest.fn() } },
        { provide: 'PrismaService', useValue: {} },
      ],
    }).compile();

    service = module.get(AuthService);
    credentialService = module.get(CredentialService);
    emailVerification = module.get(EmailVerificationService);
    usersService = module.get(UsersService);
  });

  it('should register a user and send OTP', async () => {
    const mockUser = { id: 'user-id', email: 'test@test.com' };
    (credentialService.createUser as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.register({ email: 'test@test.com', password: '123', status: UserStatus.PENDING_EMAIL_VERIFICATION });

    expect(result.userId).toBe('user-id');
    expect(result.message).toBe('User registered successfully, please verify your email');
    expect(emailVerification.sendOtp).toHaveBeenCalledWith('test@test.com');
  });

  it('should verify email successfully', async () => {
    (emailVerification.verify as jest.Mock).mockResolvedValue(true);

    const result = await service.verifyEmail('test@test.com', '123456');

    expect(result.message).toBe('Email verified successfully');
    expect(usersService.updateStatus).toHaveBeenCalledWith('test@test.com', UserStatus.ACTIVE);
  });

  it('should throw BadRequestException for invalid OTP', async () => {
    (emailVerification.verify as jest.Mock).mockResolvedValue(false);

    await expect(service.verifyEmail('test@test.com', 'wrong-otp')).rejects.toThrow(BadRequestException);
  });
});
