import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { UserEntity } from 'src/users/entities/user.entity';

Injectable();
export class AccountStatusService {
  /** Check if user can log in */
  async ensureCanLogin(user: UserEntity) {
    switch (user.status) {
      case UserStatus.PENDING_EMAIL_VERIFICATION:
        throw new UnauthorizedException(
          'Please verify your email before logging in.',
        );
      case UserStatus.INACTIVE:
        throw new UnauthorizedException(
          'Your account is inactive. Please contact support.',
        );
      case UserStatus.SUSPENDED:
        throw new UnauthorizedException(
          'Your account has been suspended. Please contact support.',
        );
      case UserStatus.ACTIVE:
        return;
    }
  }

  ensureCanVerifyEmail(user: UserEntity) {
    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new UnauthorizedException(
        'Email verification is not required for this account.',
      );
    }
  }

  activateAccount(user: UserEntity): Partial<UserEntity> {
    return {
      status: UserStatus.ACTIVE,
      isActive: true,
      approvedAt: new Date(),
    };
  }
}
