'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import enMessages from '@/messages/en.json';
import teMessages from '@/messages/te.json';

type Messages = typeof enMessages;
type Locale = 'en' | 'te';

interface I18nContextType {
    locale: Locale;
    messages: Messages;
    t: (key: string) => string;
    setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const isLocale = (value: string | null): value is Locale => value === 'en' || value === 'te';

const getInitialLocale = (fallback: Locale): Locale => {
    if (typeof window === 'undefined') return fallback;
    const saved = window.localStorage.getItem('locale');
    return isLocale(saved) ? saved : fallback;
};

export function I18nProvider({
    children,
    initialLocale = 'en',
}: {
    children: ReactNode;
    initialLocale?: Locale;
}) {
    const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale(initialLocale));
    const messages: Messages = locale === 'te' ? (teMessages as Messages) : enMessages;

    useEffect(() => {
        window.localStorage.setItem('locale', locale);
    }, [locale]);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: unknown = messages;

        for (const k of keys) {
            if (typeof value === 'object' && value !== null && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <I18nContext.Provider value={{ locale, messages, t, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslations(namespace?: string) {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslations must be used within I18nProvider');
    }

    return (key: string) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        return context.t(fullKey);
    };
}

export function useLocale() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useLocale must be used within I18nProvider');
    }
    return context.locale;
}

export function useSetLocale() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useSetLocale must be used within I18nProvider');
    }
    return context.setLocale;
}
