type SupportedUnit = 'gm' | 'kg' | 'ml' | 'l' | 'pcs';

type Measurement = {
    value: number;
    unit: SupportedUnit;
};

type ProductLike = {
    title_en?: string | null;
    specifications_en?: string | null;
    unit_value?: number | string | null;
    unit_type?: string | null;
    shipping_charges?: number | string | null;
};

type VariantLike = {
    label?: string | null;
};

type CartLikeItem = {
    quantity?: number | null;
    product?: ProductLike | null;
    variant?: VariantLike | null;
    variant_label?: string | null;
};

export const SHIPPING_POLICY_LINES = [
    '0 to 1 kg: Rs.80',
    '1.1 to 2 kg: Rs.160',
    '2.1 to 3 kg: Rs.240',
    '3.1 to 4 kg: Rs.280',
    'More than 4 kg: Rs.300',
];

function getShippingChargeForBillableWeight(billableWeightKg: number): number {
    if (!Number.isFinite(billableWeightKg) || billableWeightKg <= 0) return 0;
    if (billableWeightKg <= 1) return 80;
    if (billableWeightKg <= 2) return 160;
    if (billableWeightKg <= 3) return 240;
    if (billableWeightKg <= 4) return 280;
    return 300;
}

const SIZE_PATTERN = /(\d+(?:\.\d+)?|\d+\s*\/\s*\d+)\s*(kg|kgs?|kilograms?|gm|gms?|grams?|g|ml|l|ltr|litre|liter|liters?|litres?|pcs?|pieces?)\b/i;

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function parseNumericToken(token: string): number | null {
    const compact = token.replace(/\s+/g, '');
    if (compact.includes('/')) {
        const [numerator, denominator] = compact.split('/');
        const top = Number(numerator);
        const bottom = Number(denominator);
        if (Number.isFinite(top) && Number.isFinite(bottom) && bottom !== 0) {
            return top / bottom;
        }
        return null;
    }

    const parsed = Number(compact);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUnit(rawUnit: string): SupportedUnit | null {
    const normalized = rawUnit.trim().toLowerCase();

    if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(normalized)) return 'kg';
    if (['g', 'gm', 'gms', 'gram', 'grams'].includes(normalized)) return 'gm';
    if (['ml'].includes(normalized)) return 'ml';
    if (['l', 'ltr', 'litre', 'liter', 'liters', 'litres'].includes(normalized)) return 'l';
    if (['pc', 'pcs', 'piece', 'pieces'].includes(normalized)) return 'pcs';

    return null;
}

export function extractMeasurementFromText(text: string | null | undefined): Measurement | null {
    if (!text) return null;

    const match = text.match(SIZE_PATTERN);
    if (!match) return null;

    const value = parseNumericToken(match[1]);
    const unit = normalizeUnit(match[2]);

    if (value === null || unit === null) return null;

    return { value, unit };
}

function getExplicitMeasurement(product: ProductLike | null | undefined): Measurement | null {
    if (!product) return null;

    const value = toNumber(product.unit_value);
    const unit = typeof product.unit_type === 'string' ? normalizeUnit(product.unit_type) : null;

    if (value === null || unit === null) return null;

    return { value, unit };
}

export function getProductMeasurement(product: ProductLike | null | undefined, variant?: VariantLike | null, variantLabel?: string | null): Measurement | null {
    const variantMeasurement = extractMeasurementFromText(variant?.label ?? variantLabel);
    if (variantMeasurement) return variantMeasurement;

    const explicitProductMeasurement = getExplicitMeasurement(product);
    if (explicitProductMeasurement && explicitProductMeasurement.unit !== 'pcs') {
        return explicitProductMeasurement;
    }

    const specificationMeasurement = extractMeasurementFromText(product?.specifications_en);
    if (specificationMeasurement) return specificationMeasurement;

    const titleMeasurement = extractMeasurementFromText(product?.title_en);
    if (titleMeasurement) return titleMeasurement;

    return explicitProductMeasurement;
}

export function measurementToWeightKg(measurement: Measurement | null): number {
    if (!measurement) return 0;

    switch (measurement.unit) {
        case 'kg':
            return measurement.value;
        case 'gm':
            return measurement.value / 1000;
        case 'l':
            return measurement.value;
        case 'ml':
            return measurement.value / 1000;
        case 'pcs':
            return 0;
        default:
            return 0;
    }
}

export function formatWeight(weightKg: number): string {
    if (!Number.isFinite(weightKg) || weightKg <= 0) return '0 kg';
    if (weightKg < 1) return `${Math.round(weightKg * 1000)} g`;
    if (Math.abs(weightKg - Math.round(weightKg)) < 0.001) return `${Math.round(weightKg)} kg`;
    return `${weightKg.toFixed(2).replace(/\.00$/, '').replace(/(\.\d*[1-9])0+$/, '$1')} kg`;
}

export function calculateWeightBasedShipping(items: CartLikeItem[]) {
    const totalActualWeightKg = items.reduce((sum, item) => {
        const quantity = typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? item.quantity : 0;
        const measurement = getProductMeasurement(item.product, item.variant, item.variant_label);
        return sum + measurementToWeightKg(measurement) * quantity;
    }, 0);

    const totalUnits = items.reduce((sum, item) => {
        const quantity = typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? item.quantity : 0;
        return sum + quantity;
    }, 0);

    const billableWeightKg = totalUnits > 0 ? Math.max(1, Math.ceil(totalActualWeightKg)) : 0;
    const shippingCharge = getShippingChargeForBillableWeight(billableWeightKg);

    return {
        totalActualWeightKg,
        billableWeightKg,
        shippingCharge,
        formattedActualWeight: formatWeight(totalActualWeightKg),
        formattedBillableWeight: formatWeight(billableWeightKg),
    };
}
