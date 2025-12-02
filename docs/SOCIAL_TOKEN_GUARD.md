# Social Token Guard

## Overview

The `SocialTokenGuard` is a NestJS guard that extracts and validates Bearer tokens from the Authorization header. It's designed to protect routes that require authentication tokens from social providers (Firebase, OAuth, etc.).

## Features

- ✅ Extracts Bearer token from Authorization header
- ✅ Validates token format
- ✅ Attaches token to request object for use in controllers
- ✅ Provides clear error messages for invalid tokens
- ✅ Case-insensitive Bearer scheme matching

## Usage

### Basic Usage

Apply the guard to a controller or route:

```typescript
import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SocialTokenGuard } from '../../common/guards';

@Controller('auth')
export class AuthController {
  @Post('exchange')
  @UseGuards(SocialTokenGuard)
  async exchangeToken(@Req() request: any) {
    // Token is available in request.socialToken
    const token = request.socialToken;
    return this.authService.exchangeFirebaseToken(token);
  }
}
```

### Apply to Entire Controller

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { SocialTokenGuard } from '../../common/guards';

@Controller('protected')
@UseGuards(SocialTokenGuard)
export class ProtectedController {
  // All routes in this controller require a Bearer token

  @Get('profile')
  getProfile(@Req() request: any) {
    const token = request.socialToken;
    // Use token...
  }
}
```

### Apply Globally

In your `main.ts`:

```typescript
import { SocialTokenGuard } from './common/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply guard globally to all routes
  app.useGlobalGuards(new SocialTokenGuard());

  await app.listen(3000);
}
```

### Using with Custom Decorator

Create a custom decorator to extract the token:

```typescript
// src/common/decorators/social-token.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SocialToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.socialToken;
  },
);
```

Then use it in your controller:

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { SocialTokenGuard } from '../../common/guards';
import { SocialToken } from '../../common/decorators/social-token.decorator';

@Controller('auth')
export class AuthController {
  @Post('exchange')
  @UseGuards(SocialTokenGuard)
  async exchangeToken(@SocialToken() token: string) {
    // Token is directly available as a parameter
    return this.authService.exchangeFirebaseToken(token);
  }
}
```

## Request Flow

1. **Client sends request with Authorization header:**
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

2. **Guard extracts and validates token:**
   - Checks if Authorization header exists
   - Validates Bearer scheme
   - Extracts token
   - Validates token is not empty

3. **Guard attaches token to request:**
   ```typescript
   request.socialToken = "eyJhbGciOiJIUzI1NiIs..."
   ```

4. **Guard returns true, allowing request to proceed**

5. **Controller accesses token:**
   ```typescript
   const token = request.socialToken;
   ```

## Error Handling

### Missing Authorization Header

**Request:**
```http
POST /auth/exchange
Content-Type: application/json
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Authorization header is required",
  "error": "Unauthorized"
}
```

### Invalid Format

**Request:**
```http
POST /auth/exchange
Authorization: InvalidFormat
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Authorization header must be in format: Bearer <token>",
  "error": "Unauthorized"
}
```

### Wrong Scheme

**Request:**
```http
POST /auth/exchange
Authorization: Basic abc123
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Authorization header must use Bearer scheme",
  "error": "Unauthorized"
}
```

### Empty Token

**Request:**
```http
POST /auth/exchange
Authorization: Bearer
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Token cannot be empty",
  "error": "Unauthorized"
}
```

## Testing

### Unit Tests

```typescript
import { SocialTokenGuard } from './social-token.guard';
import { ExecutionContext } from '@nestjs/common';

describe('SocialTokenGuard', () => {
  let guard: SocialTokenGuard;

  beforeEach(() => {
    guard = new SocialTokenGuard();
  });

  it('should extract and attach token', () => {
    const mockRequest = {
      headers: { authorization: 'Bearer test-token' }
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest
      })
    } as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockRequest['socialToken']).toBe('test-token');
  });
});
```

### Integration Tests

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('SocialTokenGuard Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      // Your module configuration
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should reject requests without token', () => {
    return request(app.getHttpServer())
      .post('/auth/exchange')
      .expect(401);
  });

  it('should accept requests with valid token', () => {
    return request(app.getHttpServer())
      .post('/auth/exchange')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
  });
});
```

## Best Practices

1. **Combine with Authentication Strategies**
   ```typescript
   @Post('exchange')
   @UseGuards(SocialTokenGuard, FirebaseAuthGuard)
   async exchangeToken(@SocialToken() token: string) {
     // Token is validated by both guards
   }
   ```

2. **Use with Role Guards**
   ```typescript
   @Post('admin')
   @UseGuards(SocialTokenGuard, RolesGuard)
   @Roles('admin')
   async adminAction(@SocialToken() token: string) {
     // Protected by both authentication and authorization
   }
   ```

3. **Custom Error Messages**
   ```typescript
   @Injectable()
   export class CustomSocialTokenGuard extends SocialTokenGuard {
     canActivate(context: ExecutionContext): boolean {
       try {
         return super.canActivate(context);
       } catch (error) {
         throw new UnauthorizedException('Please provide a valid social login token');
       }
     }
   }
   ```

## Related

- [Auth Utils](../src/common/utils/auth.utils.ts) - Token extraction utilities
- [Token Exchange Endpoint](./TOKEN_EXCHANGE.md) - Using the guard with Firebase token exchange
