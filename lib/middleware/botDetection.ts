/**
 * Bot & Crawler Detection
 *
 * Strategy:
 *  1. Trusted known good bots (search engines) → ALLOW
 *  2. Known aggressive scrapers / headless browsers → BLOCK
 *  3. Missing or suspiciously short UA → CHALLENGE (rate-limited more aggressively)
 *  4. Everything else → pass through to normal rate limiting
 */

export type BotVerdict = 'trusted' | 'blocked' | 'suspicious' | 'human';

// ---------------------------------------------------------------------------
// Trusted bots — allow unrestricted crawling
// Keep alphabetically sorted for easy review.
// ---------------------------------------------------------------------------
const TRUSTED_BOT_PATTERNS: RegExp[] = [
    /googlebot/i,
    /google-inspectiontool/i,
    /apis-google/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /sogou/i,
    /exabot/i,
    /facebot/i, // Facebook / Meta
    /ia_archiver/i, // Internet Archive
    /semrushbot/i, // SEMrush (allow — but subject to rate limit downstream if desired)
    /ahrefsbot/i, // Ahrefs
    /mj12bot/i, // Majestic
    /screaming frog/i,
    /vercelbot/i,
];

// ---------------------------------------------------------------------------
// Blocked bots — hard block, return 403
// ---------------------------------------------------------------------------
const BLOCKED_BOT_PATTERNS: RegExp[] = [
    // Generic scrapers
    /scrapy/i,
    /python-requests/i,
    /python-urllib/i,
    /go-http-client/i,
    /java\//i,
    /libwww-perl/i,
    /lwp-/i,
    /curl\//i,
    /wget\//i,
    /httpclient/i,
    /http_request/i,
    /mechanize/i,
    /node-fetch/i,
    /got\//i,
    /axios\//i,
    /ruby/i,
    // Headless browsers
    /phantomjs/i,
    /headlesschrome/i,
    /selenium/i,
    /webdriver/i,
    /puppeteer/i,
    /playwright/i,
    // Bulk content grabbers
    /httrack/i,
    /webcopier/i,
    /webcopy/i,
    /offline explorer/i,
    /teleport/i,
    /website ripper/i,
    /sitescooper/i,
    /sitesnagger/i,
    /blackwidow/i,
    /mass downloader/i,
    // Known spam / malicious
    /masscan/i,
    /nikto/i,
    /sqlmap/i,
    /nmap/i,
    /dirbuster/i,
    /zgrab/i,
    /zgrab2/i,
    /censys/i,
    /shodan/i,
];

// ---------------------------------------------------------------------------
// Suspicious patterns — UA present but looks automated
// ---------------------------------------------------------------------------
const SUSPICIOUS_PATTERNS: RegExp[] = [
    /okhttp/i,
    /dart:/i,
    /coldfusion/i,
    /perl/i,
    /winhttp/i,
    /java\//i,
    /cfnetwork/i, // iOS auto-update pings
];

/**
 * Classify an incoming User-Agent string.
 *
 * @param userAgent  The raw `user-agent` header value (or null if missing).
 * @returns 'trusted' | 'blocked' | 'suspicious' | 'human'
 */
export function classifyUserAgent(userAgent: string | null): BotVerdict {
    // No UA → high suspicion (real browsers always send one)
    if (!userAgent || userAgent.trim().length < 5) {
        return 'suspicious';
    }

    if (TRUSTED_BOT_PATTERNS.some((re) => re.test(userAgent))) {
        return 'trusted';
    }

    if (BLOCKED_BOT_PATTERNS.some((re) => re.test(userAgent))) {
        return 'blocked';
    }

    if (SUSPICIOUS_PATTERNS.some((re) => re.test(userAgent))) {
        return 'suspicious';
    }

    return 'human';
}
