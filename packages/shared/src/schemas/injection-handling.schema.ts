// ─────────────────────────────────────────────────────────────
// SEC-P05: Injection and Input Handling Schema & Sanitization Engine
// Audits parsing, validation, encoding, query construction,
// deserialization, and output encoding defensively.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

/**
 * Injection attack vectors categorized for detection and audit.
 */
export const InputInjectionVectorSchema = z.enum([
  'SQL_INJECTION',
  'CROSS_SITE_SCRIPTING',
  'PATH_TRAVERSAL',
  'COMMAND_INJECTION',
  'PROTOTYPE_POLLUTION',
  'LOG_INJECTION',
  'NOSQL_INJECTION',
  'TEMPLATE_INJECTION',
]);
export type InputInjectionVector = z.infer<typeof InputInjectionVectorSchema>;

/**
 * Parsing and payload bound limits.
 */
export const InputHandlingLimitsSchema = z.object({
  maxBodySizeBytes: z.number().int().positive(),
  maxStringLength: z.number().int().positive(),
  maxArrayItems: z.number().int().positive(),
  maxObjectKeys: z.number().int().positive(),
  maxRecursionDepth: z.number().int().positive(),
  maxQueryParams: z.number().int().positive(),
  maxUrlLength: z.number().int().positive(),
});
export type InputHandlingLimits = z.infer<typeof InputHandlingLimitsSchema>;

export const DEFAULT_INPUT_HANDLING_LIMITS: InputHandlingLimits = {
  maxBodySizeBytes: 65536, // 64 KB default request body
  maxStringLength: 16384, // 16 KB max string field
  maxArrayItems: 250, // max 250 elements in any array
  maxObjectKeys: 100, // max 100 keys per JSON object
  maxRecursionDepth: 8, // max 8 levels of nested JSON
  maxQueryParams: 50, // max query string parameters
  maxUrlLength: 2048, // max URL length (RFC 7230)
};

/**
 * Injection pattern definitions.
 */
export interface InjectionPatternRule {
  vector: InputInjectionVector;
  regex: RegExp;
  description: string;
}

