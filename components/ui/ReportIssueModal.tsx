'use client';

import { useState } from 'react';

type IssueType = 'order_issue' | 'payment_issue' | 'product_issue' | 'website_bug' | 'delivery_issue' | 'general';

const ISSUE_TYPES: { value: IssueType; label: string; icon: string }[] = [
    { value: 'order_issue', label: 'Order Issue', icon: '📦' },
    { value: 'payment_issue', label: 'Payment Issue', icon: '💳' },
    { value: 'product_issue', label: 'Product Issue', icon: '🌿' },
    { value: 'delivery_issue', label: 'Delivery Issue', icon: '🚚' },
    { value: 'website_bug', label: 'Website Bug', icon: '🐛' },
    { value: 'general', label: 'General', icon: '📝' },
];

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
    const [issueType, setIssueType] = useState<IssueType>('general');
    const [orderId, setOrderId] = useState('');
    const [description, setDescription] = useState('');
    const [reporterName, setReporterName] = useState('');
    const [reporterEmail, setReporterEmail] = useState('');
    const [reporterPhone, setReporterPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [reportId, setReportId] = useState('');
    const [error, setError] = useState('');
    const [whatsappUrl, setWhatsappUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/report-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueType,
                    orderId: orderId.trim().toUpperCase() || undefined,
                    description,
                    reporterName: reporterName.trim() || undefined,
                    reporterEmail: reporterEmail.trim() || undefined,
                    reporterPhone: reporterPhone.trim() || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to submit report. Please try again.');
                return;
            }

            setReportId(data.reportId);
            setWhatsappUrl(data.whatsappFallback || '');
            setSubmitted(true);
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset form after close animation
        setTimeout(() => {
            setSubmitted(false);
            setReportId('');
            setWhatsappUrl('');
            setError('');
            setIssueType('general');
            setOrderId('');
            setDescription('');
            setReporterName('');
            setReporterEmail('');
            setReporterPhone('');
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                onClick={handleClose}
            >
                {/* Modal */}
                <div
                    className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Report an Issue</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {submitted
                                    ? 'Thanks! Your report has been received.'
                                    : 'We\'ll look into it and get back to you.'}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Success State */}
                    {submitted ? (
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Report Submitted!</h3>
                            <p className="text-gray-500 text-sm mb-1">
                                Your report has been saved and the Charan Organics team will review it.
                            </p>
                            {reportId && reportId !== 'N/A' && (
                                <p className="text-xs text-gray-400 mt-2 font-mono">
                                    Reference ID: <span className="text-gray-700 font-bold">{reportId.slice(0, 8).toUpperCase()}</span>
                                </p>
                            )}

                            {/* WhatsApp option for urgency */}
                            {whatsappUrl && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl">
                                    <p className="text-sm text-gray-700 font-semibold mb-3">
                                        Need urgent help? Also send via WhatsApp:
                                    </p>
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.397-4.394 9.788-9.791 9.788Z" />
                                        </svg>
                                        Send via WhatsApp
                                    </a>
                                </div>
                            )}

                            <button
                                onClick={handleClose}
                                className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Issue Type */}
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-3">
                                    Issue Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ISSUE_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setIssueType(type.value)}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-bold transition-all ${
                                                issueType === type.value
                                                    ? 'bg-green-600 border-green-600 text-white shadow-md'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                                            }`}
                                        >
                                            <span className="text-lg">{type.icon}</span>
                                            <span>{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Order ID (only for relevant types) */}
                            {['order_issue', 'payment_issue', 'delivery_issue'].includes(issueType) && (
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                                        Order ID <span className="text-gray-400 font-medium normal-case">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                        placeholder="ORD-20260316-001"
                                        maxLength={32}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:outline-none transition-all font-mono"
                                    />
                                </div>
                            )}

                            {/* Description — required */}
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                                    Describe the Issue <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please describe the problem in detail. What happened? What did you expect? Any error messages?"
                                    rows={4}
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:outline-none transition-all resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/2000</p>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Your Contact Info <span className="font-medium normal-case text-gray-400">(optional, for follow-up)</span>
                                </p>
                                <input
                                    type="text"
                                    value={reporterName}
                                    onChange={(e) => setReporterName(e.target.value)}
                                    placeholder="Your name"
                                    maxLength={100}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none transition-all"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="email"
                                        value={reporterEmail}
                                        onChange={(e) => setReporterEmail(e.target.value)}
                                        placeholder="Email address"
                                        maxLength={254}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none transition-all"
                                    />
                                    <input
                                        type="tel"
                                        value={reporterPhone}
                                        onChange={(e) => setReporterPhone(e.target.value)}
                                        placeholder="Phone (optional)"
                                        maxLength={15}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-600 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || description.trim().length < 10}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Submit Report
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center">
                                Reports are sent to the Charan Organics support team and saved securely.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
