
export const OrderConfirmationTemplate = (order: any, items: any[]) => {
    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.charanorganics.com'}/account/orders`; // directs user to their order history

    const itemsHtml = items.map((item: any) => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <div style="font-weight: bold; color: #333;">${item.product_title_en}</div>
                <div style="font-size: 12px; color: #888;">${item.variant_label || ''}</div>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">₹${item.unit_price}</td>
        </tr>
    `).join('');

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
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center;">
                            <img src="https://res.cloudinary.com/dur6fkyoz/image/upload/v1770221833/cfavicon.ico_wj8cze.png" alt="Charan Organics" width="60" style="margin-bottom: 20px;">
                            <h1 style="margin: 0; color: #166534; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Order Confirmed!</h1>
                            <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">Thank you for your purchase via Charan Organics.</p>
                        </td>
                    </tr>

                    <!-- Order Info -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #15803d; font-weight: 700;">Order ID</div>
                                        <div style="font-size: 20px; font-weight: 900; color: #166534; margin-top: 5px;">#${order.order_id}</div>
                                        <div style="font-size: 14px; color: #15803d; margin-top: 5px;">${orderDate}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Items Table -->
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
                                        <td style="padding-top: 15px; text-align: right; font-weight: 600; color: #111827;">₹${order.subtotal_amount?.toFixed(2) || order.total_amount?.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 5px; text-align: right; font-weight: 600; color: #4b5563;">Shipping</td>
                                        <td style="padding-top: 5px; text-align: right; font-weight: 600; color: #111827;">₹${order.shipping_cost?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 15px; text-align: right; font-weight: 900; color: #166534; font-size: 18px;">Total</td>
                                        <td style="padding-top: 15px; text-align: right; font-weight: 900; color: #166534; font-size: 18px;">₹${order.total_amount?.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </td>
                    </tr>

                    <!-- Address -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <h3 style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 700;">Shipping Address</h3>
                            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                                ${order.shipping_address?.full_name || 'Customer'}<br>
                                ${order.shipping_address?.flat_no ? order.shipping_address.flat_no + ', ' : ''}${order.shipping_address?.address_line1 || ''}<br>
                                ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.pincode || ''}<br>
                                Phone: ${order.shipping_address?.phone || 'N/A'}
                            </p>
                        </td>
                    </tr>

                    <!-- Payment Proof Info -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <h3 style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 700;">Payment Proof Submitted</h3>
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 12px; border: 1px solid #fde68a;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        ${order.payment_proof?.utr_number ? `
                                            <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                                                <strong style="color: #78350f;">UTR Number:</strong> ${order.payment_proof.utr_number}
                                            </div>
                                        ` : ''}
                                        ${order.payment_proof?.has_screenshot ? `
                                            <div style="color: #92400e; font-size: 14px; margin-top: ${order.payment_proof?.utr_number ? '8px' : '0'};">
                                                ✓ Payment screenshot uploaded
                                            </div>
                                        ` : ''}
                                        <div style="color: #92400e; font-size: 12px; margin-top: 10px; font-style: italic;">
                                            We will verify your payment and confirm your order soon.
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Track Order Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="${trackingUrl}" style="display: inline-block; background-color: #166534; color: #ffffff; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(22, 101, 52, 0.4);">
                                Track Your Order
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f3f4f6; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} Charan Organics. All rights reserved.<br>
                                Need help? Contact us at <a href="mailto:ecanconnect@gmail.com" style="color: #166534; text-decoration: none;">ecanconnect@gmail.com</a>
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

