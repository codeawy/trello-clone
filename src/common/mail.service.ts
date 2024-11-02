import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { envVariables } from 'src/constants/env-variables';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>(envVariables.EMAIL_HOST),
      port: this.configService.get<number>(envVariables.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>(envVariables.EMAIL_USER),
        pass: this.configService.get<string>(envVariables.EMAIL_PASS),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${this.configService.get<string>(envVariables.CLIENT_URL)}/verify?token=${token}`;
    const mailOptions = {
      from: this.configService.get<string>(envVariables.EMAIL_USER),
      to,
      subject: 'Verify your email',
      html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${this.configService.get<string>(envVariables.CLIENT_URL)}/reset-password?token=${token}`;
    const mailOptions = {
      from: this.configService.get<string>(envVariables.EMAIL_USER),
      to,
      subject: 'Password Reset',
      html: `<p>You can reset your password by clicking <a href="${resetUrl}">here</a>.</p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
