/**
 * Modal Component
 * 
 * Accessible modal dialog with backdrop and animations
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className={`
                relative w-full ${sizes[size]} 
                bg-white rounded-2xl shadow-2xl 
                max-h-[92vh] overflow-hidden
              `}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            {(title || showCloseButton) && (
                                <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3 sm:px-6 sm:py-4">
                                    {title && (
                                        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] sm:text-2xl">
                                            {title}
                                        </h2>
                                    )}

                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            aria-label="Close modal"
                                        >
                                            <svg
                                                className="w-6 h-6 text-gray-500"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Content */}
                            <div className="max-h-[calc(92vh-7rem)] overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
