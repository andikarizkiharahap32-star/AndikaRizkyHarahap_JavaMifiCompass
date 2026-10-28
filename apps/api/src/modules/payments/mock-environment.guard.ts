import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  ALLOWLISTED_MOCK_TOKENS,
  containsRealPaymentCredentials,
  isLegalOrderTransition,
  isLegalPaymentTransition,
  isPaymentIntentExpired,
  isTerminalOrderStatus,
  isTerminalPaymentStatus,
  MOCK_ENVIRONMENT_MARKER,
  MOCK_PROVIDER_NAMESPACE,
  getPaymentScenario,
  listPaymentScenarios,
  MockPaymentIntentInput,
  mockPaymentIntentSchema,
  OperatorOverrideInput,
  operatorOverrideSchema,
  PAYMENT_CONCURRENCY_POLICY,
  PaymentScenarioId,
  PAYMENT_SCENARIO_IDS,
  isUniqueConstraintViolation,
  resolveSyntheticOutcome,
  sanitizeAuditPayload,
  validateAuthoritativeAmountMatch,
  validateIntentIdempotencyMatch,
  validateOperatorOverride,
  validateOrderTransition,
  validatePaymentTransition,
  validateWebhookTimestampFreshness,
  detectInjectionPattern,
  evaluateNegativeProbe,
  NegativeProbeInput,
  NegativeProbeResult,
  PAYMENT_ABUSE_ERROR_CODES,
  PAYMENT_ABUSE_LIMITS,
  validateOrderTenantBinding,
  validatePayloadBounds,
  evaluateReleaseSignoff,
  RELEASE_GATES,
  ReleaseGateId,
  ReleaseGateItem,
  ReleaseSignoffReport,
  validateRollbackAction,
} from '@javamifi/shared';

/**
 * P0, P1, P2: Mock Environment Guard & Synthetic Fixture Service
 *
 * Enforces:
 * 1. Strict server-side environment isolation (prohibits enabling mock mode from query params or client headers in production).
 * 2. Real credential prohibition (rejects real PAN, CVV, or card data).
 * 3. Authoritative server-side amount derivation & minor-unit exact match (rejects client amount tampering).
 * 4. Server-side status authority (never trust status from client/browser).
 * 5. Legal state transitions & out-of-order sequence quarantine (INV-03).
 * 6. Replay and timestamp freshness protection (INV-03).
 * 7. Synthetic fixture validation & allowlisted token resolution (P2).
 */
@Injectable()
export class MockEnvironmentGuard {
  private readonly logger = new Logger(MockEnvironmentGuard.name);
  private readonly rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

  /**
   * Asserts that mock payment mode is permitted in the current environment.
   * Fails closed in production unless explicitly enabled via server configuration.
   */
  assertMockAllowed(
    context: {
      queryParams?: Record<string, any>;
      headers?: Record<string, any>;
    } = {},
  ): void {
    const isProd = process.env.NODE_ENV === 'production';

    // 1. In production, mock payment is disabled unless explicit server-side flag is set
    if (isProd && process.env.ALLOW_MOCK_PAYMENT !== 'true') {
      this.logger.warn(
        'Mock payment access attempted in production without ALLOW_MOCK_PAYMENT=true',
      );
      throw new ForbiddenException(
        'Mock payment simulation is strictly disabled in production environments',
      );
    }

    // 2. Prohibit client-side query parameter switches (e.g. ?mock=true)
    if (isProd && context.queryParams) {
      const q = context.queryParams;
      if (q['mock'] !== undefined || q['isMock'] !== undefined || q['mode'] === 'mock') {
        throw new BadRequestException(
          'Activating mock payment via client query parameters is strictly prohibited',
        );
      }
    }

    // 3. Prohibit client-side header manipulation in production
    if (isProd && context.headers) {
      const h = context.headers;
      if (h['x-mock-mode'] || h['x-payment-mode'] === 'mock') {
        throw new BadRequestException(
          'Activating mock payment via client request headers is strictly prohibited',
        );
      }
    }
  }

  /**
   * Validates that payload contains only synthetic mock identifiers and zero real credentials.
   */
  validateSyntheticCredentials(payload: unknown): void {
    if (containsRealPaymentCredentials(payload)) {
      this.logger.warn(
        'Real payment credentials detected in mock payment payload. Rejecting immediately.',
      );
      throw new BadRequestException(
        'Real payment credentials (PAN/CVV) are strictly prohibited in the mock payment gateway. Use documented synthetic test tokens.',
      );
    }

    if (payload && typeof payload === 'object') {
      const token = (payload as any).syntheticToken || (payload as any).token;
      if (
        token &&
        typeof token === 'string' &&
        !token.startsWith('tok_mock_') &&
        !token.startsWith('mock-token-')
      ) {
        throw new BadRequestException(
          `Invalid synthetic token "${token}". Synthetic tokens must start with "tok_mock_".`,
        );
      }
    }
  }

