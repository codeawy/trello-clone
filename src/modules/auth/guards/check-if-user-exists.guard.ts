import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CheckIfUserExists implements CanActivate {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { email } = request.body;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    return true;
  }
}
