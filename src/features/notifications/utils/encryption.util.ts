import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encrypts text using AES-256-GCM encryption
 * @param text - The plain text to encrypt
 * @param key - 32-byte hex string encryption key
 * @returns Encrypted text in format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(text: string, key: string): string {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  if (!key || key.length !== 64) {
    throw new Error('Encryption key must be a 32-byte hex string (64 characters)');
  }

  // Convert hex key to buffer
  const keyBuffer = Buffer.from(key, 'hex');

  // Generate random IV (16 bytes for AES)
  const iv = randomBytes(16);

  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);

  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get the auth tag
  const authTag = cipher.getAuthTag();

  // Return in format: iv:authTag:encryptedData
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts text encrypted with AES-256-GCM
 * @param encryptedText - Encrypted text in format: iv:authTag:encryptedData
 * @param key - 32-byte hex string encryption key
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string, key: string): string {
  if (!encryptedText) {
    throw new Error('Encrypted text cannot be empty');
  }

  if (!key || key.length !== 64) {
    throw new Error('Encryption key must be a 32-byte hex string (64 characters)');
  }

  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivBase64, authTagBase64, encryptedData] = parts;

    // Convert from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const keyBuffer = Buffer.from(key, 'hex');

    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', keyBuffer, iv);

    // Set the auth tag
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}
