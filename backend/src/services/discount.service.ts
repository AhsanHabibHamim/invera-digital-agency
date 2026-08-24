interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxUses?: number;
  currentUses: number;
  expiresAt?: Date;
  isActive: boolean;
}

const DISCOUNT_CODES: Record<string, DiscountCode> = {
  'WELCOME10': { code: 'WELCOME10', type: 'percentage', value: 10, maxUses: 100, currentUses: 0, isActive: true },
  'SAVE50': { code: 'SAVE50', type: 'fixed', value: 50, minAmount: 200, maxUses: 50, currentUses: 0, isActive: true },
};

export function validateDiscountCode(code: string, total: number): { valid: boolean; discountAmount: number; message: string } {
  const upper = code.toUpperCase();
  const discount = DISCOUNT_CODES[upper];

  if (!discount) {
    return { valid: false, discountAmount: 0, message: 'Invalid discount code' };
  }

  if (!discount.isActive) {
    return { valid: false, discountAmount: 0, message: 'Discount code is expired' };
  }

  if (discount.maxUses && discount.currentUses >= discount.maxUses) {
    return { valid: false, discountAmount: 0, message: 'Discount code has reached its usage limit' };
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return { valid: false, discountAmount: 0, message: 'Discount code has expired' };
  }

  if (discount.minAmount && total < discount.minAmount) {
    return { valid: false, discountAmount: 0, message: `Minimum order amount is $${discount.minAmount}` };
  }

  let discountAmount: number;
  if (discount.type === 'percentage') {
    discountAmount = Math.round((total * discount.value) / 100 * 100) / 100;
  } else {
    discountAmount = Math.min(discount.value, total);
  }

  discount.currentUses++;

  return { valid: true, discountAmount, message: `Discount applied: ${discount.code}` };
}
