# Firebase Authentication Module

This module provides Firebase authentication services for phone, Google, and Apple sign-in.

## Project Configuration

**Firebase Project:** `liftcrew-df66d`
**Service Account:** `firebase-adminsdk-fbsvc@liftcrew-df66d.iam.gserviceaccount.com`

## Setup

### 1. Firebase Service Account (Already Configured)

The Firebase service account is already configured in the project:
- Service account file: `serviceAccount.json`
- Environment variable: `FIREBASE_SERVICE_ACCOUNT` (configured in `.env`)

### 2. Verify Configuration

The service account JSON has been added to your `.env` file. You can verify by checking:

```bash
# Should show the Firebase configuration
cat .env | grep FIREBASE_SERVICE_ACCOUNT
```

### 3. Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/project/liftcrew-df66d)
2. Navigate to Authentication → Sign-in method
3. Enable the following providers:
   - **Phone** - For phone number authentication
   - **Google** - For Google Sign-In
   - **Apple** - For Apple Sign-In

## API Endpoints

### Phone Authentication

**POST** `/firebase-auth/phone`

Authenticate a user with phone number verification.

```json
{
  "phoneNumber": "+1234567890",
  "verificationCode": "123456"
}
```

Response:
```json
{
  "uid": "firebase-user-id",
  "phoneNumber": "+1234567890",
  "displayName": "User Name",
  "customToken": "firebase-custom-token"
}
```

### Google Authentication

**POST** `/firebase-auth/google`

Authenticate a user with Google Sign-In ID token.

```json
{
  "idToken": "google-id-token-from-client"
}
```

Response:
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "customToken": "firebase-custom-token"
}
```

### Apple Authentication

**POST** `/firebase-auth/apple`

Authenticate a user with Apple Sign-In ID token.

```json
{
  "idToken": "apple-id-token-from-client",
  "nonce": "optional-nonce-for-security"
}
```

Response:
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "customToken": "firebase-custom-token"
}
```

### Verify Token

**POST** `/firebase-auth/verify-token`

Verify any Firebase ID token.

```json
{
  "idToken": "firebase-id-token"
}
```

### Create Custom Token

**POST** `/firebase-auth/custom-token`

Create a custom Firebase token for a user.

```json
{
  "uid": "user-id",
  "claims": {
    "role": "admin"
  }
}
```

### Get User

**GET** `/firebase-auth/user/:uid`

Get user information by Firebase UID.

## Client Integration

### Phone Authentication Flow

1. Client initiates phone authentication with Firebase SDK
2. User receives SMS with verification code
3. Client sends phone number and verification code to your API
4. API verifies and returns custom token
5. Client signs in with custom token

### Google Authentication Flow

1. Client signs in with Google using Firebase SDK
2. Client receives Google ID token
3. Client sends ID token to your API
4. API verifies token and returns custom token
5. Client can use custom token for subsequent requests

### Apple Authentication Flow

1. Client signs in with Apple using Firebase SDK
2. Client receives Apple ID token
3. Client sends ID token (and optional nonce) to your API
4. API verifies token and returns custom token
5. Client can use custom token for subsequent requests

## Service Methods

The `FirebaseAuthService` provides these methods:

- `verifyPhoneNumber(phoneAuthDto)` - Verify phone number authentication
- `verifyGoogleAuth(googleAuthDto)` - Verify Google authentication
- `verifyAppleAuth(appleAuthDto)` - Verify Apple authentication
- `verifyIdToken(idToken)` - Verify any Firebase ID token
- `createCustomToken(uid, claims?)` - Create custom token
- `getUserByUid(uid)` - Get user by UID
- `getUserByEmail(email)` - Get user by email
- `getUserByPhoneNumber(phoneNumber)` - Get user by phone
- `deleteUser(uid)` - Delete a user
- `updateUser(uid, properties)` - Update user data

## Security Notes

1. Always verify tokens on the server side
2. Use HTTPS in production
3. Implement rate limiting for authentication endpoints
4. Store Firebase service account securely
5. Use nonces for Apple authentication
6. Validate phone numbers before sending verification codes
7. Implement proper error handling
