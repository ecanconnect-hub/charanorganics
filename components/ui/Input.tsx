/**
 * Reusable Input Component
 * 
 * Form input with label, error handling, and validation
 */

'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', id, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5"
                    >
                        {label}
                        {props.required && <span className="text-[rgb(var(--error))] ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        className={`
                            w-full px-4 py-2.5 min-h-[42px]
                            border rounded-xl 
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            ${error ? 'border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]/20 focus:border-[rgb(var(--error))]' : 'border-[rgb(var(--border))]'}
                            ${isPassword ? 'pr-11' : ''}
                            ${className}
                        `}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1.5"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                {error && (
                    <p className="mt-1.5 text-sm text-[rgb(var(--error))] flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
