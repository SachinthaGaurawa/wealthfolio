// src/lib/encryption.ts
import CryptoJS from 'crypto-js';

const SALT = process.env.NEXT_PUBLIC_ENCRYPTION_SALT |

| 'default-fallback-secure-salt-xyz-987';

export const deriveKey = (passcode: string): string => {
  return CryptoJS.PBKDF2(passcode, SALT, {
    keySize: 256 / 32,
    iterations: 5000
  }).toString();
};

export const encryptData = (data: any, passcode: string): string => {
  const key = deriveKey(passcode);
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, key).toString();
};

export const decryptData = (cipherText: string, passcode: string): any => {
  try {
    const key = deriveKey(passcode);
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) throw new Error("Decryption failed. Invalid passcode.");
    return JSON.parse(decryptedString);
  } catch (error) {
    return null;
  }
};
