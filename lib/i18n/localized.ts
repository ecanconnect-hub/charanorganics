export function resolveLocalizedText(
    englishText?: string | null,
    localizedText?: string | null
): string {
    const en = (englishText || '').trim();
    const local = (localizedText || '').trim();

    if (!local) return en;

    const compact = local.replace(/\s+/g, '');
    const hasTelugu = /[\u0C00-\u0C7F]/.test(local);
    const questionMarks = (compact.match(/\?/g) || []).length;
    const questionRatio = questionMarks / Math.max(compact.length, 1);
    const hasReplacementChar = local.includes('�');
    const onlyPunctuationLike = /^[?._/\-|]+$/.test(compact);

    const looksBroken =
        !hasTelugu && (questionRatio > 0.2 || hasReplacementChar || onlyPunctuationLike);

    return looksBroken ? en || local : local;
}
