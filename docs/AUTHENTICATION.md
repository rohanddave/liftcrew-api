# Authentication Flow

This document describes the complete authentication flow for the LiftCrew API, including token exchange, refresh, and usage patterns.

## Table of Contents

- [Overview](#overview)
- [Token Types](#token-types)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Environment Configuration](#environment-configuration)
- [Client Implementation Guide](#client-implementation-guide)
- [Postman Collection](#postman-collection)

## Overview

The LiftCrew API uses a dual-token authentication system:
1. **Access Tokens**: Short-lived tokens for API requests (7 days)
2. **Refresh Tokens**: Longer-lived tokens for obtaining new access tokens (14 days)

Authentication is handled through Firebase Authentication for initial user verification, then exchanged for application-specific JWT tokens.

## Token Types

| Token Type | Secret Key | Expiration | Storage | Purpose |
|------------|------------|------------|---------|---------|
| **Firebase ID Token** | Firebase Project Secret | 1 hour | Client | Initial authentication with Firebase |
| **Access Token** | `JWT_SECRET` | 7 days (604800s) | Client | Authenticate API requests |
| **Refresh Token** | `JWT_REFRESH_SECRET` | 14 days (1209600s) | Client + Database (hashed) | Obtain new access tokens |

## Authentication Flow

```
┌─────────┐                ┌──────────────┐                ┌─────────────┐
│ Client  │                │   Firebase   │                │ LiftCrew API│
└────┬────┘                └──────┬───────┘                └──────┬──────┘
     │                            │                               │
     │ 1. Sign In with Provider   │                               │
     ├───────────────────────────>│                               │
     │                            │                               │
     │ 2. Firebase ID Token       │                               │
     │<───────────────────────────┤                               │
     │                            │                               │
     │ 3. POST /auth/exchange                                     │
     │    (Bearer: Firebase Token)                                │
     ├───────────────────────────────────────────────────────────>│
     │                            │                               │
     │                            │  4. Verify Firebase Token     │
     │                            │<──────────────────────────────┤
     │                            │                               │
     │                            │  5. Token Valid               │
     │                            │───────────────────────────────>│
     │                            │                               │
     │ 6. { access_token, refresh_token }                         │
     │<───────────────────────────────────────────────────────────┤
     │                            │                               │
     │ 7. Store tokens locally    │                               │
     │                            │                               │
     │ 8. API Request                                             │
     │    (Bearer: Access Token)                                  │
     ├───────────────────────────────────────────────────────────>│
     │                            │                               │
     │ 9. Response                │                               │
     │<───────────────────────────────────────────────────────────┤
     │                            │                               │
     │ ... (Access token expires) │                               │
     │                            │                               │
     │ 10. POST /auth/refresh                                     │
     │     (Bearer: Refresh Token)                                │
     ├───────────────────────────────────────────────────────────>│
     │                            │                               │
     │ 11. { access_token (NEW), refresh_token (SAME) }           │
     │<───────────────────────────────────────────────────────────┤
     │                            │                               │
     │ 12. Update stored access token                             │
     │                            │                               │
```

### Step-by-Step Process

1. **Client Authentication with Firebase**
   - User signs in using Firebase Authentication (Google, Email/Password, etc.)
   - Firebase returns a Firebase ID token

2. **Token Exchange**
   - Client sends Firebase ID token to `POST /auth/exchange`
   - API validates the Firebase token
   - API generates access token and refresh token
   - API stores hashed refresh token in database
   - Client receives both tokens and stores them securely

3. **Making Authenticated Requests**
   - Client includes access token in Authorization header: `Bearer <access_token>`
   - API validates access token using `JWT_SECRET`
   - API processes the request

4. **Token Refresh**
   - When access token expires, client sends refresh token to `POST /auth/refresh`
   - API validates refresh token using `JWT_REFRESH_SECRET`
   - API verifies refresh token hash exists in database and is not expired
   - API generates new access token with fresh user data
   - API returns new access token + same refresh token
   - Client updates stored access token

## API Endpoints

### 1. Exchange Firebase Token

**Endpoint:** `POST /auth/exchange`

**Authentication:** Firebase ID token (via `SocialTokenGuard`)

**Headers:**
```http
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Description:**
- Exchanges Firebase ID token for application JWT tokens
- Public endpoint (bypasses global JWT guard)
- Validates Firebase token with Firebase Authentication
- Generates and stores refresh token in database (hashed with SHA-256)
- Returns both access and refresh tokens

---

### 2. Refresh Access Token

**Endpoint:** `POST /auth/refresh`

**Authentication:** Refresh token (via `RefreshTokenGuard`)

**Headers:**
```http
Authorization: Bearer <refresh_token>
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Description:**
- Refreshes access token using valid refresh token
- Public endpoint (bypasses global JWT guard)
- Validates refresh token with `JWT_REFRESH_SECRET`
- Verifies token hash exists in database
- Fetches fresh user data from database
- Returns NEW access token and SAME refresh token

**Note:** The refresh token returned is identical to the one sent. This allows clients to maintain the same refresh token across multiple refresh operations.

---

### 3. Logout

**Endpoint:** `POST /auth/logout`

**Authentication:** Access token (via global `JWTTokenGuard`)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

**Description:**
- Logs out the authenticated user
- Currently a placeholder for future logout logic
- Client should discard stored tokens

---

### 4. Protected Endpoints

**All other API endpoints** (Users, Gyms, etc.)

**Authentication:** Access token (via global `JWTTokenGuard`)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Description:**
- All non-auth endpoints require valid access token
- Token is validated using `JWT_SECRET`
- User information is attached to request object

## Security Features

### Token Storage

- **Access Tokens**: Stored only on client side (localStorage, secure storage, etc.)
- **Refresh Tokens**:
  - Stored on client side
  - Stored in database as SHA-256 hash (never plain text)
  - Associated with user ID and expiration timestamp

### Token Validation

1. **JWT Signature Verification**: All tokens verified with respective secrets
2. **Expiration Checking**: Both JWT expiration and database expiration validated
3. **Database Verification**: Refresh tokens must exist in database to be valid
4. **Issuer/Audience Validation**: Tokens validated against expected issuer and audience

### Security Best Practices

✅ Separate secrets for access and refresh tokens
✅ Refresh tokens hashed before database storage
✅ Automatic cleanup of expired tokens
✅ User data fetched fresh on token refresh
✅ Token expiration enforced at multiple layers
✅ Firebase token validation for initial authentication

## Environment Configuration

Required environment variables:

```bash
# JWT Access Token Configuration
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRY_SECONDS=604800  # 7 days (default)

# JWT Refresh Token Configuration
JWT_REFRESH_SECRET=your-secure-refresh-secret-here  # MUST be different from JWT_SECRET
JWT_REFRESH_EXPIRY_SECONDS=1209600  # 14 days (default)

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

**Important:**
- `JWT_SECRET` and `JWT_REFRESH_SECRET` **MUST** be different
- Use strong, random strings for both secrets
- Never commit secrets to version control

## Client Implementation Guide

### 1. Initial Authentication

```typescript
// User signs in with Firebase
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const firebaseToken = await userCredential.user.getIdToken();

// Exchange for app tokens
const response = await fetch('https://api.liftcrew.com/auth/exchange', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});

const { access_token, refresh_token } = await response.json();

// Store tokens securely
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);
```

### 2. Making Authenticated Requests

```typescript
const accessToken = localStorage.getItem('access_token');

const response = await fetch('https://api.liftcrew.com/users/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

if (response.status === 401) {
  // Token expired, refresh it
  await refreshAccessToken();
  // Retry the request
}
```

### 3. Refreshing Access Token

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');

  const response = await fetch('https://api.liftcrew.com/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  });

  if (response.ok) {
    const { access_token, refresh_token } = await response.json();

    // Update stored access token
    localStorage.setItem('access_token', access_token);
    // refresh_token should be the same, but update it anyway
    localStorage.setItem('refresh_token', refresh_token);

    return true;
  } else {
    // Refresh token expired or invalid, user must re-authenticate
    logout();
    return false;
  }
}
```

### 4. Automatic Token Refresh

```typescript
// Axios interceptor example
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const success = await refreshAccessToken();

      if (success) {
        // Retry original request with new token
        const accessToken = localStorage.getItem('access_token');
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axios(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
```

### 5. Logout

```typescript
async function logout() {
  const accessToken = localStorage.getItem('access_token');

  // Call logout endpoint (optional)
  await fetch('https://api.liftcrew.com/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // Clear stored tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  // Redirect to login
  window.location.href = '/login';
}
```

## Postman Collection

The Postman collection includes automated token management:

### Exchange Endpoint
- Automatically saves `access_token` to `jwt_token` variable
- Automatically saves `refresh_token` to `refresh_token` variable
- Logs token operations to console

### Refresh Endpoint
- Uses `{{refresh_token}}` variable from environment
- Automatically updates `jwt_token` with new access token
- Confirms refresh token (unchanged)

### All Other Endpoints
- Use global Bearer auth with `{{jwt_token}}` variable
- Tokens are automatically included in requests

### Usage

1. Import collection and environment files from `/postman` directory
2. Set `firebase_token` in environment variables
3. Call "Exchange Token" endpoint
4. All subsequent requests automatically use saved tokens
5. Use "Refresh Token" endpoint when access token expires

## Error Handling

### Common Error Responses

**401 Unauthorized - Invalid Token**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired JWT token"
}
```

**401 Unauthorized - Refresh Token Expired**
```json
{
  "statusCode": 401,
  "message": "Refresh token has expired"
}
```

**401 Unauthorized - Invalid Refresh Token**
```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

### Error Handling Strategy

1. **401 on Protected Endpoint**: Try to refresh access token
2. **401 on Refresh Endpoint**: Redirect user to login (re-authenticate with Firebase)
3. **Other Errors**: Handle according to your application logic

## Database Schema

### refresh_tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT unique_user_token UNIQUE (user_id, token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

## Troubleshooting

### Token Validation Fails

**Symptom:** Getting 401 errors on all requests

**Solutions:**
1. Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are correctly configured
2. Check token hasn't expired (use jwt.io to decode and inspect)
3. Ensure token is sent in correct format: `Bearer <token>`
4. Verify environment matches (local/staging/prod)

### Refresh Token Not Found in Database

**Symptom:** 401 error: "Invalid refresh token"

**Solutions:**
1. User may need to re-authenticate with Firebase
2. Check if refresh token was cleaned up due to expiration
3. Verify database connection is working
4. Check if user was deleted (CASCADE delete removes tokens)

### Firebase Token Validation Fails

**Symptom:** Exchange endpoint returns 401

**Solutions:**
1. Verify `FIREBASE_SERVICE_ACCOUNT` is correctly configured
2. Ensure Firebase token hasn't expired (1 hour lifetime)
3. Check if Firebase project ID matches
4. Verify token is from correct Firebase project

## Best Practices

1. **Never log tokens**: Tokens are sensitive credentials
2. **Use HTTPS**: Always use HTTPS in production to prevent token interception
3. **Rotate secrets**: Periodically rotate JWT secrets (requires re-authentication)
4. **Implement token refresh**: Don't wait for 401 errors, refresh proactively
5. **Clear tokens on logout**: Always clear stored tokens when user logs out
6. **Handle expired refresh tokens**: Gracefully redirect to login when refresh fails
7. **Secure token storage**: Use secure storage mechanisms (not localStorage for sensitive apps)
8. **Implement CSRF protection**: Consider implementing CSRF tokens for additional security

## Support

For questions or issues related to authentication:
- Check the [API Documentation](./README.md)
- Review the [Postman Collection](./postman/)
- Check environment variables in [.env.example](./.env.example)

---

**Last Updated:** December 2024
**API Version:** 1.0.0
