'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

type Message = {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied';
    message_type?: 'message' | 'feedback' | 'report';
    created_at: string;
};

export default function ContactMessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('contact_messages' as any) as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await (supabase
                .from('contact_messages' as any) as any)
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            setMessages(messages.map(m =>
                m.id === id ? { ...m, status: status as any } : m
            ));

            const action = status === 'read' ? 'marked as read' : status === 'replied' ? 'marked as replied' : 'updated';
            toast.success(`Message ${action}`);

            if (selectedMessage?.id === id) {
                setSelectedMessage({ ...selectedMessage, status: status as any });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const { error } = await (supabase
                .from('contact_messages' as any) as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMessages(messages.filter(m => m.id !== id));
            if (selectedMessage?.id === id) {
                setSelectedMessage(null);
            }
            toast.success('Message deleted');
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Failed to delete message');
        }
    };

    return (
        <AdminLayout title="Messages" subtitle="Manage contact form submissions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                {/* Message List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full lg:col-span-1">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Inbox ({messages.length})</h3>
                        <button
                            onClick={fetchMessages}
                            className="text-gray-500 hover:text-indigo-600 transition-colors"
                            title="Refresh"
                        >
                            🔄
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                                <p>Loading...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No messages found.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        onClick={() => setSelectedMessage(message)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === message.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-medium truncate pr-2 ${message.status === 'new' ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                                {message.name}
                                            </h4>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(message.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 font-medium truncate mb-1">{message.subject}</p>
                                        <p className="text-xs text-gray-500 truncate">{message.message}</p>

                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center gap-1.5">
                                                {message.message_type === 'report' && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-100 text-red-700">🚨 Issue</span>
                                                )}
                                                {message.message_type === 'feedback' && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700">⭐ Feedback</span>
                                                )}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                    message.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                    message.status === 'replied' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {message.status}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => handleDelete(message.id, e)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Detail */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full lg:col-span-2">
                    {selectedMessage ? (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {selectedMessage.message_type === 'report' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">🚨 Issue Report</span>
                                        )}
                                        {selectedMessage.message_type === 'feedback' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700">⭐ Feedback</span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                                        <span className="font-medium text-gray-900">{selectedMessage.name}</span>
                                        <span className="hidden sm:inline text-gray-400">&bull;</span>
                                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs select-all cursor-text">{selectedMessage.email}</span>
                                        <span className="hidden sm:inline text-gray-400">&bull;</span>
                                        <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {selectedMessage.status === 'new' && (
                                        <button
                                            onClick={() => updateStatus(selectedMessage.id, 'read')}
                                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Mark Read
                                        </button>
                                    )}
                                    {selectedMessage.status !== 'replied' && (
                                        <button
                                            onClick={() => updateStatus(selectedMessage.id, 'replied')}
                                            className="px-3 py-1.5 bg-indigo-600 text-white border border-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            Mark Replied
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <a
                                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                    className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Reply via Email ✉️
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-4xl">
                                📩
                            </div>
                            <p className="text-lg font-medium">Select a message to verify details</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
