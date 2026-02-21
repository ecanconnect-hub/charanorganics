/**
 * Contact Page - Premium Redesign
 * 
 * Industry-standard contact form and information
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('contact_messages')
                .insert([{
                    name,
                    email,
                    subject,
                    message,
                    status: 'new'
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
        <main className="bg-gradient-to-b from-gray-50 to-white">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            {/* Premium Page Header */}
            <div className="py-12 md:py-16 bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 max-w-6xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Contact Us
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                        We'd love to hear from you
                    </p>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 max-w-7xl mx-auto">

                        {/* Contact Form - Left Side (3 columns) */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-10 h-full">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                    Send us a Message
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Fill out the form below and we'll get back to you within 24 hours.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Your Name
                                        </label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Your Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Subject
                                        </label>
                                        <Input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            required
                                            className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
                                            placeholder="How can we help you?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            rows={6}
                                            className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-base"
                                            placeholder="Tell us more about your inquiry..."
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        isLoading={loading}
                                        className="py-4 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        Send Message
                                    </Button>

                                    {/* Trust Indicator */}
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Secure communication • Fast response</span>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Contact Information - Right Side (2 columns) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Contact Info Card */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-auto">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                    Get in Touch
                                </h2>

                                <div className="space-y-6">
                                    {/* Email */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-7 h-7 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                                            <p className="text-gray-600">ecanconnect@gmail.com</p>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-7 h-7 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                                            <p className="text-gray-600">+91 824 783 8125</p>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-7 h-7 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">Address</h3>
                                            <p className="text-gray-600">
                                                Hyderabad, Telangana<br />
                                                India
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Trust Elements */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">Fast Response</p>
                                        <p className="text-xs text-gray-500">Within 24 hours</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                                    <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">Customer Support</p>
                                        <p className="text-xs text-gray-500">Always available</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

