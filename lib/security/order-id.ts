export const ORDER_ID_PATTERN = /^ORD-\d{8}-\d{3,}$/;

export function normalizeOrderId(value: string): string {
    return value.trim().toUpperCase();
}

export function isValidOrderId(value: string): boolean {
    return ORDER_ID_PATTERN.test(normalizeOrderId(value));
}

