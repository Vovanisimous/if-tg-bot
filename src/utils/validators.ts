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

export function isValidRussianHumanName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  // Accept 2..40 Cyrillic letters (including ё/Ё), allow single space or hyphen between parts
  if (trimmed.length < 2 || trimmed.length > 40) return false;
  const pattern = /^(?=.{2,40}$)[А-Яа-яЁё]+(?:[ -][А-Яа-яЁё]+)*$/u;
  return pattern.test(trimmed);
}
