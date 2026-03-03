import dns from 'node:dns';

const PUBLIC_DNS_SERVERS = ['1.1.1.1', '8.8.8.8'];

let patched = false;

type LookupAddress = {
    address: string;
    family: number;
};

function normalizeHostname(value: string): string {
    return value.replace(/\.$/, '').toLowerCase();
}

function getTargetHostname(): string | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;

    try {
        return normalizeHostname(new URL(supabaseUrl).hostname);
    } catch {
        return null;
    }
}

function parseLookupArgs(optionsOrCallback: unknown, maybeCallback: unknown) {
    let options: dns.LookupOneOptions | dns.LookupAllOptions | number | undefined;
    let callback: ((...args: unknown[]) => void) | undefined;

    if (typeof optionsOrCallback === 'function') {
        callback = optionsOrCallback as (...args: unknown[]) => void;
        options = undefined;
    } else {
        options = optionsOrCallback as dns.LookupOneOptions | dns.LookupAllOptions | number | undefined;
        callback = maybeCallback as ((...args: unknown[]) => void) | undefined;
    }

    return { options, callback };
}

export function ensureSupabaseDnsRouting() {
    if (patched) return;

    const targetHostname = getTargetHostname();
    if (!targetHostname) return;

    const resolver = new dns.Resolver();
    resolver.setServers(PUBLIC_DNS_SERVERS);

    const originalLookup = dns.lookup.bind(dns);

    dns.lookup = ((hostname: string, optionsOrCallback?: unknown, maybeCallback?: unknown) => {
        const normalizedHost = normalizeHostname(String(hostname || ''));
        const { options, callback } = parseLookupArgs(optionsOrCallback, maybeCallback);

        if (!callback) {
            return (originalLookup as unknown as (...args: unknown[]) => unknown)(hostname, optionsOrCallback, maybeCallback);
        }

        if (normalizedHost !== targetHostname) {
            return (originalLookup as unknown as (...args: unknown[]) => unknown)(hostname, optionsOrCallback, maybeCallback);
        }

        const opts = typeof options === 'number' ? { family: options } : (options || {});
        const requestedFamily = typeof opts.family === 'number' ? opts.family : 0;
        const all = typeof opts === 'object' && opts !== null && 'all' in opts ? Boolean((opts as dns.LookupAllOptions).all) : false;

        const resolve4 = () =>
            new Promise<LookupAddress[]>((resolve) => {
                resolver.resolve4(hostname, (err, addresses) => {
                    if (err || !addresses?.length) return resolve([]);
                    resolve(addresses.map((address) => ({ address, family: 4 })));
                });
            });

        const resolve6 = () =>
            new Promise<LookupAddress[]>((resolve) => {
                resolver.resolve6(hostname, (err, addresses) => {
                    if (err || !addresses?.length) return resolve([]);
                    resolve(addresses.map((address) => ({ address, family: 6 })));
                });
            });

        const run = async () => {
            try {
                let resolved: LookupAddress[] = [];

                if (requestedFamily === 4) {
                    resolved = await resolve4();
                } else if (requestedFamily === 6) {
                    resolved = await resolve6();
                } else {
                    const [v4, v6] = await Promise.all([resolve4(), resolve6()]);
                    resolved = [...v4, ...v6];
                }

                if (resolved.length > 0) {
                    if (all) {
                        callback(null, resolved);
                        return;
                    }

                    const first = resolved[0];
                    callback(null, first.address, first.family);
                    return;
                }
            } catch {
                // Fall back to original lookup below.
            }

            (originalLookup as unknown as (...args: unknown[]) => unknown)(hostname, optionsOrCallback, maybeCallback);
        };

        void run();
        return undefined;
    }) as unknown as typeof dns.lookup;

    patched = true;
}

