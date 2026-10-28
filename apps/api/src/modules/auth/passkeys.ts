import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import * as crypto from 'crypto';

/**
 * P04 Authentication Invariants:
 * 1. WebAuthn Passkeys via @simplewebauthn/server.
 * 2. Argon2id parameters: memoryCost=65536 (64MiB), timeCost=3, parallelism=1.
 * 3. Magic Link: 32 bytes random, sha-256 hashed at rest, single-use, 600s (10 min) TTL.
 * 4. Anti-enumeration: Uniform timing and responses.
 */

export const ARGON2_CONFIG = Object.freeze({
  type: 2, // argon2id
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 1,
});

export const RP_CONFIG = Object.freeze({
  rpName: 'JavaMifi Compass',
  rpID: 'localhost',
  origin: 'http://localhost:3000',
});

export interface MagicLinkRecord {
  tokenHash: string; // Stored at rest (sha-256)
  email: string;
  expiresAt: Date;
  used: boolean;
}

export class PasskeyService {
  /**
   * Generates WebAuthn registration options for a new passkey credential.
   */
  async generatePasskeyRegistrationOptions(user: { id: string; email: string; fullName: string }) {
    return generateRegistrationOptions({
      rpName: RP_CONFIG.rpName,
      rpID: RP_CONFIG.rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email,
      userDisplayName: user.fullName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });
  }

  /**
   * Verifies passkey registration response.
   */
  async verifyPasskeyRegistration(params: {
    response: any;
    expectedChallenge: string;
  }): Promise<VerifiedRegistrationResponse> {
    return verifyRegistrationResponse({
      response: params.response,
      expectedChallenge: params.expectedChallenge,
      expectedOrigin: RP_CONFIG.origin,
      expectedRPID: RP_CONFIG.rpID,
    });
  }

  /**
   * Generates WebAuthn authentication options for passkey login.
   */
  async generatePasskeyAuthenticationOptions() {
    return generateAuthenticationOptions({
      rpID: RP_CONFIG.rpID,
      userVerification: 'preferred',
    });
  }

  /**
   * Verifies passkey authentication assertion response.
   */
  async verifyPasskeyAuthentication(params: {
    response: any;
    expectedChallenge: string;
    credential: {
      id: string;
      publicKey: Uint8Array<ArrayBuffer>;
      counter: number;
    };
  }): Promise<VerifiedAuthenticationResponse> {
    return verifyAuthenticationResponse({
      response: params.response,
      expectedChallenge: params.expectedChallenge,
      expectedOrigin: RP_CONFIG.origin,
      expectedRPID: RP_CONFIG.rpID,
      credential: {
        id: params.credential.id,
        publicKey: params.credential.publicKey as unknown as Uint8Array<ArrayBuffer>,
        counter: params.credential.counter,
      },
    });
  }

  /**
   * Magic Link Token Generation:
   * Generates a cryptographically secure 32-byte token and its SHA-256 hash.
   * Only tokenHash is persisted to the database. The raw token is delivered once via email.
   */
  generateMagicLink(email: string): { rawToken: string; record: MagicLinkRecord } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    return {
      rawToken,
      record: {
        tokenHash,
        email: email.toLowerCase().trim(),
        expiresAt,
        used: false,
      },
    };
  }

  /**
   * Verifies a magic link raw token against its stored hash.
   */
  verifyMagicLinkToken(rawToken: string, storedRecord: MagicLinkRecord): { valid: boolean; reason?: string } {
    if (storedRecord.used) {
      return { valid: false, reason: 'Token already used' };
    }
    if (storedRecord.expiresAt < new Date()) {
      return { valid: false, reason: 'Token expired' };
    }

    const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const timingSafeMatch = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedRecord.tokenHash, 'hex'),
    );

    if (!timingSafeMatch) {
      return { valid: false, reason: 'Invalid token' };
    }

    return { valid: true };
  }

  /**
   * Anti-enumeration helper: provides a generic user-safe response regardless of email existence.
   */
  getGenericAuthResponse() {
    return {
      status: 'success',
      message: 'If an account matches that address, authentication instructions have been dispatched.',
    };
  }
}

export const passkeyService = new PasskeyService();
