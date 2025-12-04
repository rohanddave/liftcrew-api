import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor() {}

  logout(user: User) {
    // Implement logout logic if needed (e.g., token revocation)
  }
}
