/**
 * Top Info Bar Component
 * 
 * Displays admin-editable announcement message
 */

'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase/client';

export function TopBar() {
    const locale = useLocale();
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const { data } = await (supabase
                    .from('site_content' as any) as any)
                    .select('content_en, content_te')
                    .eq('content_key', 'top_bar_message')
                    .single();

                const content = data as any; // Cast to any to bypass type inference issue

                if (content) {
                    setMessage(locale === 'en' ? content.content_en || '' : content.content_te || '');
                }
            } catch (error) {
                console.warn('Top bar message load failed:', error);
                setMessage('');
            }
        };

        fetchMessage();
    }, [locale]);

    if (!message) return null;

    return (
        <div className="hidden md:flex bg-green-900 text-white h-7 md:h-10 items-center justify-center text-[9px] md:text-xs font-black uppercase tracking-[0.2em] z-[60] fixed top-0 left-0 right-0 overflow-hidden">
            <div className="container mx-auto px-4">
                <p className="flex items-center justify-center gap-4 md:gap-5 animate-fade-in whitespace-nowrap">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)] shrink-0" />
                    <span className="truncate max-w-[85vw]">{message}</span>
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)] shrink-0" />
                </p>
            </div>
        </div>
    );
}