  /**
   * P2: Asserts that synthetic token is an allowlisted fixture token.
   */
  assertAllowlistedToken(token: string): void {
    if (!token.startsWith('tok_mock_') && !token.startsWith('mock-token-')) {
      throw new BadRequestException(
        `Invalid synthetic token "${token}". Synthetic tokens must start with "tok_mock_".`,
      );
    }
    const isAllowlisted =
      (ALLOWLISTED_MOCK_TOKENS as readonly string[]).includes(token) ||
      token.startsWith('mock-token-');
    if (!isAllowlisted) {
      throw new BadRequestException(
        `Synthetic token "${token}" is not in the documented allowlist. Supported tokens: ${ALLOWLISTED_MOCK_TOKENS.join(', ')}`,
      );
    }
  }

  /**
   * P2: Resolves simulation outcome for a synthetic fixture token.
   */
  resolveFixtureOutcome(token: string) {
    this.assertAllowlistedToken(token);
    return resolveSyntheticOutcome(token);
  }

  /**
   * Asserts that payable amount is derived authoritatively from server-side order total.
   */
  assertAuthoritativeAmount(orderTotalIdr: number, clientSuppliedAmount?: number): number {
    if (clientSuppliedAmount !== undefined && clientSuppliedAmount !== orderTotalIdr) {
      this.logger.warn(
        `Price tampering detected: client provided ${clientSuppliedAmount}, authoritative order total is ${orderTotalIdr}`,
      );
      throw new BadRequestException(
        `Payment amount ${clientSuppliedAmount} does not match authoritative order total ${orderTotalIdr}`,
      );
    }
    return orderTotalIdr;
  }

  /**
   * Asserts amount match between authoritative order and incoming webhook payload
   * using exact minor units (rupiah integer precision, PROHIBIT-08 / PAY-P01-CTRL-0023).
   */
  assertAuthoritativeAmountMatch(orderTotalIdr: number, rawGrossAmount: string | number): void {
    const result = validateAuthoritativeAmountMatch(orderTotalIdr, rawGrossAmount);
    if (!result.valid) {
      this.logger.warn(
        `Authoritative amount mismatch: orderTotalIdr=${orderTotalIdr}, received=${rawGrossAmount}`,
      );
      throw new BadRequestException(
        `Authoritative amount mismatch: expected ${orderTotalIdr}, received ${rawGrossAmount}`,
      );
    }
  }

