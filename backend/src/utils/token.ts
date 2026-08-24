import crypto from 'crypto';

const ALGORITHM = 'sha256';

export function hashToken(token: string): string {
  return crypto.createHash(ALGORITHM).update(token).digest('hex');
}
