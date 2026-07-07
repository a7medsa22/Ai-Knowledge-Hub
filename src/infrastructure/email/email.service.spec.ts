import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailVerificationOtp', () => {
    it('should call mailerService.sendMail', async () => {
      mockMailerService.sendMail.mockResolvedValue({});
      await service.sendEmailVerificationOtp('test@test.com', 'John', '123456');
      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });
  });
});
