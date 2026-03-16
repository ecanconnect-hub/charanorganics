const MAX_EMAIL_LENGTH = 254;

export function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

// "Probably valid" email check to catch common typos and formatting issues.
// Final validation still happens server-side.
export function isProbablyValidEmail(value: string): boolean {
    const email = normalizeEmail(value);
    if (!email || email.length > MAX_EMAIL_LENGTH) return false;
    if (/\s/.test(email)) return false;
    if (email.includes('\u0000')) return false;

    const atIndex = email.indexOf('@');
    if (atIndex <= 0) return false;
    if (atIndex !== email.lastIndexOf('@')) return false;

    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);
    if (!local || !domain) return false;
    if (local.length > 64) return false;
    if (domain.length > 255) return false;
    if (!domain.includes('.')) return false;

    if (local.startsWith('.') || local.endsWith('.')) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    if (local.includes('..') || domain.includes('..')) return false;

    // Basic character allow-list (RFC is broader; this is a pragmatic subset).
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
    if (!/^[a-z0-9.-]+$/i.test(domain)) return false;

    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) return false;

    return true;
}

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gnail.com': 'gmail.com',
    'hotnail.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outllok.com': 'outlook.com',
    'outlook.con': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
};

export function getEmailTypoSuggestion(value: string): string | null {
    const email = normalizeEmail(value);
    const atIndex = email.indexOf('@');
    if (atIndex < 0) return null;
    const domain = email.slice(atIndex + 1);
    if (!domain) return null;

    const suggestedDomain = COMMON_DOMAIN_TYPOS[domain];
    if (!suggestedDomain) return null;
    return `${email.slice(0, atIndex + 1)}${suggestedDomain}`;
}

