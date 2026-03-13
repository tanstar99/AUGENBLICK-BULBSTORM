export const sanitizeToDigits = (value = "") => String(value).replace(/\D/g, "");

export const extractPhoneFromChatId = (chatId = "") => {
  const base = String(chatId).split("@")[0] || "";
  return sanitizeToDigits(base);
};

export const normalizePhoneForStorage = (value = "") => {
  let digits = sanitizeToDigits(value);

  if (!digits) return "";

  // Handle international prefix format like 0091xxxxxxxxxx
  if (digits.startsWith("00") && digits.length > 4) {
    digits = digits.slice(2);
  }

  // Handle local format 0xxxxxxxxxx
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Default to India for 10-digit local numbers
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Explicit Indian country code without +
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  // Keep other country formats in +<digits>
  return `+${digits}`;
};

export const normalizeIndianPhone = (value = "") => {
  const digits = sanitizeToDigits(normalizePhoneForStorage(value));

  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
};

export const buildPhoneCandidates = (value = "") => {
  const rawDigits = sanitizeToDigits(value);
  const normalized = normalizeIndianPhone(rawDigits);

  const candidates = new Set();

  if (rawDigits) {
    candidates.add(rawDigits);
    candidates.add(`+${rawDigits}`);
  }

  if (normalized) {
    candidates.add(normalized);
    candidates.add(`+${normalized}`);

    if (normalized.startsWith("91") && normalized.length === 12) {
      const tenDigit = normalized.slice(2);
      candidates.add(tenDigit);
      candidates.add(`+${tenDigit}`);
    }
  }

  return Array.from(candidates).filter(Boolean);
};
