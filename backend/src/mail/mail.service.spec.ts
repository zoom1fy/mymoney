import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  let service: MailService;
  let mockConfig: Record<string, string>;
  let mockTransporter: { sendMail: jest.Mock };

  const createService = async (config: Record<string, string>) => {
    mockConfig = config;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => mockConfig[key]) },
        },
      ],
    }).compile();
    return module.get<MailService>(MailService);
  };

  beforeEach(() => {
    mockTransporter = { sendMail: jest.fn().mockResolvedValue(undefined) };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    (nodemailer.createTransport as jest.Mock).mockClear();
    jest.restoreAllMocks();
  });

  describe('constructor — SMTP transport', () => {
    it('creates a transporter when SMTP_HOST, SMTP_USER and SMTP_PASS are set', async () => {
      await createService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
      });
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          auth: { user: 'user', pass: 'pass' },
        })
      );
    });

    it('defaults to port 587 when SMTP_PORT is not set and SSL is false', async () => {
      await createService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_SSL: 'false',
      });
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 587 })
      );
    });

    it('uses port 465 when SMTP_SSL is true', async () => {
      await createService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_SSL: 'true',
      });
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 465, secure: true })
      );
    });

    it('uses custom SMTP_PORT when provided (as string)', async () => {
      await createService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_PORT: '2525',
      });
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: '2525' })
      );
    });

    it('does not create a transporter when SMTP config is missing', async () => {
      await createService({});
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('sendVerificationCode', () => {
    it('sends email with verification code via transporter', async () => {
      service = await createService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
      });
      await service.sendVerificationCode('test@test.com', '123456');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'test@test.com',
        subject: 'Подтверждение регистрации — MyMoney',
        text: expect.stringContaining('123456'),
      });
    });

    it('logs to console when transporter is not configured', async () => {
      service = await createService({});
      const logSpy = jest.spyOn(service['logger'], 'log');
      await service.sendVerificationCode('test@test.com', '123456');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV] Email to test@test.com'));
    });

    it('falls back to console log when sendMail fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Connection refused'));
      service = await createService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
      });
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      const logSpy = jest.spyOn(service['logger'], 'log');
      await service.sendVerificationCode('test@test.com', '123456');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send email'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[FALLBACK]'));
    });
  });

  describe('sendPasswordResetCode', () => {
    it('sends email with password reset code', async () => {
      service = await createService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
      });
      await service.sendPasswordResetCode('test@test.com', '654321');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'test@test.com',
        subject: 'Восстановление пароля — MyMoney',
        text: expect.stringContaining('654321'),
      });
    });
  });
});
