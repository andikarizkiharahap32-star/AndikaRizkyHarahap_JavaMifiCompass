/**
 * P13: Halal Verification & Precedence Engine
 *
 * Requirements:
 * 1. Evidence types: certificate, authority_listing, owner_declaration, community_report.
 * 2. Deterministic precedence calculation: computeHalalStatus(evidence[]).
 * 3. Expire certificates by background check; transition to unverified after expiry + grace.
 * 4. Prohibition: Do not auto-upgrade status from community reports.
 * 5. Prohibition: Do not show status without asOf timestamp.
 * 6. Every status change creates an audit log entry.
 */

export type HalalStatus = 'verified' | 'self_declared' | 'unverified' | 'disputed';

export type EvidenceType =
  'certificate' | 'authority_listing' | 'owner_declaration' | 'community_report';

export interface HalalEvidenceInput {
  id: string;
  placeId: string;
  evidenceType: EvidenceType;
  certifyingBody?: string;
  certificateNumber?: string;
  issuedAt?: string | Date;
  expiresAt?: string | Date;
  isDisputed?: boolean;
  notes?: string;
  asOf: string | Date;
}

export interface ComputedHalalStatus {
  status: HalalStatus;
  primaryEvidenceType?: EvidenceType;
  certifyingBody?: string;
  certificateNumber?: string;
  asOf: string; // Mandatory ISO timestamp
  isExpired: boolean;
  reason: string;
}

export interface StatusAuditLogEntry {
  placeId: string;
  previousStatus: HalalStatus;
  newStatus: HalalStatus;
  reason: string;
  changedBy: string;
  asOf: string;
  createdAt: string;
}

export const DEFAULT_GRACE_PERIOD_DAYS = 30;

/**
 * Deterministic status computation according to documented precedence:
 * Precedence 1: Active dispute flag -> 'disputed'
 * Precedence 2: Valid, unexpired certification -> 'verified'
 * Precedence 3: Official authority database listing -> 'verified'
 * Precedence 4: Owner / management declaration -> 'self_declared'
 * Precedence 5: Community reports only -> 'unverified' (STRICT PROHIBITION: NEVER auto-upgrade)
 * Precedence 6: No evidence -> 'unverified'
 */
export function computeHalalStatus(
  evidenceList: HalalEvidenceInput[],
  options: { asOf?: Date; gracePeriodDays?: number } = {},
): ComputedHalalStatus {
  const asOfDate = options.asOf || new Date();
  const asOf = asOfDate.toISOString();
  const gracePeriodMs = (options.gracePeriodDays ?? DEFAULT_GRACE_PERIOD_DAYS) * 86400000;

  if (!evidenceList || evidenceList.length === 0) {
    return {
      status: 'unverified',
      asOf,
      isExpired: false,
      reason: 'No halal verification evidence provided',
    };
  }

  // 1. Check for active, unresolved disputes
  const activeDispute = evidenceList.find((e) => e.isDisputed === true);
  if (activeDispute) {
    return {
      status: 'disputed',
      primaryEvidenceType: activeDispute.evidenceType,
      asOf,
      isExpired: false,
      reason: `Dispute flagged: ${activeDispute.notes || 'Evidence disputed by audit'}`,
    };
  }

  // 2. Check for certificates
  const certificates = evidenceList.filter((e) => e.evidenceType === 'certificate');
  for (const cert of certificates) {
    if (cert.expiresAt) {
      const expiryTime = new Date(cert.expiresAt).getTime();
      const isPastExpiryWithGrace = asOfDate.getTime() > expiryTime + gracePeriodMs;

      if (!isPastExpiryWithGrace) {
        return {
          status: 'verified',
          primaryEvidenceType: 'certificate',
          certifyingBody: cert.certifyingBody,
          certificateNumber: cert.certificateNumber,
          asOf,
          isExpired: asOfDate.getTime() > expiryTime, // within grace period but expired
          reason: `Certified by ${cert.certifyingBody || 'Accredited Body'} (Cert: ${cert.certificateNumber || 'N/A'})`,
        };
      }
    } else {
      // Certificate without explicit expiry
      return {
        status: 'verified',
        primaryEvidenceType: 'certificate',
        certifyingBody: cert.certifyingBody,
        certificateNumber: cert.certificateNumber,
        asOf,
        isExpired: false,
        reason: `Certified by ${cert.certifyingBody || 'Accredited Body'}`,
      };
    }
  }

  // 3. Check for official religious/governmental authority listing
  const authorityListing = evidenceList.find((e) => e.evidenceType === 'authority_listing');
  if (authorityListing) {
    return {
      status: 'verified',
      primaryEvidenceType: 'authority_listing',
      certifyingBody: authorityListing.certifyingBody,
      asOf,
      isExpired: false,
      reason: `Listed on official authority database (${authorityListing.certifyingBody || 'Official Authority'})`,
    };
  }

  // 4. Check for owner self-declaration
  const ownerDeclaration = evidenceList.find((e) => e.evidenceType === 'owner_declaration');
  if (ownerDeclaration) {
    return {
      status: 'self_declared',
      primaryEvidenceType: 'owner_declaration',
      asOf,
      isExpired: false,
      reason: 'Muslim-owned or halal assurance declared by operator',
    };
  }

  // 5. Community reports: P13 PROHIBITION: Never auto-upgrade status
  const communityReport = evidenceList.find((e) => e.evidenceType === 'community_report');
  if (communityReport) {
    return {
      status: 'unverified',
      primaryEvidenceType: 'community_report',
      asOf,
      isExpired: false,
      reason: 'Crowdsourced community report requires formal verification or owner confirmation',
    };
  }

  return {
    status: 'unverified',
    asOf,
    isExpired: false,
    reason: 'Evidence does not meet verification thresholds',
  };
}

/**
 * Generates an audit log record for every halal status change.
 */
export function createStatusAuditLog(
  placeId: string,
  previousStatus: HalalStatus,
  newStatus: HalalStatus,
  reason: string,
  changedBy: string,
  asOf = new Date(),
): StatusAuditLogEntry {
  return {
    placeId,
    previousStatus,
    newStatus,
    reason,
    changedBy,
    asOf: asOf.toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export interface ExpiryJobResult {
  placeId: string;
  previousStatus: HalalStatus;
  newStatus: HalalStatus;
  statusChanged: boolean;
  auditLog?: StatusAuditLogEntry;
}

/**
 * Background / cron job: Evaluates place certificates and transitions to unverified after expiry + grace.
 */
export function evaluateCertificateExpiry(
  placeId: string,
  currentStatus: HalalStatus,
  evidenceList: HalalEvidenceInput[],
  options: { asOf?: Date; gracePeriodDays?: number } = {},
): ExpiryJobResult {
  const asOf = options.asOf || new Date();
  const computed = computeHalalStatus(evidenceList, {
    asOf,
    gracePeriodDays: options.gracePeriodDays,
  });

  if (computed.status !== currentStatus) {
    const auditLog = createStatusAuditLog(
      placeId,
      currentStatus,
      computed.status,
      `Certificate expired past grace period: ${computed.reason}`,
      'system:cron_expiry',
      asOf,
    );

    return {
      placeId,
      previousStatus: currentStatus,
      newStatus: computed.status,
      statusChanged: true,
      auditLog,
    };
  }

  return {
    placeId,
    previousStatus: currentStatus,
    newStatus: currentStatus,
    statusChanged: false,
  };
}