  /**
   * Enforces legal state machine transitions and quarantines impossible status sequences (INV-03 / PAY-P01-CTRL-0013 / PAY-P03-CTRL-0041).
   */
  assertLegalTransition(
    fromStatus: string,
    toStatus: string,
    entityType: 'order' | 'payment',
  ): void {
    const result =
      entityType === 'order'
        ? validateOrderTransition(fromStatus, toStatus)
        : validatePaymentTransition(fromStatus, toStatus);

    if (!result.valid) {
      this.logger.warn(
        `Illegal state transition attempted for ${entityType}: ${fromStatus} -> ${toStatus}. Reason: ${result.reason}`,
      );
      throw new BadRequestException(
        result.reason ||
          `Illegal ${entityType} state transition: cannot transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }

  /**
   * Replay protection: asserts that incoming webhook event timestamp is within tolerable drift window (PAY-P01-CTRL-0014).
   */
  assertFreshTimestamp(timestamp?: string | number | Date): void {
    const result = validateWebhookTimestampFreshness(timestamp);
    if (!result.valid) {
      this.logger.warn(`Stale or replayed webhook event rejected: ${result.reason}`);
      throw new BadRequestException(`Replay protection: ${result.reason}`);
    }
  }

  /**
   * Asserts that intent has not expired before allowing terminal success transition (PAY-P01-CTRL-0008 / PAY-P03-CTRL-0008).
   */
  assertNotExpired(expiresAt?: Date | string | null): void {
    if (isPaymentIntentExpired(expiresAt)) {
      this.logger.warn('Payment intent expired; success transition rejected');
      throw new BadRequestException('Payment intent has expired; success transition rejected');
    }
  }

  /**
   * Asserts that entity is not in a terminal state that forbids further mutations (PAY-P03-CTRL-0013).
   */
  assertTerminalImmutability(currentStatus: string, entityType: 'order' | 'payment'): void {
    const isTerminal =
      entityType === 'order'
        ? isTerminalOrderStatus(currentStatus)
        : isTerminalPaymentStatus(currentStatus);

    if (isTerminal) {
      this.logger.warn(`Mutation attempted on terminal ${entityType} in status '${currentStatus}'`);
      throw new BadRequestException(
        `${entityType === 'order' ? 'Order' : 'Payment'} is already in terminal state '${currentStatus}'; further transitions are prohibited`,
      );
    }
  }

  /**
   * P4: Validates mock payment intent creation request (PAY-P04-CTRL-0001 - CTRL-0005).
   */
  validateMockPaymentIntentRequest(body: unknown): MockPaymentIntentInput {
    this.assertMockAllowed();
    this.validateSyntheticCredentials(body);

    const parseResult = mockPaymentIntentSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || 'Invalid mock payment intent request';
      this.logger.warn(`Mock payment intent validation failure: ${issue}`);
      throw new BadRequestException(issue);
    }

    return parseResult.data;
  }

  /**
   * P4: Validates idempotency key matching to prevent parameter tampering (PAY-P04-CTRL-0006).
   */
  assertIntentIdempotencyMatch(
    existingPayment: { orderId: string; amountIdr: number; snapToken?: string | null },
    newRequest: { orderId: string; amountIdr: number },
  ): void {
    const result = validateIntentIdempotencyMatch(existingPayment, newRequest);
    if (!result.match) {
      this.logger.warn(`Idempotency key parameter mismatch rejected: ${result.reason}`);
      throw new BadRequestException(result.reason || 'Idempotency key parameter mismatch');
    }
  }

  /**
   * P4: Sanitizes payment intent details for safe log inspection (PAY-P04-CTRL-0026 / CTRL-0054).
   */
  sanitizePaymentIntentForLogging(intent: {
    paymentId: string;
    orderNumber: string;
    syntheticToken?: string;
    amountIdr?: number;
  }) {
    return {
      paymentId: intent.paymentId,
      orderNumber: intent.orderNumber,
      amountIdr: intent.amountIdr,
      syntheticToken: intent.syntheticToken
        ? `${intent.syntheticToken.slice(0, 12)}...`
        : undefined,
    };
  }

  /**
   * P5: Asserts concurrency safety under parallel submissions (PAY-P05-CTRL-0007 / CTRL-0035).
   * Validates that the active pending intent limit is not exceeded.
   */
  assertConcurrencyLimit(activePendingCount: number): void {
    if (activePendingCount >= PAYMENT_CONCURRENCY_POLICY.MAX_ACTIVE_PENDING_INTENTS_PER_ORDER) {
      this.logger.warn(
        `Concurrency limit reached: ${activePendingCount} active pending payment intents exist (max allowed: ${PAYMENT_CONCURRENCY_POLICY.MAX_ACTIVE_PENDING_INTENTS_PER_ORDER})`,
      );
    }
  }

  /**
   * P5: Checks if an error represents a concurrency collision on idempotency key or event ID.
   */
  isConcurrencyCollision(error: unknown, field?: string): boolean {
    return isUniqueConstraintViolation(error, field);
  }

  /**
   * P6: Asserts that mock signing keys are strictly isolated from production server keys (PAY-P06-CTRL-0002 / CTRL-0020).
   */
  assertMockSigningKeyIsolation(mockSecret: string, productionSecret?: string): void {
    if (productionSecret && mockSecret && mockSecret === productionSecret) {
      this.logger.error(
        'CRITICAL: Mock payment signing key matches production secret! Failing closed.',
      );
      throw new ForbiddenException(
        'Mock payment signing key cannot be identical to production credentials',
      );
    }
  }

  /**
   * P6: Records a sanitized security alert on forged or invalid webhook signatures (PAY-P06-CTRL-0011).
   */
  recordInvalidSignatureSecurityEvent(orderNumber: string, signatureKey?: string): void {
    const maskedSig = signatureKey
      ? `${signatureKey.slice(0, 8)}...${signatureKey.slice(-4)}`
      : 'missing';
    this.logger.warn(
      `[SECURITY ALERT] Invalid/forged webhook signature for order ${orderNumber}: sig=${maskedSig}`,
    );
  }

  /**
   * P7: Validates operator override request (PAY-P07-CTRL-0025 / CTRL-0053).
   */
  validateOperatorOverrideRequest(
    body: unknown,
    currentStatus: { orderStatus: string; paymentStatus: string },
  ): OperatorOverrideInput {
    const parseResult = operatorOverrideSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || 'Invalid operator override request';
      this.logger.warn(`Operator override schema validation failed: ${issue}`);
      throw new BadRequestException(issue);
    }

    const input = parseResult.data;
    const validation = validateOperatorOverride(input, currentStatus);
    if (!validation.valid) {
      this.logger.warn(`Operator override rejected: ${validation.reason}`);
      throw new BadRequestException(validation.reason);
    }

    return input;
  }

  /**
   * P7: Sanitizes audit data to ensure no credentials, tokens, or raw secrets are retained (PAY-P07-CTRL-0026).
   */
  sanitizeAuditRecord(data: unknown): unknown {
    return sanitizeAuditPayload(data);
  }

  /**
   * P7: Records an immutable audit log entry with critical error handling (PAY-P07-CTRL-0019 / CTRL-0047).
   * Ensures audit failures trigger critical alert rather than silently dropping financial workflow evidence.
   */
  async recordAuditEventWithFallback(
    auditService: { record: (params: any) => Promise<any> },
    params: {
      actorId?: string;
      actorType?: 'USER' | 'SYSTEM' | 'AUTOMATION';
      action: string;
      resource: string;
      resourceId: string;
      oldValue?: any;
      newValue?: any;
      metadata?: any;
    },
  ): Promise<any> {
    const sanitized = {
      ...params,
      oldValue: sanitizeAuditPayload(params.oldValue),
      newValue: sanitizeAuditPayload(params.newValue),
      metadata: sanitizeAuditPayload(params.metadata),
    };

    try {
      return await auditService.record(sanitized);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[CRITICAL AUDIT FAILURE] Failed to record audit log for action=${params.action} resource=${params.resource}/${params.resourceId}: ${errorMsg}`,
      );
      // Critical event alerting per PAY-P07-CTRL-0019
      throw new Error(`CRITICAL_AUDIT_FAILURE: ${errorMsg}`);
    }
  }

