import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DiningReportCreateDto,
  DiningReviewItem,
  DiningSafetyStatus,
  HalalTier,
} from '@javamifi/shared';

@Injectable()
export class DiningReviewService {
  private safetyStatus: DiningSafetyStatus = {
    isAiEnrichmentEnabled: true,
    dailyTokenBudget: 2000000,
    tokensUsedToday: 418290,
    dailyRequestLimit: 500,
    requestsUsedToday: 104,
    killSwitchActive: false,
    lastResetAt: new Date().toISOString(),
  };

  private reviewQueue: DiningReviewItem[] = [
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
