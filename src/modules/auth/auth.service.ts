import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto, RegisterDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(body: RegisterDto) {
    const user = this.usersRepository.create(body);
    // ** TODO:Send email to user with verification code
    return this.usersRepository.save(user);
  }

  async login(body: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: body.email },
    });

    const isPasswordValid = await user.comparePassword(body.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // ** Check if user is verified
    // ** return jwt token with user credentials
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const { firstName, lastName, email } = user;
    return { firstName, lastName, email, accessToken };
  }
}
