import crypto from 'crypto';

/**
 * AES-256-GCM encryption for secrets stored in the database (users' Gemini API keys).
 * The key lives only in ENCRYPTION_KEY (32 random bytes, base64), so a leaked
 * database alone does not expose the secrets. `context` (the owner's id) is bound
 * as additional authenticated data: a ciphertext copied to another row won't decrypt.
 */
const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

export function isEncryptionConfigured(): boolean {
  return getKey() !== null;
}

function getKey(): Buffer | null {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) return null;
  const key = Buffer.from(secret, 'base64');
  return key.length === 32 ? key : null;
}

function requireKey(): Buffer {
  const key = getKey();
  if (!key) throw new Error('ENCRYPTION_KEY must be 32 bytes encoded in base64');
  return key;
}

export function encryptSecret(plaintext: string, context: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, requireKey(), iv);
  cipher.setAAD(Buffer.from(context, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), ciphertext].map((part) =>
    typeof part === 'string' ? part : part.toString('base64')
  ).join(':');
}

/** Throws if the payload was tampered with, belongs to another context or was encrypted with another key */
export function decryptSecret(payload: string, context: string): string {
  const [version, iv, authTag, ciphertext] = payload.split(':');
  if (version !== VERSION || !iv || !authTag || !ciphertext) {
    throw new Error('Unsupported encrypted payload');
  }
  // Fixed tag length: otherwise a truncated tag would be accepted
  const decipher = crypto.createDecipheriv(ALGORITHM, requireKey(), Buffer.from(iv, 'base64'), { authTagLength: 16 });
  decipher.setAAD(Buffer.from(context, 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
}
