/**
 * Policy-Based Authorization (RBAC / ABAC) — P05 Invariant
 *
 * Requirements:
 * - Roles: 'user', 'moderator', 'admin'.
 * - Permissions evaluated via authz.can(subject, action, resource, context).
 * - Prohibition: Never check roles inline with string compares outside authz.ts.
 * - Central policy table maps (role, action, resource) deterministically.
 */

export type Role = 'user' | 'moderator' | 'admin';

export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'moderate'
  | 'verify'
  | 'administer';

export type Resource =
  | 'places'
  | 'reviews'
  | 'evidence'
  | 'users'
  | 'orders'
  | 'sessions'
  | 'system';

export interface Subject {
  id: string;
  role: Role;
  isActive: boolean;
}

export interface AuthzContext {
  ownerId?: string;
  resourceStatus?: string;
}

export class AuthorizationPolicyEngine {
  /**
   * Core permission evaluation engine:
   * authz.can(subject, action, resource, context)
   */
  can(subject: Subject, action: Action, resource: Resource, context?: AuthzContext): boolean {
    if (!subject.isActive) {
      return false;
    }

    // Admin has superuser access to all resources and actions
    if (subject.role === 'admin') {
      return true;
    }

    // Moderator capabilities
    if (subject.role === 'moderator') {
      if (resource === 'reviews' || resource === 'evidence') {
        return ['read', 'create', 'update', 'moderate', 'verify'].includes(action);
      }
      if (resource === 'places') {
        return ['read', 'create', 'update', 'verify'].includes(action);
      }
      if (resource === 'users' || resource === 'orders') {
        return action === 'read';
      }
      return false;
    }

    // Standard User capabilities
    if (subject.role === 'user') {
      if (resource === 'places' || resource === 'evidence') {
        return action === 'read';
      }
      if (resource === 'reviews') {
        if (action === 'read') return true;
        if (action === 'create') return true;
        // User can only update or delete their own reviews
        if (action === 'update' || action === 'delete') {
          return Boolean(context?.ownerId && context.ownerId === subject.id);
        }
      }
      if (resource === 'orders' || resource === 'sessions') {
        // User can only access/manage their own orders and sessions
        if (['read', 'create', 'delete'].includes(action)) {
          return Boolean(!context?.ownerId || context.ownerId === subject.id);
        }
      }
      return false;
    }

    return false;
  }
}

export const authz = new AuthorizationPolicyEngine();
export default authz;