export const INJECTION_DETECTION_RULES: readonly InjectionPatternRule[] = [
  // 1. SQL Injection: UNION, boolean tautologies, stacked queries, sleep functions
  {
    vector: 'SQL_INJECTION',
    regex:
      /\b(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from|drop\s+table|alter\s+table)\b/i,
    description: 'SQL DDL/DML statement injection attempt',
  },
  {
    vector: 'SQL_INJECTION',
    regex: /\b(?:or|and)\b\s+['"]?[0-9a-zA-Z]+['"]?\s*=\s*['"]?[0-9a-zA-Z]+['"]?/i,
    description: 'SQL boolean tautology probe',
  },
  {
    vector: 'SQL_INJECTION',
    regex: /(?:--|\/\*|\*\/|;\s*(?:select|drop|insert|update|delete|waitfor|benchmark|pg_sleep))/i,
    description: 'SQL comment or stacked query sequence',
  },
  {
    vector: 'SQL_INJECTION',
    regex: /\b(?:waitfor\s+delay|pg_sleep|benchmark\s*\(|sleep\s*\()\b/i,
    description: 'Time-based blind SQL injection probe',
  },

  // 2. Cross-Site Scripting (XSS) & HTML / Template Injection
  {
    vector: 'CROSS_SITE_SCRIPTING',
    regex: /<script\b[^>]*>[\s\S]*?<\/script>/i,
    description: 'HTML script block execution probe',
  },
  {
    vector: 'CROSS_SITE_SCRIPTING',
    regex: /\b(?:javascript|data|vbscript):/i,
    description: 'Executable URI scheme probe',
  },
  {
    vector: 'CROSS_SITE_SCRIPTING',
    regex: /\b(?:onload|onerror|onclick|onmouseover|onfocus|onblur)\s*=/i,
    description: 'Inline HTML event handler injection',
  },
  {
    vector: 'CROSS_SITE_SCRIPTING',
    regex: /<\s*(?:iframe|object|embed|svg|img|body|link|style)\b[^>]*>/i,
    description: 'HTML element injection probe',
  },

  // 3. Path Traversal & LFI
  {
    vector: 'PATH_TRAVERSAL',
    regex: /(?:\.\.[/\\]|%2e%2e(?:%2f|%5c|\/|\\))/i,
    description: 'Directory path traversal sequence',
  },
  {
    vector: 'PATH_TRAVERSAL',
    regex: /(?:\/etc\/passwd|\/etc\/shadow|\/proc\/self|c:[/\\]windows[/\\]system32)/i,
    description: 'Sensitive OS path access probe',
  },

  // 4. Command Injection
  {
    vector: 'COMMAND_INJECTION',
    regex: /(?:[;&|`$]\s*(?:cat|ls|whoami|pwd|curl|wget|bash|sh|cmd|powershell)\b)/i,
    description: 'Shell command concatenation and execution probe',
  },
  {
    vector: 'COMMAND_INJECTION',
    regex: /\$\([^)]+\)|`[^`]+`/i,
    description: 'Subshell command substitution probe',
  },

  // 5. Template Injection
  {
    vector: 'TEMPLATE_INJECTION',
    regex: /\{\{\s*[\s\S]*?\s*\}\}|\$\{[\s\S]*?\}|<%[\s\S]*?%>/i,
    description: 'Template syntax substitution probe',
  },
];

/**
 * Result of scanning an input payload for malicious injection vectors.
 */
export interface InjectionScanResult {
  detected: boolean;
  vector?: InputInjectionVector;
  field?: string;
  matchedPattern?: string;
  reason?: string;
}

/**
 * Checks for prototype pollution keys in objects.
 */
export function isPrototypePollutionKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

/**
 * Recursively scans arbitrary untrusted input for injection patterns,
 * prototype pollution, and resource-exhaustion bounds.
 */
export function scanPayloadForInjections(
  input: unknown,
  currentPath = 'root',
  depth = 0,
  limits: InputHandlingLimits = DEFAULT_INPUT_HANDLING_LIMITS,
): InjectionScanResult {
  if (depth > limits.maxRecursionDepth) {
    return {
      detected: true,
      vector: 'TEMPLATE_INJECTION',
      field: currentPath,
      reason: `Maximum recursion depth of ${limits.maxRecursionDepth} exceeded (possible DoS attempt)`,
    };
  }

  if (input === null || input === undefined) {
    return { detected: false };
  }

  // Handle String scanning
  if (typeof input === 'string') {
    if (input.length > limits.maxStringLength) {
      return {
        detected: true,
        vector: 'TEMPLATE_INJECTION',
        field: currentPath,
        reason: `String length of ${input.length} exceeds maximum allowed of ${limits.maxStringLength} bytes`,
      };
    }

    // Check for null bytes (%00 or \0)
    for (let i = 0; i < input.length; i++) {
      if (input.charCodeAt(i) === 0) {
        return {
          detected: true,
          vector: 'PATH_TRAVERSAL',
          field: currentPath,
          reason: 'Null byte injection detected in string input',
        };
      }
    }

    // Check injection regex patterns
    for (const rule of INJECTION_DETECTION_RULES) {
      if (rule.regex.test(input)) {
        return {
          detected: true,
          vector: rule.vector,
          field: currentPath,
          matchedPattern: rule.description,
          reason: `Malicious injection detected [${rule.vector}] in field '${currentPath}': ${rule.description}`,
        };
      }
    }

    return { detected: false };
  }

  // Handle Array scanning
  if (Array.isArray(input)) {
    if (input.length > limits.maxArrayItems) {
      return {
        detected: true,
        vector: 'TEMPLATE_INJECTION',
        field: currentPath,
        reason: `Array size of ${input.length} items exceeds limit of ${limits.maxArrayItems}`,
      };
    }

    for (let i = 0; i < input.length; i++) {
      const res = scanPayloadForInjections(input[i], `${currentPath}[${i}]`, depth + 1, limits);
      if (res.detected) return res;
    }

    return { detected: false };
  }

  // Handle Object scanning
  if (typeof input === 'object') {
    // Explicit prototype pollution check on own properties
    if (
      Object.prototype.hasOwnProperty.call(input, '__proto__') ||
      Object.prototype.hasOwnProperty.call(input, 'constructor') ||
      Object.prototype.hasOwnProperty.call(input, 'prototype')
    ) {
      return {
        detected: true,
        vector: 'PROTOTYPE_POLLUTION',
        field: currentPath,
        matchedPattern: 'Prototype pollution property detected',
        reason: 'Prototype pollution attempt: forbidden key detected in object properties',
      };
    }

    const keys = Object.keys(input as Record<string, unknown>);
    if (keys.length > limits.maxObjectKeys) {
      return {
        detected: true,
        vector: 'TEMPLATE_INJECTION',
        field: currentPath,
        reason: `Object key count of ${keys.length} exceeds limit of ${limits.maxObjectKeys}`,
      };
    }

    for (const key of keys) {
      // Prototype Pollution Check
      if (isPrototypePollutionKey(key)) {
        return {
          detected: true,
          vector: 'PROTOTYPE_POLLUTION',
          field: `${currentPath}.${key}`,
          matchedPattern: 'Prototype pollution property detected',
          reason: `Prototype pollution attempt: forbidden key '${key}' detected`,
        };
      }

      // Check key itself for injections
      const keyRes = scanPayloadForInjections(
        key,
        `${currentPath}.<key:${key}>`,
        depth + 1,
        limits,
      );
      if (keyRes.detected) return keyRes;

      // Check value
      const val = (input as Record<string, unknown>)[key];
      const valRes = scanPayloadForInjections(val, `${currentPath}.${key}`, depth + 1, limits);
      if (valRes.detected) return valRes;
    }

    return { detected: false };
  }

  return { detected: false };
}

/**
 * Escapes untrusted text for safe HTML output rendering.
 * Strictly prevents XSS by replacing HTML special characters.
 */
export function encodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes strings for security-sensitive logging.
 * Replaces CRLF and non-printable control characters to prevent log forging (INV-03).
 */
export function sanitizeForLogging(str: string, maxLength = 500): string {
  if (!str) return '';
  let sanitized = '';
  const len = Math.min(str.length, maxLength);

  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    // Replace CRLF with space
    if (code === 10 || code === 13) {
      sanitized += ' ';
    }
    // Retain printable ASCII and common unicode (code >= 32 and not DEL 127)
    else if (code >= 32 && code !== 127) {
      sanitized += str[i];
    } else {
      // Strip control character
      sanitized += '?';
    }
  }

  return sanitized.trim();
}

/**
 * Sanitizes a path segment or slug, strictly preventing path traversal.
 */
export function sanitizePathSegment(segment: string): { valid: boolean; sanitized: string } {
  if (!segment) return { valid: false, sanitized: '' };

  // Check for traversal sequences or null bytes
  if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
    return { valid: false, sanitized: '' };
  }

  // Remove any non-alphanumeric, dash, or underscore characters
  const clean = segment.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!clean || clean.length === 0) {
    return { valid: false, sanitized: '' };
  }

  return { valid: true, sanitized: clean };
}

/**
 * Asserts query pagination parameters adhere to safe bounds.
 */
export function validatePaginationParams(
  page?: unknown,
  limit?: unknown,
  maxLimit = 100,
): { page: number; limit: number; offset: number } {
  const p = Math.max(
    1,
    typeof page === 'number' ? Math.floor(page) : parseInt(String(page || 1), 10) || 1,
  );
  const l = Math.min(
    maxLimit,
    Math.max(
      1,
      typeof limit === 'number' ? Math.floor(limit) : parseInt(String(limit || 20), 10) || 20,
    ),
  );
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
}

/**
 * Configuration for SEC-P05 continuous compliance evaluation.
 */
export interface InjectionHandlingComplianceConfig {
  limits: InputHandlingLimits;
  enforceParameterizedQueries: boolean;
  enforceContextualOutputEncoding: boolean;
  enforcePathTraversalProtection: boolean;
  enforcePrototypePollutionProtection: boolean;
  enforceLogInjectionSanitization: boolean;
}

/**
 * Compliance report for SEC-P05.
 */
export interface InjectionHandlingEvaluationReport {
  status: 'COMPLIANT' | 'NON_COMPLIANT';
  complianceScore: number;
  criticalReleaseBlockers: number;
  releaseBlockerReasons: string[];
  invariants: {
    INV_01_InputValidation: boolean;
    INV_02_MutationBoundaryRecheck: boolean;
    INV_03_LogRedactionSanitization: boolean;
    INV_04_ReleaseBlockerIntegrity: boolean;
  };
  metrics: {
    totalDetectionRules: number;
    maxBodySizeAllowedBytes: number;
    maxRecursionDepthAllowed: number;
    parameterizedQueriesActive: boolean;
    prototypePollutionActive: boolean;
    logCRLFProtectionActive: boolean;
  };
  disposition: string;
  evaluatedAt: string;
}

/**
 * Evaluates the system's injection and input handling compliance posture against SEC-P05 requirements.
 */
export function evaluateInjectionHandlingCompliance(
  config: InjectionHandlingComplianceConfig,
): InjectionHandlingEvaluationReport {
  const blockers: string[] = [];
  let passedChecks = 0;
  const totalChecks = 6;

  // Check 1: Parameterized query enforcement (No raw SQL concatenation)
  if (config.enforceParameterizedQueries === true) {
    passedChecks++;
  } else {
    blockers.push(
      'RELEASE BLOCKER: Database access must enforce parameterized query construction.',
    );
  }

  // Check 2: Contextual output encoding (Plain text / Entity escaping)
  if (config.enforceContextualOutputEncoding === true) {
    passedChecks++;
  } else {
    blockers.push(
      'RELEASE BLOCKER: Contextual output encoding must be strictly enforced on user output.',
    );
  }

  // Check 3: Path traversal protection
  if (config.enforcePathTraversalProtection === true) {
    passedChecks++;
  } else {
    blockers.push(
      'RELEASE BLOCKER: Path traversal and canonical path resolution protection must be active.',
    );
  }

  // Check 4: Prototype pollution defense
  if (config.enforcePrototypePollutionProtection === true) {
    passedChecks++;
  } else {
    blockers.push(
      'RELEASE BLOCKER: JSON parsers must actively reject prototype pollution properties.',
    );
  }

  // Check 5: Log CRLF injection sanitization (INV-03)
  if (config.enforceLogInjectionSanitization === true) {
    passedChecks++;
  } else {
    blockers.push(
      'RELEASE BLOCKER: Security-sensitive logs must sanitize CRLF and control characters (INV-03).',
    );
  }

  // Check 6: Bounded input parsing limits
  if (config.limits.maxBodySizeBytes <= 1048576 && config.limits.maxRecursionDepth <= 10) {
    passedChecks++;
  } else {
    blockers.push(
      'RELEASE BLOCKER: Request body bounds or recursion depth exceed safe DoS prevention thresholds.',
    );
  }

  const score = Math.round((passedChecks / totalChecks) * 100);
  const isCompliant = blockers.length === 0 && score === 100;

  return {
    status: isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
    complianceScore: score,
    criticalReleaseBlockers: blockers.length,
    releaseBlockerReasons: blockers,
    invariants: {
      INV_01_InputValidation:
        config.enforceContextualOutputEncoding && config.enforcePathTraversalProtection,
      INV_02_MutationBoundaryRecheck: config.enforceParameterizedQueries,
      INV_03_LogRedactionSanitization: config.enforceLogInjectionSanitization,
      INV_04_ReleaseBlockerIntegrity: blockers.length === 0,
    },
    metrics: {
      totalDetectionRules: INJECTION_DETECTION_RULES.length,
      maxBodySizeAllowedBytes: config.limits.maxBodySizeBytes,
      maxRecursionDepthAllowed: config.limits.maxRecursionDepth,
      parameterizedQueriesActive: config.enforceParameterizedQueries,
      prototypePollutionActive: config.enforcePrototypePollutionProtection,
      logCRLFProtectionActive: config.enforceLogInjectionSanitization,
    },
    disposition: isCompliant
      ? 'SEC-P05 Injection & Input Handling APPROVED: All parsing boundaries, encoding contexts, and invariants verified.'
      : 'SEC-P05 Injection & Input Handling BLOCKED: Critical input handling vulnerabilities detected.',
    evaluatedAt: new Date().toISOString(),
  };
}
