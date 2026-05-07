import emailjs from "@emailjs/browser";

const EMAIL_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_64zdc78",
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "IvZIeFICTafRQRlKP",
  orderTemplateId: import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID || "template_hldtgsr",
  contactTemplateId: import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || "template_hldtgsr",
  orderToEmail: import.meta.env.VITE_ORDER_EMAIL_TO || "",
};

const PAYMENT_METHOD_LABELS = {
  upi: "UPI",
  card: "Credit / Debit Card",
  wallet: "Wallet",
};

const money = (value) => `Rs ${Number(value || 0).toFixed(0)}`;

const firstValue = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim() !== "");

const formatAddress = (form) => [
  form.customer_name,
  form.phone,
  form.address_line,
  form.city,
  form.pincode,
].filter(Boolean).join(", ");

const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const buildOrderItemsText = (items) => items
  .map(item => `${item.quantity} x ${item.name} - ${money(Number(item.price) * Number(item.quantity))}`)
  .join("\n");

const buildOrderItemsHtml = (items) => items
  .map(item => {
    const image = item.image_url
      ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" width="68" height="68" style="width:68px;height:68px;object-fit:cover;border-radius:8px;border:1px solid #dfcfb7;" />`
      : "";

    return `
      <tr>
        <td style="padding:10px 0;vertical-align:top;">${image}</td>
        <td style="padding:10px 0 10px 12px;vertical-align:top;">
          <strong>${escapeHtml(item.name)}</strong><br />
          <span>${Number(item.quantity)} x ${money(item.price)}</span>
        </td>
        <td style="padding:10px 0;text-align:right;vertical-align:top;"><strong>${money(Number(item.price) * Number(item.quantity))}</strong></td>
      </tr>
    `;
  })
  .join("");

const buildPaymentSummary = ({ order, form, total, paymentDetails = {} }) => {
  const methodId = firstValue(form.payment_method, order?.payment_method, "");
  const methodLabel = firstValue(PAYMENT_METHOD_LABELS[methodId], methodId, "Not shared");
  const status = firstValue(paymentDetails.status, form.payment_status, order?.payment_status, "Pending");
  const amount = money(firstValue(total, order?.total_price, 0));
  const provider = firstValue(paymentDetails.provider, form.payment_provider, form.upi_app, form.wallet_provider, "Not shared");
  const reference = firstValue(
    paymentDetails.reference,
    paymentDetails.transactionId,
    form.payment_reference,
    form.transaction_id,
    order?.payment_reference,
    order?.transaction_id,
    "Not shared",
  );
  const gatewayOrderId = firstValue(
    paymentDetails.gatewayOrderId,
    form.gateway_order_id,
    order?.gateway_order_id,
    "Not shared",
  );
  const gatewayPaymentId = firstValue(
    paymentDetails.gatewayPaymentId,
    form.gateway_payment_id,
    order?.gateway_payment_id,
    "Not shared",
  );
  const upiId = firstValue(paymentDetails.upiId, form.upi_id, "");
  const upiName = firstValue(paymentDetails.upiName, form.upi_name, "");
  const upiReceiver = upiId ? `${upiName || "UPI receiver"} - ${upiId}` : "Not shared";

  const rows = [
    ["Method", methodLabel],
    ["Status", status],
    ["Amount", amount],
    ["Provider / app", provider],
    ["Reference", reference],
    ["Gateway order ID", gatewayOrderId],
    ["Gateway payment ID", gatewayPaymentId],
    ["UPI receiver", upiReceiver],
  ];

  return {
    amount,
    gatewayOrderId,
    gatewayPaymentId,
    methodId,
    methodLabel,
    provider,
    reference,
    status,
    upiId,
    upiName,
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    html: rows
      .map(([label, value]) => `
        <tr>
          <td style="padding:6px 10px 6px 0;color:#6b5a48;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;"><strong>${escapeHtml(value)}</strong></td>
        </tr>
      `)
      .join(""),
  };
};

export const sendOrderEmail = ({ order, form, cartItems, total, paymentDetails = {} }) => {
  if (!EMAIL_CONFIG.serviceId || !EMAIL_CONFIG.publicKey || !EMAIL_CONFIG.orderTemplateId) {
    throw new Error("EmailJS order email is not configured.");
  }

  const primaryImage = cartItems.find(item => item.image_url)?.image_url || "";
  const payment = buildPaymentSummary({ order, form, total, paymentDetails });
  const templateParams = {
    to_email: EMAIL_CONFIG.orderToEmail,
    order_id: order?.id || "New",
    customer_name: form.customer_name,
    customer_phone: form.phone,
    address_line: form.address_line,
    city: form.city,
    pincode: form.pincode,
    delivery_notes: form.delivery_notes || "No notes",
    payment_method: payment.methodLabel,
    payment_method_id: payment.methodId,
    payment_status: payment.status,
    payment_amount: payment.amount,
    payment_provider: payment.provider,
    payment_reference: payment.reference,
    gateway_order_id: payment.gatewayOrderId,
    gateway_payment_id: payment.gatewayPaymentId,
    upi_id: payment.upiId,
    upi_name: payment.upiName,
    payment_details: payment.text,
    payment_details_html: payment.html,
    order_total: money(total),
    order_items: buildOrderItemsText(cartItems),
    order_items_html: buildOrderItemsHtml(cartItems),
    primary_image_url: primaryImage,
    full_address: formatAddress(form),
  };

  return emailjs.send(
    EMAIL_CONFIG.serviceId,
    EMAIL_CONFIG.orderTemplateId,
    templateParams,
    { publicKey: EMAIL_CONFIG.publicKey },
  );
};

export const sendContactEmail = (form) => {
  if (!EMAIL_CONFIG.serviceId || !EMAIL_CONFIG.publicKey || !EMAIL_CONFIG.contactTemplateId) {
    throw new Error("EmailJS contact email is not configured.");
  }

  return emailjs.send(
    EMAIL_CONFIG.serviceId,
    EMAIL_CONFIG.contactTemplateId,
    {
      to_email: EMAIL_CONFIG.orderToEmail,
      contact_type: form.type,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone || "Not shared",
      rating: form.rating || "Not rated",
      subject: form.subject,
      message: form.message,
    },
    { publicKey: EMAIL_CONFIG.publicKey },
  );
};
