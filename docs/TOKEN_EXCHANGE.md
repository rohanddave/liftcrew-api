# Firebase Token Exchange Endpoint

## Overview

The `/auth/exchange` endpoint allows clients to exchange Firebase authentication tokens for application-specific JWT tokens.

## Endpoint

**POST** `/auth/exchange`

## Authentication

The Firebase ID token must be sent as a Bearer token in the Authorization header.

```
Authorization: Bearer <firebase-id-token>
```

## Request

### Headers

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
Content-Type: application/json
```

### Example using cURL

```bash
curl -X POST http://localhost:3000/auth/exchange \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json"
```

### Example using JavaScript (fetch)

```javascript
const firebaseIdToken = await firebase.auth().currentUser.getIdToken();

const response = await fetch('http://localhost:3000/auth/exchange', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('App JWT Token:', data.access_token);
```

## Response

### Success Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "uid": "firebase-user-uid",
    "email": "user@example.com",
    "phoneNumber": "+1234567890",
    "displayName": "John Doe",
    "photoURL": "https://example.com/photo.jpg",
    "provider": "google.com",
    "emailVerified": true
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | Application-specific JWT token |
| `token_type` | string | Always "Bearer" |
| `expires_in` | number | Token expiration time in seconds (7 days = 604800) |
| `user.uid` | string | Firebase user ID |
| `user.email` | string | User's email address |
| `user.phoneNumber` | string | User's phone number (if available) |
| `user.displayName` | string | User's display name |
| `user.photoURL` | string | User's profile photo URL |
| `user.provider` | string | Authentication provider (google.com, phone, apple.com) |
| `user.emailVerified` | boolean | Whether email is verified |

### Error Responses

#### 400 Bad Request - Missing Authorization Header

```json
{
  "statusCode": 400,
  "message": "Authorization header is required",
  "error": "Bad Request"
}
```

#### 400 Bad Request - Invalid Authorization Format

```json
{
  "statusCode": 400,
  "message": "Authorization header must be in format: Bearer <token>",
  "error": "Bad Request"
}
```

#### 500 Internal Server Error - Invalid Firebase Token

```json
{
  "statusCode": 500,
  "message": "Token verification failed: <error details>"
}
```

## JWT Token Details

The application-specific JWT token contains the following payload:

```json
{
  "uid": "firebase-user-uid",
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "name": "John Doe",
  "picture": "https://example.com/photo.jpg",
  "provider": "google.com",
  "emailVerified": true,
  "iat": 1701234567,
  "exp": 1701839367,
  "iss": "liftcrew-api",
  "aud": "liftcrew-app"
}
```

### Token Properties

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 7 days from issuance
- **Issuer**: `liftcrew-api`
- **Audience**: `liftcrew-app`

## Client Integration Flow

### 1. User Authentication with Firebase

```javascript
// Using Google Sign-In
const provider = new firebase.auth.GoogleAuthProvider();
const result = await firebase.auth().signInWithPopup(provider);
```

### 2. Get Firebase ID Token

```javascript
const firebaseIdToken = await firebase.auth().currentUser.getIdToken();
```

### 3. Exchange for Application JWT

```javascript
const response = await fetch('http://localhost:3000/auth/exchange', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,
  }
});

const { access_token } = await response.json();
```

### 4. Use Application JWT for API Requests

```javascript
// Store the token
localStorage.setItem('app_token', access_token);

// Use in subsequent requests
const apiResponse = await fetch('http://localhost:3000/api/protected', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production to prevent token interception
2. **Token Storage**: Store tokens securely (use httpOnly cookies or secure storage)
3. **Token Refresh**: Implement token refresh before expiration
4. **Token Validation**: Validate JWT tokens on protected endpoints
5. **Secret Management**: Keep JWT_SECRET secure and never expose it

## Verification of Application JWT

To verify the application JWT token in your middleware:

```typescript
import * as jwt from 'jsonwebtoken';

const decoded = jwt.verify(token, process.env.JWT_SECRET, {
  issuer: 'liftcrew-api',
  audience: 'liftcrew-app'
});
```

## Environment Configuration

Required environment variable:

```bash
JWT_SECRET=your-secure-random-secret-key
```

Generate a secure secret:

```bash
openssl rand -base64 64
```
