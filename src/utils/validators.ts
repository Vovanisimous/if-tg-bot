import { PHONE_REGEX_PATTERNS } from '../constants';

export function isValidVisitorCount(count: number): boolean {
  return Number.isInteger(count) && count > 0 && count < 100;
}

export function isValidRussianPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return PHONE_REGEX_PATTERNS.some((pattern) => pattern.test(phone) || pattern.test(cleaned));
}

export function formatRussianPhoneNumber(phone: string): string {
  // Always format as +7 (999) 999-99-99
  const cleaned = phone.replace(/\D/g, '');
  let digits = cleaned;
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  // fallback: return original
  return phone;
}
