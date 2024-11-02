import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../common/mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(body: RegisterDto) {
    const user = this.usersRepository.create(body);
    const savedUser = await this.usersRepository.save(user);
    await this.mailService.sendVerificationEmail(
      savedUser.email,
      savedUser.verificationCode,
    );
    return {
      message:
        'User registered successfully. Please check your email for the verification code.',
    };
  }

  async verifyEmail(body: VerifyEmailDto) {
    const user = await this.usersRepository.findOne({
      where: { email: body.email, verificationCode: body.code },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid verification code');
    }
    user.isVerified = true;
    user.verificationCode = null;
    await this.usersRepository.save(user);
    return { message: 'Email verified successfully' };
  }

  async login(body: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: body.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(body.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const { firstName, lastName, email } = user;
    return { firstName, lastName, email, accessToken };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    await this.usersRepository.save(user);

    await this.mailService.sendVerificationEmail(
      user.email,
      user.verificationCode,
    );

    return { message: 'Verification code sent to your email' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersRepository.findOne({
      where: { verificationCode: token },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.verificationCode = null;
    await this.usersRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);

    return { message: 'Password changed successfully' };
  }
}
