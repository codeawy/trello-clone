import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Verify your email',
      html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Password Reset',
      html: `<p>You can reset your password by clicking <a href="${resetUrl}">here</a>.</p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
