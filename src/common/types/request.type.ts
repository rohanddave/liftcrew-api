import { User } from 'src/features/users/entities/user.entity';

export interface RequestWithToken extends Request {
  token: string;
}

export interface RequestWithUser extends Request {
  user: User;
}
