export interface MFASecretResult {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

export interface MFAVerifyResult {
  valid: boolean;
  remainingBackupCodes?: number;
}

export interface MFASetupResult {
  backupCodes: string[];
}

export interface MFAStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
}
