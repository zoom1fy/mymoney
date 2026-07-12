import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      const ssl = this.configService.get<string>('SMTP_SSL') === 'true';
      const tls = this.configService.get<string>('SMTP_TLS') === 'true';
      const effectivePort = port || (ssl ? 465 : 587);

      this.transporter = nodemailer.createTransport({
        host,
        port: effectivePort,
        secure: ssl || (effectivePort === 465 && !tls),
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console');
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const subject = 'Подтверждение регистрации — MyMoney';
    const text = `Ваш код подтверждения: ${code}\n\nКод действителен 15 минут.\n\nЕсли вы не регистрировались на MyMoney, проигнорируйте это письмо.`;

    await this.send(email, subject, text);
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = 'Восстановление пароля — MyMoney';
    const text = `Ваш код для восстановления пароля: ${code}\n\nКод действителен 15 минут.\n\nЕсли вы не запрашивали восстановление пароля, проигнорируйте это письмо.`;

    await this.send(email, subject, text);
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[DEV] Email to ${to}: ${subject} — ${text}`);
      return;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM');
      await this.transporter.sendMail({ from, to, subject, text });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.warn(`Failed to send email to ${to}: ${(err as Error).message}`);
      this.logger.log(`[FALLBACK] Email to ${to}: ${subject} — ${text}`);
    }
  }
}
