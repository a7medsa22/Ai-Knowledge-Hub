import { UserRole } from 'src/common/enums/user-role.enum';
import { UserStatus } from 'src/common/enums/user-status.enum';

export class UserEntity {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;

  isActive: boolean;
  status: UserStatus;
  approvedAt: Date | null;
  createdAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  canUpdateProfile(): boolean {
    return this.status === UserStatus.ACTIVE && this.isActive;
  }

  requiresApproval(): boolean {
    return this.status === UserStatus.PENDING_EMAIL_VERIFICATION;
  }
}
