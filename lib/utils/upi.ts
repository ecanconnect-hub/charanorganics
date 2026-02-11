/**
 * UPI Payment Utilities
 * 
 * Generates UPI deep links and QR codes for payment
 */

import QRCode from 'qrcode';

export interface UPIPaymentDetails {
    upiId: string;
    name: string;
    amount: number;
    transactionNote: string;
    transactionRef?: string;
}

/**
 * Generate UPI payment link
 * Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE&tr=REF
 */
export const generateUPILink = (details: UPIPaymentDetails): string => {
    const params = new URLSearchParams({
        pa: details.upiId,
        pn: details.name,
        am: details.amount.toFixed(2),
        tn: details.transactionNote,
        cu: 'INR',
    });

    if (details.transactionRef) {
        params.append('tr', details.transactionRef);
    }

    return `upi://pay?${params.toString()}`;
};

/**
 * Generate UPI QR code as data URL
 */
export const generateUPIQRCode = async (details: UPIPaymentDetails): Promise<string> => {
    const upiLink = generateUPILink(details);

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(upiLink, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Detect if user is on mobile device
 */
export const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

/**
 * Open UPI app on mobile
 */
export const openUPIApp = (details: UPIPaymentDetails): void => {
    const upiLink = generateUPILink(details);
    window.location.href = upiLink;
};
