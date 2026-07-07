import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthTokenService } from './token.service';
import { TokenType, UserRole } from '@prisma/client';
import { UserStatus } from 'src/common/enums/user-status.enum';

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenService,
        {
          provide: PrismaService,
          useValue: {
            authToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_REFRESH_EXPIRES_MS') return 1000 * 60 * 60 * 24;
              return 'secret';
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthTokenService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
  });

  it('should create refresh token', async () => {
    jest.spyOn(jwt, 'signAsync').mockResolvedValue('refresh.jwt');
    jest.spyOn(jwt, 'sign').mockReturnValue('refresh.jwt');

    jest.spyOn(prisma.authToken, 'findUnique').mockResolvedValue({
      id: 'token-id',
      authorId: 'user-id',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 10000),
    } as any);

    jest.spyOn(prisma.authToken, 'update').mockResolvedValue({} as any);

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-id',
      status: UserStatus.ACTIVE,
      email: 'test@test.com',
      role: UserRole.USER,
    } as any);

    jest.spyOn(prisma.authToken, 'create').mockResolvedValue({
      id: 'new-token-id',
      expiresAt: new Date(),
    } as any);

    const user: any = {
      id: 'user-id',
      email: 'test@test.com',
      role: 'USER',
      status: 'ACTIVE',
    };

    const result = await service.refreshToken(user.id, 'old-refresh-token');

    expect(result.refreshToken).toBe('refresh.jwt');
    expect(prisma.authToken.create).toHaveBeenCalled();
  });

  it('should validate and rotate refresh token', async () => {
    jest.spyOn(prisma.authToken, 'findUnique').mockResolvedValue({
      id: 'token-id',
      authorId: 'user-id',
      type: TokenType.REFRESH,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 10000),
    } as any);

    jest.spyOn(prisma.authToken, 'update').mockResolvedValue({} as any);

    const result = await service.validateAndRotateRefreshToken(
      'user-id',
      'token-id',
    );

    expect(result.userId).toBe('user-id');
    expect(prisma.authToken.update).toHaveBeenCalled();
  });

  it('should throw if refresh token invalid', async () => {
    jest.spyOn(prisma.authToken, 'findUnique').mockResolvedValue(null);

    await expect(
      service.validateAndRotateRefreshToken('user-id', 'bad-token'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
