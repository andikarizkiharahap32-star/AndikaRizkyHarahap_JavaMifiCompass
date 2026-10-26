import { Injectable } from '@nestjs/common';
import {
  EsimPackage,
  EsimProviderPort,
  EsimUsageResult,
  ProvisionEsimParams,
  ProvisionedEsimResult,
} from './esim-provider.interface';

@Injectable()
export class MockEsimAdapter implements EsimProviderPort {
  readonly mode = 'mock';

  // In-memory provisioned records for sandbox simulation
  private readonly provisioned = new Map<string, { usedMb: number; limitMb: number; expiresAt: Date }>();

  async browsePackages(countryCode: string): Promise<EsimPackage[]> {
    const code = countryCode.toUpperCase();
    return [
      {
        id: `mock-pkg-${code}-1gb-7d`,
        countryCode: code,
        name: `${code} 1GB 7 Days Standard`,
        dataLimitMb: 1024,
        durationDays: 7,
        priceUsd: 4.5,
        priceIdr: 70_000,
        operator: 'Local Tier-1 Partner',
      },
      {
        id: `mock-pkg-${code}-5gb-15d`,
        countryCode: code,
        name: `${code} 5GB 15 Days Explorer`,
        dataLimitMb: 5120,
        durationDays: 15,
        priceUsd: 14.0,
        priceIdr: 215_000,
        operator: 'Local Tier-1 Partner',
      },
      {
        id: `mock-pkg-${code}-10gb-30d`,
        countryCode: code,
        name: `${code} 10GB 30 Days Unlimited FUP`,
        dataLimitMb: 10240,
        durationDays: 30,
        priceUsd: 25.0,
        priceIdr: 385_000,
        operator: 'Local Tier-1 Partner',
      },
    ];
  }

  async provisionEsim(params: ProvisionEsimParams): Promise<ProvisionedEsimResult> {
    // Generate simulated 19-digit ICCID (Standard telecom format)
    const iccid = `89852${Math.floor(Math.random() * 1e14).toString().padStart(14, '0')}`;
    const smdpAddress = 'lpa.javamifi.mock.esim.net';
    const matchingId = `TEST-${params.orderNumber}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const activationCode = `LPA:1$${smdpAddress}$${matchingId}`;

    // SVG / Data URL for QR Code presentation
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activationCode)}`;
    const directInstallUrl = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(activationCode)}`;

    // Store simulated quota
    this.provisioned.set(iccid, {
      usedMb: 350, // simulated initial usage
      limitMb: 5120,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    });

    return {
      iccid,
      activationCode,
      qrCodeUrl,
      directInstallUrl,
      apn: 'globaldata',
      instructions: {
        ios: [
          'Go to Settings > Cellular / Mobile Data',
          'Tap "Add eSIM" or "Add Cellular Plan"',
          'Select "Use QR Code" and scan the code shown on this screen',
          'Turn on Data Roaming for your JavaMifi eSIM profile upon arrival',
        ],
        android: [
          'Go to Settings > Network & Internet > SIMs',
          'Tap "Download a SIM instead" or "+" next to Mobile network',
          'Scan the QR code displayed on this Trip Hub page',
          'Set APN to "globaldata" and enable Data Roaming in the destination',
        ],
      },
    };
  }

  async checkUsage(iccid: string): Promise<EsimUsageResult> {
    const record = this.provisioned.get(iccid) || {
      usedMb: 1200,
      limitMb: 5120,
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    };

    const pct = Math.min(100, Math.round((record.usedMb / record.limitMb) * 100));

    return {
      iccid,
      dataUsedMb: record.usedMb,
      dataLimitMb: record.limitMb,
      percentageUsed: pct,
      expiresAt: record.expiresAt.toISOString(),
      status: pct >= 100 ? 'DEPLETED' : 'ACTIVE',
    };
  }

  async topUp(iccid: string, packageId: string): Promise<{ success: boolean; newLimitMb: number }> {
    const record = this.provisioned.get(iccid);
    const addedMb = packageId.includes('1gb') ? 1024 : 5120;

    if (record) {
      record.limitMb += addedMb;
      this.provisioned.set(iccid, record);
      return { success: true, newLimitMb: record.limitMb };
    }

    return { success: true, newLimitMb: addedMb };
  }
}
