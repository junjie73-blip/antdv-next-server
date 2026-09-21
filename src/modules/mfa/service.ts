import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "@config/database.js";
import { encrypt, decrypt } from "@/core/security/crypto.js";
import { env as config } from "@config/env.js";
import { logger } from "@/platform/logger/index.js";
import bcryptjs from "bcryptjs";
import {
  MFASecretResult,
  MFASetupResult,
  MFAVerifyResult,
  MFAStatus,
} from "./types.js";

const MFA_ISSUER = config.MFA_ISSUER;

export async function generateSecret(userId: string): Promise<MFASecretResult> {
  const secret = speakeasy.generateSecret({
    name: `${MFA_ISSUER} (User:${userId.slice(0, 8)})`,
    length: 32,
  });

  const otpauthUrl = secret.otpauth_url!;
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  const encryptedSecret = encrypt(secret.base32);
  await prisma.sys_mfa_config.upsert({
    where: { user_id: userId },
    update: { secret: encryptedSecret, enabled: 0, backup_codes: null },
    create: { user_id: userId, secret: encryptedSecret, enabled: 0 },
  });

  logger.info({ userId }, "MFA secret generated");
  return { secret: secret.base32, qrCodeUrl, otpauthUrl };
}

export async function verifyAndEnable(
  userId: string,
  token: string,
): Promise<MFASetupResult> {
  const config = await prisma.sys_mfa_config.findUnique({
    where: { user_id: userId },
  });
  if (!config) throw new Error("MFA not initialized");
  if (config.enabled === 1) throw new Error("MFA already enabled");

  const secret = decrypt(config.secret);
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2,
  });

  if (!verified) throw new Error("Invalid verification code");

  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );
  const hashedBackupCodes = backupCodes.map((code) =>
    bcryptjs.hashSync(code, 10),
  );

  await prisma.sys_mfa_config.update({
    where: { user_id: userId },
    data: { enabled: 1, backup_codes: JSON.stringify(hashedBackupCodes) },
  });

  logger.info({ userId }, "MFA enabled successfully");
  return { backupCodes };
}

export async function verifyToken(
  userId: string,
  token: string,
): Promise<MFAVerifyResult> {
  const mfaConfig = await prisma.sys_mfa_config.findUnique({
    where: { user_id: userId },
  });
  if (!mfaConfig || mfaConfig.enabled !== 1) {
    return { valid: false };
  }

  const secret = decrypt(mfaConfig.secret);

  const totpValid = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2,
  });

  if (totpValid) {
    return { valid: true };
  }

  if (mfaConfig.backup_codes) {
    const codes: string[] = JSON.parse(mfaConfig.backup_codes);
    for (let i = 0; i < codes.length; i++) {
      if (bcryptjs.compareSync(token, codes[i])) {
        codes.splice(i, 1);
        await prisma.sys_mfa_config.update({
          where: { user_id: userId },
          data: { backup_codes: JSON.stringify(codes) },
        });
        logger.info({ userId }, "MFA verified with backup code");
        return { valid: true, remainingBackupCodes: codes.length };
      }
    }
  }

  return { valid: false };
}

export async function disableMFA(userId: string, token: string): Promise<void> {
  const valid = await verifyToken(userId, token);
  if (!valid.valid) throw new Error("Invalid MFA token");

  await prisma.sys_mfa_config.delete({ where: { user_id: userId } });
  logger.info({ userId }, "MFA disabled");
}

export async function getMFAStatus(userId: string): Promise<MFAStatus> {
  const config = await prisma.sys_mfa_config.findUnique({
    where: { user_id: userId },
  });
  if (!config) return { enabled: false, hasBackupCodes: false };
  return {
    enabled: config.enabled === 1,
    hasBackupCodes:
      !!config.backup_codes && JSON.parse(config.backup_codes).length > 0,
  };
}

export async function regenerateBackupCodes(
  userId: string,
  token: string,
): Promise<string[]> {
  const valid = await verifyToken(userId, token);
  if (!valid.valid) throw new Error("Invalid MFA token");

  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );
  const hashedBackupCodes = backupCodes.map((code) =>
    bcryptjs.hashSync(code, 10),
  );

  await prisma.sys_mfa_config.update({
    where: { user_id: userId },
    data: { backup_codes: JSON.stringify(hashedBackupCodes) },
  });

  return backupCodes;
}
