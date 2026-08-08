export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function isValidCouponCode(code: string) {
  return /^[A-Z0-9_-]+$/.test(code);
}
