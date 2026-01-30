import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AccountStatusService } from './account-status/account-status.service';
import { CredentialService } from './credentials/credential.service';
import { EmailVerificationService } from './verification/email-verification.service';
import { OtpService } from './verification/otp.service';
import { EmailService } from 'src/infrastructure/email/email.service';
import { OtpRepository } from './verification/repositories/otp.repository';
import { AttemptPolicy } from './verification/policies/attempt.policy';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailModule } from 'src/infrastructure/email/email.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    JwtModule,
    PassportModule,
    UsersModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AccountStatusService,
    CredentialService,
    EmailVerificationService,
    OtpService,
    OtpRepository,
    AttemptPolicy,
  ],
})
export class AuthModule {}
