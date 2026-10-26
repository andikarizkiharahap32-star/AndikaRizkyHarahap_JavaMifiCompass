import { Injectable, Logger } from '@nestjs/common';
import { generateHmacSha256, verifyHmacSha256 } from '@javamifi/shared';
import * as crypto from 'crypto';

export interface EnrichmentRequestPayload {
  runId: string;
  placeId: string;
  placeName: string;
  countryCode: string;
  rawEvidence: string;
  rawMenu?: string;
  timestamp: string;
}

@Injectable()
export class DiningOutboxService {
  private readonly logger = new Logger(DiningOutboxService.name);
  private readonly webhookSecret =
    process.env.DINING_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET ||
    'compass-dining-enrichment-secret-32chars';

  /**
   * Create signed payload for outbox delivery to n8n enrichment workflow.
   */
  createSignedPayload(placeId: string, placeName: string, countryCode: string, rawEvidence: string, rawMenu?: string) {
    const runId = `run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = Date.now().toString();

    const payload: EnrichmentRequestPayload = {
      runId,
      placeId,
      placeName,
      countryCode,
      rawEvidence,
      rawMenu,
      timestamp,
    };

    const payloadString = JSON.stringify(payload);
    const signature = generateHmacSha256(`${timestamp}.${payloadString}`, this.webhookSecret);

    return {
      payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Javamifi-Run-Id': runId,
        'X-Javamifi-Timestamp': timestamp,
        'X-Javamifi-Signature': signature,
      },
    };
  }

  /**
   * Verify HMAC signature on incoming callback from n8n orchestrator.
   */
  verifyIncomingCallback(payloadString: string, timestamp: string, signature: string): boolean {
    if (!signature || !timestamp) {
      return false;
    }
    const signedData = `${timestamp}.${payloadString}`;
    return verifyHmacSha256(signedData, signature, this.webhookSecret);
  }
}
