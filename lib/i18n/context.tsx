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

export function I18nProvider({
    children,
    initialLocale = 'en',
}: {
    children: ReactNode;
    initialLocale?: Locale;
}) {
    // Try to get from localStorage first, otherwise fallback to initial
    const [locale, setLocaleState] = useState<Locale>(initialLocale);
    const [messages, setMessages] = useState<Messages>(enMessages);

    // Load saved preference on mount
    useEffect(() => {
        const saved = localStorage.getItem('locale') as Locale;
        if (saved && (saved === 'en' || saved === 'te')) {
            setLocaleState(saved);
        }
    }, []);

    // Load messages when locale changes
    useEffect(() => {
        if (locale === 'te') {
            setMessages(teMessages as Messages);
        } else {
            setMessages(enMessages);
        }
        localStorage.setItem('locale', locale);
    }, [locale]);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = messages;

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
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
