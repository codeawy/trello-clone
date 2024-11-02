import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
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

  async sendVerificationEmail(to: string, code: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Verify your email',
      html: `<p>Your verification code is: <strong>${code}</strong></p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
