import { Injectable, BadRequestException } from '@nestjs/common';
import { OtpRepository } from '../repositories/otp.repository';

@Injectable()
export class AttemptPolicy {
  private readonly MAX_ATTEMPTS = 5;

  constructor(private readonly otpRepository: OtpRepository) {}

  async check(email: string): Promise<void> {
    const attempts = await this.otpRepository.getAttempts(email);
    
    if (attempts >= this.MAX_ATTEMPTS) {
      throw new BadRequestException('Max attempts reached. Please try again later.');
    }
  }

  async increment(email: string): Promise<void> {
    await this.otpRepository.incrementAttempts(email);
  }

  async reset(email: string): Promise<void> {
    await this.otpRepository.clearAttempts(email);
  }
}