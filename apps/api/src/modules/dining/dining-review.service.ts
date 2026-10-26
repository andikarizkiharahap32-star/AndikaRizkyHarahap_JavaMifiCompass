import { Injectable, NotFoundException, Optional, Logger } from '@nestjs/common';
import {
  DiningReportCreateDto,
  DiningReviewItem,
  DiningSafetyStatus,
  HalalTier,
} from '@javamifi/shared';
import { DiningOutboxService } from './dining-outbox.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DiningReviewService {
  private readonly logger = new Logger(DiningReviewService.name);
  private readonly storagePath = path.resolve(process.cwd(), 'data/dining-reviews.json');

  private safetyStatus: DiningSafetyStatus = {
    isAiEnrichmentEnabled: true,
    dailyTokenBudget: 2000000,
    tokensUsedToday: 418290,
    dailyRequestLimit: 500,
    requestsUsedToday: 104,
    killSwitchActive: false,
    lastResetAt: new Date().toISOString(),
  };

  private reviewQueue: DiningReviewItem[] = [];

  constructor(
    @Optional() private readonly outboxService?: DiningOutboxService,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly prisma?: PrismaService
  ) {
    this.loadPersistedQueue();
  }

  private loadPersistedQueue() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.reviewQueue = parsed;
          return;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not read persisted dining review queue: ${err?.message}`);
    }

    // Default Seeded Items
    this.reviewQueue = [
      {
        id: 'rev-001',
        placeId: 'gold-jp-16',
        placeName: 'Adversarial Injection Ramen Tokyo',
        countryIso2: 'JP',
        type: 'ADVERSARIAL_ALERT',
        currentTier: HalalTier.NOT_HALAL,
        reason: 'SECURITY ALERT: Prompt Injection pattern detected (/ignore previous instructions/i). Model bypassed; tier locked to NOT_HALAL.',
        status: 'PENDING',
        createdAt: '2026-10-26T14:10:00.000Z',
      },
      {
        id: 'rev-002',
        placeId: 'gold-gb-18',
        placeName: 'Unverified Google Review Cafe London',
        countryIso2: 'GB',
        type: 'QUOTE_MISMATCH',
        currentTier: HalalTier.UNKNOWN,
        reason: 'Klaim lisan dari pelayan tanpa sertifikat tertulis resmi. Memerlukan audit fisik atau kontak certifier.',
        status: 'PENDING',
        createdAt: '2026-10-26T15:20:00.000Z',
      },
      {
        id: 'rev-003',
        placeId: 'dining-jp-004',
        placeName: 'Halal Sakura Ginza',
        countryIso2: 'JP',
        type: 'USER_DISPUTE',
        currentTier: HalalTier.OPTIONS,
        reason: 'Pengguna melaporkan sajian seasonal dessert mengandung gelatin hewani tanpa label bebas babi.',
        status: 'PENDING',
        createdAt: '2026-10-26T16:05:00.000Z',
      },
    ];

    this.persistQueue();
  }

  private persistQueue() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storagePath, JSON.stringify(this.reviewQueue, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.warn(`Could not persist dining review queue: ${err?.message}`);
    }
  }

  getReviewQueue(): DiningReviewItem[] {
    return this.reviewQueue;
  }

  submitReport(dto: DiningReportCreateDto): DiningReviewItem {
    // Keyword-Urgency Triage: bump priority on safety-critical keywords
    const safetyKeywords = ['pork', 'babi', 'mirin', 'sake', 'expired', 'kadaluwarsa', 'closed', 'tutup', 'non-halal', 'alkohol'];
    const commentLower = (dto.userComment + ' ' + dto.disputeReason).toLowerCase();
    const hasCriticalKeyword = safetyKeywords.some((kw) => commentLower.includes(kw));

    // Fail-closed tier assignment for safety disputes
    const assignedTier = hasCriticalKeyword
      ? (dto.suggestedTier === HalalTier.NOT_HALAL ? HalalTier.NOT_HALAL : HalalTier.UNKNOWN)
      : (dto.suggestedTier || HalalTier.UNKNOWN);

    const reasonPrefix = hasCriticalKeyword ? '[CRITICAL_SAFETY: Contaminant/Halal Alert] ' : '';

    const newItem: DiningReviewItem = {
      id: `rev-${Date.now().toString(36)}`,
      placeId: dto.placeId,
      placeName: dto.placeName,
      countryIso2: 'JP', // default
      type: 'USER_DISPUTE',
      currentTier: assignedTier,
      reason: `${reasonPrefix}[${dto.disputeReason}] ${dto.userComment}${
        dto.reporterEmail ? ` (Dilaporkan oleh: ${dto.reporterEmail})` : ''
      }`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Critical safety items are prepended at the head of the review queue
    this.reviewQueue.unshift(newItem);
    this.persistQueue();

    // Emit signed outbox event for async notification / n8n triage workflow
    try {
      const signedEvent = this.outboxService?.createSignedPayload(
        dto.placeId,
        dto.placeName,
        'JP',
        dto.userComment,
        dto.disputeReason
      );

      if (this.prisma && signedEvent) {
        this.prisma.outboxEvent
          .create({
            data: {
              eventType: 'dining.report_submitted',
              aggregateId: newItem.id,
              payload: signedEvent.payload as any,
              status: 'PENDING',
            },
          })
          .catch((err: any) =>
            this.logger.warn(`Could not write to Postgres outbox_events: ${err?.message}`)
          );
      }
    } catch (err: any) {
      this.logger.warn(`Outbox event generation skipped: ${err?.message}`);
    }

    return newItem;
  }

  resolveItem(
    id: string,
    resolution: {
      action: 'OVERRIDE_TIER' | 'DISMISS';
      overrideTier?: HalalTier;
      resolvedBy: string;
      notes?: string;
    }
  ): DiningReviewItem {
    const item = this.reviewQueue.find((q) => q.id === id);
    if (!item) {
      throw new NotFoundException(`Review item ${id} not found`);
    }

    const oldTier = item.currentTier;
    item.status = resolution.action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
    item.resolvedAt = new Date().toISOString();
    item.resolvedBy = resolution.resolvedBy;
    item.actionTaken =
      resolution.action === 'DISMISS'
        ? `Laporan diabaikan: ${resolution.notes || 'Data terbukti valid'}`
        : `Tier diubah menjadi ${resolution.overrideTier || item.currentTier}. ${resolution.notes || ''}`;

    if (resolution.action === 'OVERRIDE_TIER' && resolution.overrideTier) {
      item.currentTier = resolution.overrideTier;
    }

    this.persistQueue();

    // Record immutable audit log (C11 Admin CMS review pattern)
    try {
      this.auditService
        ?.record({
          actorId: resolution.resolvedBy,
          actorType: 'USER',
          action: resolution.action === 'DISMISS' ? 'DINING_DISPUTE_DISMISSED' : 'DINING_TIER_OVERRIDE',
          resource: 'dining_review',
          resourceId: id,
          oldValue: { tier: oldTier, status: 'PENDING' },
          newValue: { tier: item.currentTier, status: item.status, actionTaken: item.actionTaken },
          metadata: {
            placeId: item.placeId,
            placeName: item.placeName,
            notes: resolution.notes,
          },
        })
        .catch((err: any) =>
          this.logger.warn(`Could not write immutable audit log: ${err?.message}`)
        );
    } catch (err: any) {
      this.logger.warn(`AuditService call skipped: ${err?.message}`);
    }

    return item;
  }

  getSafetyStatus(): DiningSafetyStatus {
    return this.safetyStatus;
  }

  toggleKillSwitch(active: boolean): DiningSafetyStatus {
    this.safetyStatus.killSwitchActive = active;
    this.safetyStatus.isAiEnrichmentEnabled = !active;
    return this.safetyStatus;
  }
}
