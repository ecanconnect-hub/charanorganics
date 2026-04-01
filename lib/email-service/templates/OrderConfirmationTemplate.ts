const escapeHtml = (value: unknown): string => {
    if (value === null || value === undefined) return '';

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const toAmount = (value: unknown, fallback = 0): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const inr = (value: unknown): string => `&#8377;${toAmount(value).toFixed(2)}`;

type OrderConfirmationTemplateOptions = {
    includePromotion?: boolean;
};

export const OrderConfirmationTemplate = (
    order: any,
    items: any[],
    options: OrderConfirmationTemplateOptions = {}
) => {
    const { includePromotion = false } = options;

    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.charanorganics.com'}/account/orders`;

    const itemsHtml = items
        .map(
            (item: any) => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <div style="font-weight: bold; color: #333;">${escapeHtml(item.product_title_en)}</div>
                <div style="font-size: 12px; color: #888;">${escapeHtml(item.variant_label || '')}</div>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">${escapeHtml(item.quantity)}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${inr(item.unit_price)}</td>
        </tr>
    `
        )
        .join('');

    const subtotal = toAmount(order.subtotal_amount, toAmount(order.total_amount));
    const shipping = toAmount(order.shipping_cost);
    const total = toAmount(order.total_amount);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        ${includePromotion
            ? `
        <tr>
            <td align="center" style="padding: 20px 0 12px;">
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(30, 64, 175, 0.12);">
                    <tr>
                        <td style="background-color: #581DD8; background-image: linear-gradient(135deg, #4D3792 0%, #554FC8 55%, #3A4B87 100%);">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="padding: 14px 20px;">
                                        <p style="margin: 0; color: #dbeafe; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700;">
                                            Partner Note
                                        </p>
                                        <p style="margin: 6px 0 0; color: #ffffff; font-size: 16px; font-weight: 700;">
                                            Website & App Services by eCantech Solutions
                                        </p>
                                    </td>
                                    <td align="right" style="padding: 14px 20px;">
                                        <span style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; padding: 6px 10px; color: #ffffff; font-size: 12px; font-weight: 700;">
                                            From &#8377;5,000
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 18px 20px; background-color: #f8fbff;">
                            <p style="margin: 0; color: #2F2B5F; font-size: 14px; line-height: 1.65;">
                                Need a modern website or app for your business? We build clean, fast and reliable products with quality support.
                            </p>
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-top: 14px;">
                                <tr>
                                    <td style="padding-right: 8px; padding-bottom: 6px;">
                                        <a href="https://ecantechesolutions.vercel.app/" style="display: inline-block; background-color: #B720EA; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; border-radius: 999px; padding: 9px 14px;">
                                            View Portfolio
                                        </a>
                                    </td>
                                    <td style="padding-bottom: 6px;">
                                        <a href="https://wa.me/918897337784" style="display: inline-block; background-color: #20D456; color: #0f172a; text-decoration: none; font-size: 12px; font-weight: 700; border-radius: 999px; border: 1px solid #cbd5e1; padding: 9px 14px;">
                                            WhatsApp: +91 88973 37784
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        `
            : ''}
        <tr>
            <td align="center" style="padding: ${includePromotion ? '12px 0 40px' : '40px 0'};">
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center;">
                            <img src="https://res.cloudinary.com/dur6fkyoz/image/upload/v1773146940/charan-logo_yt3sg3.png" alt="Charan Organics" width="60" style="margin-bottom: 20px;">
                            <h1 style="margin: 0; color: #166534; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Payment Submitted</h1>
                            <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">We received your payment proof for this Charan Organics order.</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #15803d; font-weight: 700;">Order ID</div>
                                        <div style="font-size: 20px; font-weight: 900; color: #166534; margin-top: 5px;">#${escapeHtml(order.order_id)}</div>
                                        <div style="font-size: 14px; color: #15803d; margin-top: 5px;">${escapeHtml(orderDate)}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 40px;">
                            <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 700;">Order Summary</h3>
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding-bottom: 10px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Product</th>
                                        <th style="text-align: center; padding-bottom: 10px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                                        <th style="text-align: right; padding-bottom: 10px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="2" style="padding-top: 15px; text-align: right; font-weight: 600; color: #4b5563;">Subtotal</td>
                                        <td style="padding-top: 15px; text-align: right; font-weight: 600; color: #111827;">${inr(subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 5px; text-align: right; font-weight: 600; color: #4b5563;">Shipping</td>
                                        <td style="padding-top: 5px; text-align: right; font-weight: 600; color: #111827;">${inr(shipping)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 15px; text-align: right; font-weight: 900; color: #166534; font-size: 18px;">Total</td>
                                        <td style="padding-top: 15px; text-align: right; font-weight: 900; color: #166534; font-size: 18px;">${inr(total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <h3 style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 700;">Shipping Address</h3>
                            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                                ${escapeHtml(order.shipping_address?.full_name || 'Customer')}<br>
                                ${escapeHtml(order.shipping_address?.address_line1 || '')}<br>
                                ${escapeHtml(order.shipping_address?.city || '')}, ${escapeHtml(order.shipping_address?.state || '')} ${escapeHtml(order.shipping_address?.pincode || '')}<br>
                                Phone: ${escapeHtml(order.shipping_address?.phone || 'N/A')}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <h3 style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 700;">Payment Proof Submitted</h3>
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 12px; border: 1px solid #fde68a;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        ${order.payment_proof?.utr_number ? `
                                            <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                                                <strong style="color: #78350f;">UTR Number:</strong> ${escapeHtml(order.payment_proof.utr_number)}
                                            </div>
                                        ` : ''}
                                        ${order.payment_proof?.has_screenshot ? `
                                            <div style="color: #92400e; font-size: 14px; margin-top: ${order.payment_proof?.utr_number ? '8px' : '0'};">
                                                Payment screenshot uploaded
                                            </div>
                                        ` : ''}
                                        <div style="color: #92400e; font-size: 12px; margin-top: 10px; font-style: italic;">
                                            Our team will review your payment and confirm the order after verification.
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="${escapeHtml(trackingUrl)}" style="display: inline-block; background-color: #166534; color: #ffffff; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(22, 101, 52, 0.4);">
                                Track Your Order
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f3f4f6; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} Charan Organics. All rights reserved.<br>
                                Need help? Contact us at <a href="mailto:chinnammadu46@gmail.com" style="color: #166534; text-decoration: none;">chinnammadu46@gmail.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};
