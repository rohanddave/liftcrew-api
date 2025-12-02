import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(credentials: any) {
    return {
      access_token: 'mock-jwt-token',
      user: { id: '1', email: credentials.email },
    };
  }

  register(registerDto: any) {
    return {
      id: '1',
      email: registerDto.email,
      message: 'User registered successfully',
    };
  }

  validateUser(email: string, password: string) {
    return { id: '1', email };
  }

  refreshToken(token: string) {
    return {
      access_token: 'new-mock-jwt-token',
    };
  }
}