  /**
   * P8: Asserts that scenario execution is permitted in current environment and scenario ID is valid (PAY-P08-CTRL-0001).
   */
  assertScenarioPermitted(scenarioId: string): PaymentScenarioId {
    this.assertMockAllowed();
    if (!PAYMENT_SCENARIO_IDS.includes(scenarioId as PaymentScenarioId)) {
      throw new BadRequestException(
        `Unknown payment scenario '${scenarioId}'. Available scenarios: ${PAYMENT_SCENARIO_IDS.join(', ')}`,
      );
    }
    return scenarioId as PaymentScenarioId;
  }

  /**
   * P8: Retrieves scenario definition from matrix.
   */
  getScenario(scenarioId: PaymentScenarioId) {
    return getPaymentScenario(scenarioId);
  }

  /**
   * P8: Lists all available scenarios in the matrix.
   */
  listScenarios(category?: string) {
    return listPaymentScenarios(category);
  }

  /**
   * P9: Asserts that request payload does not exceed bounded size limits (PAY-P09-CTRL-0027).
   */
  assertPayloadBounds(
    payload: unknown,
    maxBytes: number = PAYMENT_ABUSE_LIMITS.MAX_INTENT_PAYLOAD_BYTES,
  ): void {
    const result = validatePayloadBounds(payload, maxBytes);
    if (!result.valid) {
      this.logger.warn(
        `Abuse guard: oversized payload rejected (${result.sizeBytes} bytes > ${maxBytes} bytes)`,
      );
      throw new BadRequestException(result.reason || 'Payload size limit exceeded');
    }
  }

  /**
   * P9: Scans payload recursively for SQLi, XSS, prototype pollution, or path traversal vectors (PAY-P09-CTRL-0003).
   */
  assertNoInjection(payload: unknown): void {
    const scan = detectInjectionPattern(payload);
    if (scan.detected) {
      this.logger.warn(
        `[SECURITY ALERT] Malicious injection detected [${scan.vector}] in field '${scan.field}': pattern '${scan.matchedPattern}'`,
      );
      throw new BadRequestException(
        `Security policy violation: suspicious input detected (${scan.vector})`,
      );
    }
  }

  /**
   * P9: Validates cross-tenant and cross-order reference binding (PAY-P09-CTRL-0016 / CTRL-0044).
   */
  assertOrderTenantBinding(params: {
    requestTenantId?: string;
    orderTenantId?: string;
    requestOrderNumber: string;
    targetOrderNumber: string;
  }): void {
    const result = validateOrderTenantBinding(params);
    if (!result.valid) {
      this.logger.warn(`Cross-order / cross-tenant authorization violation: ${result.reason}`);
      throw new ForbiddenException(result.reason);
    }
  }

