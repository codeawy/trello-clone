import {
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

export class CheckIfUserNotFound implements CanActivate {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.authorization.split(' ')[1];
    console.log(token);
    const decode = this.jwtService.verify(token);
    const user = await this.usersRepository.findOne({
      where: { id: decode.sub },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return true;
  }
}
