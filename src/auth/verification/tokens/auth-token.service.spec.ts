import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthTokenService } from './token.service';

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
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
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

    jest.spyOn(prisma.authToken, 'create').mockResolvedValue({
      id: 'token-id',
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
    const hashed = await bcrypt.hash('token', 10);

    jest.spyOn(prisma.authToken, 'findFirst').mockResolvedValue({
      id: 'token-id',
      token: hashed,
      expiresAt: new Date(Date.now() + 10000),
    } as any);

    jest.spyOn(prisma.authToken, 'update').mockResolvedValue({} as any);

    const result = await service.validateAndRotateRefreshToken(
      'user-id',
      'token',
    );

    expect(result.userId).toBe('user-id');
    expect(prisma.authToken.update).toHaveBeenCalled();
  });

  it('should throw if refresh token invalid', async () => {
    jest.spyOn(prisma.authToken, 'findFirst').mockResolvedValue(null);

    await expect(
      service.validateAndRotateRefreshToken('user-id', 'bad-token'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
