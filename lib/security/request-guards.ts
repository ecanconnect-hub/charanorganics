import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_FETCH_SITES = new Set(['same-origin', 'same-site', 'none']);

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store',
};

function getExpectedOrigin(request: NextRequest): string {
    // Use Next.js' resolved request origin instead of trusting forwarded
    // host/proto headers from the client request path.
    return request.nextUrl.origin;
}

function forbidden(message: string): NextResponse {
    return NextResponse.json(
        { error: message },
        {
            status: 403,
            headers: NO_STORE_HEADERS,
        }
    );
}

export function enforceSameOriginPost(request: NextRequest): NextResponse | null {
    if (request.method !== 'POST') {
        return null;
    }

    // Reject obvious browser cross-site requests before any expensive work.
    const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase();
    if (fetchSite && !ALLOWED_FETCH_SITES.has(fetchSite)) {
        return forbidden('Cross-site request blocked');
    }

    // For browser-originated requests, Origin must match this host.
    const originHeader = request.headers.get('origin');
    if (originHeader) {
        let parsedOrigin: URL;
        try {
            parsedOrigin = new URL(originHeader);
        } catch {
            return forbidden('Invalid request origin');
        }

        if (parsedOrigin.origin !== getExpectedOrigin(request)) {
            return forbidden('Invalid request origin');
        }
    }

    return null;
}

export function enforceJsonPost(request: NextRequest): NextResponse | null {
    if (request.method !== 'POST') {
        return null;
    }

    const contentType = request.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.startsWith('application/json')) {
        return NextResponse.json(
            { error: 'Unsupported content type' },
            {
                status: 415,
                headers: NO_STORE_HEADERS,
            }
        );
    }

    return null;
}

export function enforceSecureJsonPostRequest(request: NextRequest): NextResponse | null {
    const originError = enforceSameOriginPost(request);
    if (originError) return originError;

    return enforceJsonPost(request);
}
