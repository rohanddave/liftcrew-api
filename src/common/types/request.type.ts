import { User } from 'src/features/users/entities/user.entity';

export interface RequestWithToken extends Request {
  token: string;
}

export interface RequestWithUser extends Request {
  user?: User | null;
}

export interface RequestWithEmail extends Request {
  email: string;
}

export interface RequestWithTokenAndEmail extends Request {
  token: string;
  email: string;
}
