/**
 * Trust Badges Component
 * 
 * Displays key value propositions like Organic, Cruelty-Free, etc.
 */

'use client';

import { motion } from 'framer-motion';

export function TrustBadges() {
    const badges = [
        {
            icon: '🌱',
            title: '100% Organic',
            desc: 'Certified Natural'
        },
        {
            icon: '🐇',
            title: 'Cruelty-Free',
            desc: 'No Animal Testing'
        },
        {
            icon: '⚡',
            title: 'Handmade',
            desc: 'Small Batch Quality'
        },
        {
            icon: '📦',
            title: 'Eco-Friendly',
            desc: 'Sustainable Packing'
        }
    ];

    return (
        <section className="py-12 bg-white border-y border-gray-100">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={badge.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-green-100/50">
                                {badge.icon}
                            </div>
                            <h3 className="text-gray-900 font-bold text-sm md:text-base mb-1 tracking-tight">
                                {badge.title}
                            </h3>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                                {badge.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
