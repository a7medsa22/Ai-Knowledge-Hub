import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { SrvRecord } from 'dns';
import { DeviceInfoDto } from 'src/auth/dto/auth.dto';

import { JwtPayload } from 'src/auth/interfaces/jwt-payload';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { parseDurationToSeconds } from 'src/common/utils/duration.util';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Refresh Token and Rotate
   */
  public async refreshToken(userId: string, tokenId: string) {
    const tokenRecord = await this.prisma.authToken.findUnique({
      where: { id: tokenId },
    });

    if (!tokenRecord || tokenRecord.authorId !== userId || tokenRecord.isRevoked) {
      throw new UnauthorizedException('Invalid or rotated token');
    }

    // Revoke old token
    await this.prisma.authToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = await this.generateAccessToken(payload);

    // Preserve device info during rotation
    const deviceInfo: DeviceInfoDto = {
      userAgent: tokenRecord.userAgent || undefined,
      deviceName: tokenRecord.deviceName || undefined,
      ipAddress: tokenRecord.ipAddress || undefined,
    };

    const refreshToken = await this.generateRefreshToken(user.id, deviceInfo);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseDurationToSeconds(this.configService.get<string>('JWT_EXPIRES_IN', '900')),
    };
  }
  /** Generate access token */
  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }
  // Generate refresh token and store its hash in the database
  async generateRefreshToken(
    authorId: string,
    deviceInfo?: DeviceInfoDto,
  ): Promise<string> {
    const tokenId = crypto.randomUUID();
    const refreshToken = this.jwtService.sign(
      { sub: authorId, tokenId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    const hash = await bcrypt.hash(refreshToken, 10);

    // Calculate expiration date
    const expiresInStr = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const days = parseInt(expiresInStr) || 7;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days);

    await this.prisma.authToken.create({
      data: {
        id: tokenId,
        authorId,
        token: hash,
        type: TokenType.REFRESH,
        expiresAt,
        ...deviceInfo,
      },
    });

    return refreshToken;
  }

  /**
   * Validate refresh token
   */
  public async validateRefreshToken(userId: string, tokenId: string): Promise<boolean> {
    const tokenRecord = await this.prisma.authToken.findUnique({
      where: { id: tokenId },
    });

    if (
      !tokenRecord ||
      tokenRecord.authorId !== userId ||
      tokenRecord.type !== TokenType.REFRESH ||
      tokenRecord.isRevoked ||
      tokenRecord.expiresAt < new Date()
    ) {
      return false;
    }
    return true;
  }

  /**
   * Validate refresh token & rotate it
   */
  public async validateAndRotateRefreshToken(
    userId: string,
    tokenId: string,
  ) {
    const tokenRecord = await this.prisma.authToken.findUnique({
      where: { id: tokenId },
    });

    if (
      !tokenRecord ||
      tokenRecord.authorId !== userId ||
      tokenRecord.type !== TokenType.REFRESH ||
      tokenRecord.isRevoked ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.authToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    return {
      userId,
      tokenId: tokenRecord.id,
    };
  }

  /** Validate JWT payload */
  public async validateAndGetUserFromJwt(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
  // Get active sessions for a user
  async getUserSessions(authorId: string) {
    return this.prisma.authToken.findMany({
      where: {
        authorId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceName: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
      },
    });
  }

  /**
   * Revoke refresh tokens for user 
   */

  // Revoke a specific session
  async revokeSession(authorId: string, tokenId: string) {
    await this.prisma.authToken.updateMany({
      where: {
        id: tokenId,
        authorId,
      },
      data: { isRevoked: true },
    });
    return { message: 'Session revoked successfully' };
  }

  public async revokeAllSessions(authorId: string) {
    await this.prisma.authToken.updateMany({
      where: {
        authorId,
        type: TokenType.REFRESH,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
  }
}
