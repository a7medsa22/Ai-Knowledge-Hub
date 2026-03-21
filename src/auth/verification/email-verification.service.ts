// verification/email-verification.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OtpService } from './otp.service';
import { EmailService } from 'src/infrastructure/email/email.service';
import { UsersService } from 'src/users/users.service';
import { UserStatus } from 'src/common/enums/user-status.enum';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly otpService: OtpService,
    private readonly mailerService: EmailService,
    private readonly userService: UsersService,
  ) {}

  async sendOtp(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.otpService.generate(email);

    await this.mailerService.sendEmailVerificationOtp(email, user.name, otp);
  }

  async sendResetPasswordOtp(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.otpService.generate(email);

    await this.mailerService.sendPasswordResetOtp(email, user.name, otp);
  }

  async verify(email: string, otp: string): Promise<boolean> {
    const isValid = await this.otpService.verify(email, otp);

    if (!isValid) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    return true;
  }
  async resendOtp(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
      const otp = await this.otpService.resendOtp(email);
      await this.mailerService.sendEmailVerificationOtp(email, user.name, otp);
      return { message: 'Verification OTP sent successfully' };
    }

    if (user.status === UserStatus.ACTIVE) {
      const otp = await this.otpService.resendOtp(email);
      await this.mailerService.sendPasswordResetOtp(email, user.name, otp);
      return { message: 'Password reset OTP sent successfully' };
    }

    throw new BadRequestException(
      'Account is not in a state that allows resending OTPs',
    );
  }
}
