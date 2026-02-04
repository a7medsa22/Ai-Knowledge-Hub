import { BadRequestException, Injectable } from '@nestjs/common';
import { OtpRepository } from './repositories/otp.repository';
import { AttemptPolicy } from './policies/attempt.policy';
import * as crypto from 'crypto';
@Injectable()
export class OtpService {
  constructor(
    private readonly otpRepo: OtpRepository,
    private readonly attemptPolicy: AttemptPolicy,
  ) {}
  async generate(email: string) {
    const otp = crypto.randomInt(100000, 999999).toString();
    await this.otpRepo.save(email, otp);
    return otp;
  }

  async verify(email: string, otp: string) {
    await this.attemptPolicy.check(email);

    const storedOtp = await this.otpRepo.find(email);
    if (storedOtp !== otp) {
      await this.attemptPolicy.increment(email);
      throw new BadRequestException('Invalid OTP');
    }
    await this.otpRepo.delete(email);
    await this.attemptPolicy.reset(email);

    return true;
  }
    async resendOtp(email: string) {
    await this.attemptPolicy.check(email);
    const storedOtp = await this.otpRepo.find(email);
    return storedOtp ? storedOtp : await this.generate(email);
  }
}
