import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { UserStatus } from '../common/enums/user-status.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    refreshTokens: jest.fn(),
    getUserSessions: jest.fn(),
    revokeSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const result = {
        userId: 'uuid-123',
        message: 'User registered. Please verify your email.',
      };

      mockAuthService.register.mockResolvedValue(result);

      const response = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(response).toEqual({
        success: true,
        message: 'User registered successfully, please verify your email',
        data: { userId: result.userId },
      });
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const req = {
        user: {
          id: 'uuid-123',
          email: 'test@example.com',
          role: 'USER',
          status: UserStatus.ACTIVE,
        },
        headers: {
          'user-agent': 'jest-test',
        },
        ip: '127.0.0.1'
      };

      const serviceResult = {
        user: {
          sub: 'uuid-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
          status: UserStatus.ACTIVE,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      mockAuthService.login.mockResolvedValue(serviceResult);

      const response = await controller.login(req);

      expect(authService.login).toHaveBeenCalledWith(req.user, req);
      expect(response).toEqual({
        success: true,
        message: 'Login successful',
        data: serviceResult,
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with OTP', async () => {
      const body = { email: 'test@example.com', otp: '123456' };
      mockAuthService.verifyEmail.mockResolvedValue({ message: 'Email verified successfully' });

      const response = await controller.verifyEmail(body);

      expect(authService.verifyEmail).toHaveBeenCalledWith(body.email, body.otp);
      expect(response).toEqual({
        success: true,
        message: 'Email verified successfully',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const req = {
        user: {
          userId: 'uuid-123',
          tokenId: 'token-uuid',
        },
      };
      const result = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(result);

      const response = await controller.refreshToken(req);

      expect(authService.refreshTokens).toHaveBeenCalledWith(req.user.userId, req.user.tokenId);
      expect(response).toEqual(result);
    });
  });

  describe('sessions', () => {
    it('should return user sessions', async () => {
      const userId = 'uuid-123';
      const sessions = [
        { id: '1', createdAt: new Date(), lastActiveAt: new Date() },
      ];

      mockAuthService.getUserSessions.mockResolvedValue(sessions);

      const response = await controller.sessions(userId);

      expect(authService.getUserSessions).toHaveBeenCalledWith(userId);
      expect(response).toEqual(sessions);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      const userId = 'uuid-123';
      const tokenId = 'token-uuid';

      mockAuthService.revokeSession.mockResolvedValue(undefined);

      const response = await controller.revokeSession(tokenId, userId);

      expect(authService.revokeSession).toHaveBeenCalledWith(userId, tokenId);
      expect(response).toBeUndefined();
    });
  });
});
