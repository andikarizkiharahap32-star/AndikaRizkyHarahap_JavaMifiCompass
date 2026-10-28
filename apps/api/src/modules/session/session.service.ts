import * as crypto from 'crypto';
import type { Role } from '../../plugins/authz';

export interface SessionData {
  sessionId: string;
  userId: string;
  role: Role;
  createdAt: number;
  lastAccessedAt: number;
  absoluteExpiresAt: number;
  userAgent?: string;
  ipAddress?: string;
}

export const SESSION_CONSTANTS = Object.freeze({
  COOKIE_NAME: '__Host-sid',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
  },
  SLIDING_TTL_MS: 14 * 24 * 60 * 60 * 1000, // 14 days sliding TTL
  ABSOLUTE_CAP_MS: 90 * 24 * 60 * 60 * 1000, // 90 days absolute cap
});

export class SessionService {
  private store: Map<string, SessionData> = new Map();

  /**
   * Generates a cryptographically strong 128-bit (16-byte) opaque session ID.
   */
  private generateOpaqueSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Creates a new server-side session with sliding TTL and absolute cap.
   */
  createSession(userId: string, role: Role, metadata?: { userAgent?: string; ipAddress?: string }): SessionData {
    const sessionId = this.generateOpaqueSessionId();
    const now = Date.now();
    const session: SessionData = {
      sessionId,
      userId,
      role,
      createdAt: now,
      lastAccessedAt: now,
      absoluteExpiresAt: now + SESSION_CONSTANTS.ABSOLUTE_CAP_MS,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    };

    this.store.set(sessionId, session);
    return session;
  }

  /**
   * Retrieves a session by ID and slides TTL if valid, enforcing the absolute cap.
   */
  getSession(sessionId: string): SessionData | null {
    const session = this.store.get(sessionId);
    if (!session) {
      return null;
    }

    const now = Date.now();

    // Check absolute expiration cap (90 days)
    if (now > session.absoluteExpiresAt) {
      this.store.delete(sessionId);
      return null;
    }

    // Check sliding TTL (14 days since last accessed)
    if (now - session.lastAccessedAt > SESSION_CONSTANTS.SLIDING_TTL_MS) {
      this.store.delete(sessionId);
      return null;
    }

    // Slide last accessed timestamp
    session.lastAccessedAt = now;
    return session;
  }

  /**
   * Session rotation: Rotates session ID on login or privilege change while preserving user data.
   */
  rotateSession(oldSessionId: string, newRole?: Role): SessionData | null {
    const existing = this.store.get(oldSessionId);
    if (!existing) {
      return null;
    }

    // Revoke old session immediately
    this.store.delete(oldSessionId);

    // Create rotated session with new 128-bit ID and updated privilege
    const newSessionId = this.generateOpaqueSessionId();
    const now = Date.now();
    const rotated: SessionData = {
      ...existing,
      sessionId: newSessionId,
      role: newRole || existing.role,
      lastAccessedAt: now,
    };

    this.store.set(newSessionId, rotated);
    return rotated;
  }

  /**
   * Immediate revocation: Takes effect on the very next request.
   */
  revokeSession(sessionId: string): boolean {
    return this.store.delete(sessionId);
  }

  /**
   * Revoke all sessions for a specific user (e.g. password reset / logout all).
   */
  revokeAllUserSessions(userId: string): number {
    let count = 0;
    for (const [id, session] of this.store.entries()) {
      if (session.userId === userId) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Returns the secure cookie configuration for HTTP responses.
   */
  getCookieConfig(sessionId: string) {
    return {
      name: SESSION_CONSTANTS.COOKIE_NAME,
      value: sessionId,
      options: SESSION_CONSTANTS.COOKIE_OPTIONS,
    };
  }
}

export const sessionService = new SessionService();
export default sessionService;
