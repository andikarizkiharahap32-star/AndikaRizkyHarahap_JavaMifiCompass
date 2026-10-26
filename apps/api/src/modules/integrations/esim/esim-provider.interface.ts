export interface EsimPackage {
  id: string;
  countryCode: string;
  name: string;
  dataLimitMb: number;
  durationDays: number;
  priceUsd: number;
  priceIdr: number;
  operator: string;
}

export interface ProvisionEsimParams {
  orderNumber: string;
  countryCode: string;
  packageId: string;
  customerEmail: string;
}

export interface ProvisionedEsimResult {
  iccid: string;
  activationCode: string;
  qrCodeUrl: string;
  directInstallUrl: string;
  apn: string;
  instructions: {
    ios: string[];
    android: string[];
  };
}

export interface EsimUsageResult {
  iccid: string;
  dataUsedMb: number;
  dataLimitMb: number;
  percentageUsed: number;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
}

export interface EsimProviderPort {
  readonly mode: string;
  browsePackages(countryCode: string): Promise<EsimPackage[]>;
  provisionEsim(params: ProvisionEsimParams): Promise<ProvisionedEsimResult>;
  checkUsage(iccid: string): Promise<EsimUsageResult>;
  topUp(iccid: string, packageId: string): Promise<{ success: boolean; newLimitMb: number }>;
}
