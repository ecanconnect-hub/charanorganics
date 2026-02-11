'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

type AppSetting = {
    key: string;
    value: any;
    description: string;
    updated_at: string;
};

export default function AppSettingsPage() {
    const [settings, setSettings] = useState<AppSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('app_settings' as any) as any)
                .select('*');

            if (error) throw error;

            setSettings(data || []);

            // Parse values
            const emailSetting = data?.find((s: any) => s.key === 'order_notification_email');
            const maintenanceSetting = data?.find((s: any) => s.key === 'site_maintenance');

            if (emailSetting) {
                // Remove quotes if stored as JSON string
                setAdminEmail(String(emailSetting.value).replace(/"/g, ''));
            }
            if (maintenanceSetting) {
                setMaintenanceMode(maintenanceSetting.value === true || String(maintenanceSetting.value) === 'true');
            }

        } catch (error) {
            console.error('Error fetching settings:', error);
            // Don't show toast on 404/empty table initially
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);

            const updates = [
                {
                    key: 'order_notification_email',
                    value: JSON.stringify(adminEmail),
                    description: 'Email address to receive new order notifications'
                },
                {
                    key: 'site_maintenance',
                    value: maintenanceMode,
                    description: 'Put website in maintenance mode'
                }
            ];

            const { error } = await (supabase
                .from('app_settings' as any) as any)
                .upsert(updates as any);

            if (error) throw error;

            toast.success('Settings saved successfully');
            fetchSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Settings" subtitle="Configure system preferences">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Email Notifications */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 text-2xl">
                            📧
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Order Notifications</h2>
                            <p className="text-gray-500 mt-1">Configure where order notifications are sent.</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-lg">
                        <label className="block">
                            <span className="text-sm font-semibold text-gray-700">Notification Email</span>
                            <div className="mt-1 flex gap-2">
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                This email will receive detailed order summaries including product lists and customer details whenever a new order is placed.
                            </p>
                        </label>
                    </div>
                </div>

                {/* Maintenance Mode */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-red-100 rounded-xl text-red-600 text-2xl">
                            🛑
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Danger Zone</h2>
                            <p className="text-gray-500 mt-1">Controls that affect site availability.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                            <h3 className="font-semibold text-gray-900">Maintenance Mode</h3>
                            <p className="text-sm text-gray-500">Temporarily disable the public website for maintenance.</p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={maintenanceMode}
                                onChange={(e) => setMaintenanceMode(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pb-12">
                    <button
                        onClick={saveSettings}
                        disabled={saving || loading}
                        className={`
                            px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                            ${saving
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-200 hover:-translate-y-1'
                            }
                        `}
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </span>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>

            </div>
        </AdminLayout>
    );
}
