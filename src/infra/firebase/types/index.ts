import * as admin from 'firebase-admin';

export interface FirebaseDecodedToken extends admin.auth.DecodedIdToken {}

export interface FirebaseAuthUser extends admin.auth.UserRecord {}
