import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

type GuestOrderTokenPayload = {
    orderId: string;
    purpose: 'guest_payment' | 'guest_tracking';
    exp: number;
};

const DEFAULT_GUEST_ORDER_TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes
const DEFAULT_GUEST_TRACKING_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getTokenSecret(): string {
    const secret = process.env.GUEST_ORDER_TOKEN_SECRET;

    if (!secret || secret.trim().length < 32) {
        throw new Error('GUEST_ORDER_TOKEN_SECRET is missing or too short.');
    }

    return secret;
}

function encodeBase64Url(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payloadBase64: string, secret: string): string {
    return createHmac('sha256', secret).update(payloadBase64).digest('base64url');
}

export function createGuestOrderToken(orderId: string, ttlSeconds = DEFAULT_GUEST_ORDER_TOKEN_TTL_SECONDS): string {
    const secret = getTokenSecret();

    const payload: GuestOrderTokenPayload = {
        orderId,
        purpose: 'guest_payment',
        exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };

    const payloadBase64 = encodeBase64Url(JSON.stringify(payload));
    const signatureBase64 = signPayload(payloadBase64, secret);
    return `${payloadBase64}.${signatureBase64}`;
}

export function createGuestTrackingToken(orderId: string, ttlSeconds = DEFAULT_GUEST_TRACKING_TOKEN_TTL_SECONDS): string {
    const secret = getTokenSecret();

    const payload: GuestOrderTokenPayload = {
        orderId,
        purpose: 'guest_tracking',
        exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };

    const payloadBase64 = encodeBase64Url(JSON.stringify(payload));
    const signatureBase64 = signPayload(payloadBase64, secret);
    return `${payloadBase64}.${signatureBase64}`;
}

export function verifyGuestOrderToken(
    token: string,
    expectedOrderId: string,
    allowedPurposes: Array<GuestOrderTokenPayload['purpose']> = ['guest_payment']
): boolean {
    try {
        const secret = getTokenSecret();
        const [payloadBase64, signatureBase64] = token.split('.');

        if (!payloadBase64 || !signatureBase64) {
            return false;
        }

        const expectedSignature = signPayload(payloadBase64, secret);
        const providedBuffer = Buffer.from(signatureBase64, 'base64url');
        const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

        if (providedBuffer.length !== expectedBuffer.length) {
            return false;
        }

        if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
            return false;
        }

        const payload = JSON.parse(decodeBase64Url(payloadBase64)) as GuestOrderTokenPayload;
        const now = Math.floor(Date.now() / 1000);

        if (!allowedPurposes.includes(payload.purpose)) {
            return false;
        }

        if (payload.orderId !== expectedOrderId) {
            return false;
        }

        if (payload.exp <= now) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}
