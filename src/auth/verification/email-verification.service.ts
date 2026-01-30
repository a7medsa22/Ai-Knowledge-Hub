// verification/email-verification.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { OtpService } from './otp.service';
import { EmailService } from 'src/infrastructure/email/email.service';
import { UsersService } from 'src/users/users.service';

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

  async verify(email: string, otp: string): Promise<boolean> {
    const isValid = await this.otpService.verify(email, otp);

    if (!isValid) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    return true;
  }
}
