import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmailVerificationOtp(email: string, firstName: string, otp: string): Promise<void> {
    try {
      const today = new Date().getFullYear();
      await this.mailerService.sendMail({
        to: email,
        subject: 'Ai-Research - Email Verification Code',
        template: 'email-verification',
        context: { firstName, otp, today },
      });
      this.logger.log(`Email verification OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email verification OTP to ${email}`, error);
      throw error;
    }
  }


  async sendPasswordResetOtp(email: string, firstName: string, otp: string): Promise<void> {
    try {
      const today = new Date().getFullYear();
      await this.mailerService.sendMail({
        to: email,
        subject: '🔑 Ai-Research - Password Reset Code',
        template: 'email-passwordreset',
        context: { firstName, otp, today },
      });
      this.logger.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP to ${email}`, error);
      throw error;
    }
  }
}
