/**
 * Contact Page
 *
 * Handles general messages, feedback, and issue reports.
 * All submissions go to contact_messages table → admin/messages panel.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

type MessageType = 'message' | 'feedback' | 'report';

const MESSAGE_TYPES: { value: MessageType; label: string; icon: string; placeholder: string }[] = [
    {
        value: 'message',
        label: 'Send a Message',
        icon: '✉️',
        placeholder: 'How can we help you?',
    },
    {
        value: 'feedback',
        label: 'Give Feedback',
        icon: '⭐',
        placeholder: 'Share your experience or suggestions…',
    },
    {
        value: 'report',
        label: 'Report an Issue',
        icon: '🚨',
        placeholder: 'Describe the issue — order ID, payment problem, website bug, etc.',
    },
];

function ContactForm() {
    const searchParams = useSearchParams();
    const [messageType, setMessageType] = useState<MessageType>('message');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Pre-select type from URL param: /contact?type=report or /contact?type=feedback
    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam === 'report' || typeParam === 'feedback') {
            setMessageType(typeParam as MessageType);
        }
    }, [searchParams]);

    const activeType = MESSAGE_TYPES.find((t) => t.value === messageType)!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('contact_messages')
                .insert([{
                    name,
                    email,
                    subject: subject || activeType.label,
                    message,
                    message_type: messageType,
                    status: 'new',
                }] as any);

            if (error) throw error;

            toast.success('Message sent! We\'ll get back to you soon.');
            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-10 h-full">
            {/* Message Type Tabs */}
            <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-xl">
                {MESSAGE_TYPES.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => setMessageType(type.value)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                            messageType === type.value
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>{type.icon}</span>
                        <span className="hidden sm:inline">{type.label}</span>
                    </button>
                ))}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {activeType.icon} {activeType.label}
            </h2>
            <p className="text-gray-500 mb-8 text-sm">
                {messageType === 'report'
                    ? 'Describe the issue and we\'ll fix it fast. Include your Order ID if applicable.'
                    : 'Fill out the form and we\'ll get back to you within 24 hours.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                            placeholder="Full name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                        placeholder={
                            messageType === 'report'
                                ? 'e.g. Payment failed — Order ORD-20260316-001'
                                : 'Brief subject line'
                        }
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {messageType === 'report' ? 'Describe the Issue' : 'Message'}
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={5}
                        className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none text-base"
                        placeholder={activeType.placeholder}
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                    className="py-4 text-base font-semibold rounded-xl"
                >
                    {messageType === 'report'
                        ? '🚨 Submit Report'
                        : messageType === 'feedback'
                        ? '⭐ Send Feedback'
                        : 'Send Message →'}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Goes directly to the admin panel · Secure · Fast response
                </div>
            </form>
        </div>
    );
}

export default function ContactPage() {
    return (
        <main className="bg-gradient-to-b from-gray-50 to-white">
            <div className="h-24 md:h-28" />

            {/* Page Header */}
            <div className="py-12 md:py-16 bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 max-w-6xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contact Us</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Send a message, share feedback, or report an issue — all in one place.
                    </p>
                </div>
            </div>

            <div className="py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 max-w-7xl mx-auto">

                        {/* Contact Form */}
                        <div className="lg:col-span-3">
                            <Suspense fallback={<div className="h-96 bg-white rounded-2xl animate-pulse" />}>
                                <ContactForm />
                            </Suspense>
                        </div>

                        {/* Contact Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                                <div className="space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-0.5">Email</h3>
                                            <p className="text-gray-600 text-sm">chinnammadu46@gmail.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.397-4.394 9.788-9.791 9.788Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-0.5">WhatsApp</h3>
                                            <a href="https://wa.me/918247838125" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-sm font-medium">
                                                +91 824 783 8125
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-0.5">Location</h3>
                                            <p className="text-gray-600 text-sm">Hyderabad, Telangana, India</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick tip */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                <p className="font-bold text-amber-800 text-sm mb-1">⚡ Urgent issue?</p>
                                <p className="text-amber-700 text-xs leading-relaxed mb-3">
                                    For urgent order or payment problems, WhatsApp is the fastest — include your Order ID.
                                </p>
                                <a
                                    href="https://wa.me/918247838125"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.397-4.394 9.788-9.791 9.788Z" />
                                    </svg>
                                    Chat on WhatsApp
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
