import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto, RegisterDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';
import { MailService } from 'src/common/mail.service';
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
      savedUser.verificationToken,
    );
    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepository.findOne({
      where: { verificationToken: token },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }
    user.isVerified = true;
    user.verificationToken = null;
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
      // To prevent email enumeration, respond with success even if user doesn't exist
      return {
        message:
          'If that email address is in our system, we have sent a password reset link.',
      };
    }

    user.passwordResetToken = uuidv4();
    user.passwordResetExpires = addHours(new Date(), 1); // Token valid for 1 hour
    await this.usersRepository.save(user);

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.passwordResetToken,
    );
    return {
      message:
        'If that email address is in our system, we have sent a password reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepository.save(user);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = newPassword;
    await this.usersRepository.save(user);
    return { message: 'Password changed successfully' };
  }
}