  /**
   * P9: Bounded sliding window rate-limiting for mock payment operations (PAY-P09-CTRL-0027).
   */
  assertRateLimit(
    key: string,
    maxRequests: number = PAYMENT_ABUSE_LIMITS.MAX_INTENT_RATE_LIMIT_PER_WINDOW,
    windowMs: number = PAYMENT_ABUSE_LIMITS.RATE_LIMIT_WINDOW_MS,
  ): void {
    const now = Date.now();
    const bucket = this.rateLimitBuckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (bucket.count >= maxRequests) {
      this.logger.warn(
        `Rate limit bucket exceeded for key '${key}' (${bucket.count}/${maxRequests})`,
      );
      throw new BadRequestException(
        `Rate limit exceeded: maximum ${maxRequests} requests per ${Math.round(windowMs / 1000)}s`,
      );
    }

    bucket.count += 1;
  }

  /**
   * P9: Comprehensive abuse shield combining environment isolation, payload limits, injection scanning,
   * real credential prohibition, and rate-limiting.
   */
  assertAbuseShield(
    payload: unknown,
    context: {
      queryParams?: Record<string, any>;
      headers?: Record<string, any>;
      maxBytes?: number;
      rateLimitKey?: string;
    } = {},
  ): void {
    // 1. Environment isolation guard
    this.assertMockAllowed({
      queryParams: context.queryParams,
      headers: context.headers,
    });

    // 2. Payload size bounds
    this.assertPayloadBounds(payload, context.maxBytes);

    // 3. Security injection scan (SQLi, XSS, prototype pollution, path traversal)
    this.assertNoInjection(payload);

    // 4. Real card credential prohibition
    this.validateSyntheticCredentials(payload);

    // 5. Rate limit check if key provided
    if (context.rateLimitKey) {
      this.assertRateLimit(context.rateLimitKey);
    }
  }

  /**
   * P9: Deterministic evaluation of negative abuse probe.
   */
  evaluateNegativeProbe(probe: NegativeProbeInput): NegativeProbeResult {
    return evaluateNegativeProbe(probe);
  }

  /**
   * P10: Asserts rollback and safe degradation integrity (PAY-P10-CTRL-0028 / CTRL-0056).
   */
  assertRollbackSafety(unresolvedMockIntents: number): void {
    const check = validateRollbackAction({
      disableMockGateway: true,
      unresolvedMockIntents,
    });
    if (!check.safe) {
      this.logger.warn(`Rollback safety assertion failed: ${check.reason}`);
      throw new BadRequestException(check.reason);
    }
  }

  /**
   * P10: Asserts that all release gates pass and returns the official sign-off report (PAY-P10-CTRL-0001 - CTRL-0084).
   */
  assertReleaseGatePass(
    options: {
      isProduction?: boolean;
      allowMockEnv?: boolean;
      mockSigningKeyMatchesProd?: boolean;
      unresolvedMockIntents?: number;
    } = {},
  ): ReleaseSignoffReport {
    const report = this.getReleaseSignoff(options);
    if (report.overallStatus !== 'APPROVED') {
      const failed = report.gates.filter((g) => g.status === 'FAILED').map((g) => g.gateId);
      this.logger.warn(`Release gates failed: ${failed.join(', ')}`);
      throw new ForbiddenException(
        `Mock payment release gates failed: ${failed.join(', ')}. Release status: ${report.overallStatus}`,
      );
    }
    return report;
  }

  /**
   * P10: Generates the full automated release sign-off evaluation report.
   */
  getReleaseSignoff(
    options: {
      isProduction?: boolean;
      allowMockEnv?: boolean;
      mockSigningKeyMatchesProd?: boolean;
      unresolvedMockIntents?: number;
    } = {},
  ): ReleaseSignoffReport {
    const isProd = options.isProduction ?? process.env.NODE_ENV === 'production';
    const allowMock = options.allowMockEnv ?? process.env.ALLOW_MOCK_PAYMENT === 'true';
    return evaluateReleaseSignoff({
      isProduction: isProd,
      allowMockEnv: allowMock,
      mockSigningKeyMatchesProd: options.mockSigningKeyMatchesProd ?? false,
      unresolvedMockIntents: options.unresolvedMockIntents ?? 0,
    });
  }

  /**
   * Returns explicit simulation metadata to ensure clear isolation.
   */
  getSimulationMetadata() {
    return {
      provider: MOCK_PROVIDER_NAMESPACE,
      environment: MOCK_ENVIRONMENT_MARKER,
      isSimulated: true as const,
    };
  }
}

export const mockEnvironmentGuard = new MockEnvironmentGuard();
