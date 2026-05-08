import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import API from "../services/api";
import { sendOrderEmail } from "../services/email";

const paymentOptions = [
  { id: "upi", label: "UPI", text: "Google Pay, PhonePe, Paytm", badge: "Recommended" },
  { id: "card", label: "Credit / Debit Card", text: "Visa, Mastercard, RuPay", badge: "Secure" },
  { id: "wallet", label: "Wallets", text: "Paytm, Amazon Pay, Mobikwik", badge: "Fast" },
];

const UPI_ID = "raheesmhd2233@okaxis";
const UPI_NAME = "Rahees";
const UPI_APPS = [
  { id: "gpay", label: "Google Pay", packageName: "com.google.android.apps.nbu.paisa.user" },
  { id: "phonepe", label: "PhonePe", packageName: "com.phonepe.app" },
  { id: "paytm", label: "Paytm", packageName: "net.one97.paytm" },
  { id: "bhim", label: "BHIM", packageName: "in.org.npci.upiapp" },
  { id: "any", label: "Any UPI app" },
];
const WALLET_APPS = [
  { id: "paytm-wallet", label: "Paytm Wallet", text: "Pay from wallet balance" },
  { id: "amazon-pay", label: "Amazon Pay", text: "Use Amazon Pay wallet" },
  { id: "mobikwik", label: "Mobikwik", text: "Continue with Mobikwik" },
  { id: "freecharge", label: "Freecharge", text: "Pay with Freecharge" },
];
const PAYMENT_GATEWAY_URL = import.meta.env.VITE_PAYMENT_GATEWAY_URL || "";

const validateCheckoutForm = (values) => {
  const errors = {};
  const phonePattern = /^[0-9+\-\s()]{7,15}$/;
  const pincodePattern = /^[0-9]{6}$/;

  if (!values.customer_name.trim()) errors.customer_name = "Customer name is required.";
  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!phonePattern.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!values.address_line.trim()) errors.address_line = "Full address is required.";
  if (!values.city.trim()) errors.city = "City is required.";
  if (!values.pincode.trim()) {
    errors.pincode = "Pincode is required.";
  } else if (!pincodePattern.test(values.pincode.trim())) {
    errors.pincode = "Enter a valid 6 digit pincode.";
  }

  return errors;
};

export default function Checkout() {
  const [cartItems] = useState(() => JSON.parse(localStorage.getItem("checkoutCart") || "[]"));
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address_line: "",
    city: "",
    pincode: "",
    delivery_notes: "",
    payment_method: "upi",
    payment_status: "pending",
    payment_provider: "",
    payment_reference: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [paymentError, setPaymentError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState("");
  const [upiQrCode, setUpiQrCode] = useState("");
  const [upiQrRequested, setUpiQrRequested] = useState(false);
  const [upiQrLoading, setUpiQrLoading] = useState(false);
  const [upiPaymentStep, setUpiPaymentStep] = useState("idle");
  const [upiReference] = useState(() => `CAFALINE${Date.now()}`);
  const navigate = useNavigate();

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.lineTotal) || Number(item.price) * Number(item.quantity)), 0),
    [cartItems],
  );
  const upiParams = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: UPI_NAME,
      am: total.toFixed(2),
      cu: "INR",
      tr: upiReference,
      tn: "Cafaline Reserve order",
    });

    return params.toString();
  }, [total, upiReference]);
  const genericUpiLink = `upi://pay?${upiParams}`;

  const getUpiAppLink = (app) => {
    if (!app.packageName) return genericUpiLink;
    return `intent://pay?${upiParams}#Intent;scheme=upi;package=${app.packageName};S.browser_fallback_url=${encodeURIComponent(genericUpiLink)};end`;
  };

  useEffect(() => {
    if (upiPaymentStep !== "opened") return undefined;

    const markReturned = () => {
      if (!document.hidden) setUpiPaymentStep("returned");
    };

    document.addEventListener("visibilitychange", markReturned);
    window.addEventListener("focus", markReturned);

    return () => {
      document.removeEventListener("visibilitychange", markReturned);
      window.removeEventListener("focus", markReturned);
    };
  }, [upiPaymentStep]);

  useEffect(() => {
    setUpiQrCode("");
    setUpiQrRequested(false);
  }, [genericUpiLink]);

  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value,
      ...(field === "payment_reference" ? { payment_status: "pending" } : {}),
    }));
    setFieldErrors(current => ({ ...current, [field]: "" }));
    setError("");
    if (field === "payment_reference") {
      setPaymentError("");
    }
  };

  const setPaymentMethod = (method) => {
    setForm(current => ({
      ...current,
      payment_method: method,
      payment_status: "pending",
      payment_provider: "",
      payment_reference: "",
    }));
    setError("");
    setPaymentError("");
    setPaymentNotice("");
    if (method !== "upi") {
      setSelectedUpiApp("");
      setUpiPaymentStep("idle");
      setUpiQrRequested(false);
      setUpiQrCode("");
    }
  };

  const selectedUpiAppLabel = UPI_APPS.find(app => app.id === selectedUpiApp)?.label || "";

  const selectUpiApp = (app) => {
    setSelectedUpiApp(app.id);
    setForm(current => ({
      ...current,
      payment_provider: app.label,
      payment_status: "pending",
      payment_reference: "",
    }));
    setUpiPaymentStep("idle");
    setError("");
    setPaymentError("");
    setPaymentNotice("");
  };

  const openUpiApp = () => {
    const app = UPI_APPS.find(option => option.id === selectedUpiApp);

    if (!app) {
      setPaymentNotice("");
      setPaymentError("Select Google Pay, PhonePe, Paytm, BHIM, or Any UPI app first.");
      return false;
    }

    if (!cartItems.length || total <= 0) {
      setPaymentNotice("");
      setPaymentError("Your cart is empty. Add menu items before opening a UPI app.");
      return false;
    }

    setUpiPaymentStep("opened");
    setPaymentNotice(`Opening ${app.label}. Complete the payment there, then come back and enter the transaction ID.`);
    window.location.assign(getUpiAppLink(app));
    return true;
  };

  const generateUpiQrCode = async () => {
    setPaymentError("");
    setPaymentNotice("");
    setUpiQrRequested(true);

    if (!cartItems.length || total <= 0) {
      setPaymentError("Your cart is empty. Add menu items before generating a UPI QR code.");
      return;
    }

    setUpiQrLoading(true);
    try {
      const url = await QRCode.toDataURL(genericUpiLink, {
        width: 360,
        margin: 1,
        color: {
          dark: "#003f2a",
          light: "#ffffff",
        },
      });
      setUpiQrCode(url);
      setUpiPaymentStep("returned");
      setPaymentNotice("QR code is ready. Pay the exact amount, then enter the UPI transaction ID.");
    } catch {
      setPaymentError("Could not generate the QR code. Try a UPI app button instead.");
      setUpiQrCode("");
    } finally {
      setUpiQrLoading(false);
    }
  };

  const openGatewayPayment = (method, provider = "") => {
    setError("");
    setPaymentError("");
    setPaymentNotice("");

    if (!PAYMENT_GATEWAY_URL) {
      setPaymentError("Payment gateway is not connected yet. Add a real gateway checkout URL and success callback before creating paid orders.");
      return;
    }

    const gatewayUrl = new URL(PAYMENT_GATEWAY_URL);
    gatewayUrl.searchParams.set("method", method);
    gatewayUrl.searchParams.set("provider", provider);
    gatewayUrl.searchParams.set("amount", total.toFixed(2));
    gatewayUrl.searchParams.set("currency", "INR");
    gatewayUrl.searchParams.set("return_url", window.location.href);
    window.location.assign(gatewayUrl.toString());
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setError("");
    setPaymentError("");
    setPaymentNotice("");

    const nextErrors = validateCheckoutForm(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!cartItems.length) {
      setPaymentError("Your cart is empty. Add menu items before checkout.");
      return;
    }

    if (form.payment_method === "upi") {
      if (upiPaymentStep === "idle" && !upiQrCode) {
        openUpiApp();
        return;
      }

      if (!form.payment_reference.trim()) {
        setPaymentError("After successful UPI payment, enter the transaction ID from your UPI app before the order is placed.");
        return;
      }
    } else if (["card", "wallet"].includes(form.payment_method) && form.payment_status !== "paid") {
      setPaymentError("Complete the payment gateway payment first. The order is created only after successful payment.");
      return;
    }

    setLoading(true);

    try {
      const paidForm = {
        ...form,
        payment_provider: form.payment_provider || selectedUpiAppLabel || "UPI",
        payment_reference: form.payment_reference.trim(),
        payment_status: "paid",
      };
      const order = await API.post("order/", {
        ...paidForm,
        items: cartItems.map(item => ({ item: item.id, quantity: item.quantity })),
      });
      try {
        await sendOrderEmail({
          order: order.data,
          form: paidForm,
          cartItems,
          total,
          paymentDetails: {
            provider: paidForm.payment_provider,
            status: "paid",
            reference: paidForm.payment_reference,
            upiId: UPI_ID,
            upiName: UPI_NAME,
          },
        });
      } catch (emailError) {
        console.warn("Order email was not sent:", emailError);
      }
      localStorage.removeItem("checkoutCart");
      localStorage.removeItem("cart");
      setSuccessOrder(order.data);
    } catch (err) {
      const data = err.response?.data;
      setError(err.message || (typeof data === "object" ? Object.values(data).flat().join(" ") : "Could not place this order."));
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setSuccessOrder(null);
    navigate("/dashboard");
  };

  return (
    <main className="workspace">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h1>Address and payment</h1>
        </div>
        <Link className="secondary-button" to="/menu">
          Back to menu
        </Link>
      </section>

      <section className="checkout-layout">
        <form className="checkout-form" onSubmit={placeOrder} noValidate>
          <div className="section-title-row">
            <h2>Delivery details</h2>
            <span className="status-chip">Required</span>
          </div>

          <div className="form-grid">
            <label className={fieldErrors.customer_name ? "has-error" : ""}>
              Customer name
              <input value={form.customer_name} onChange={e => setField("customer_name", e.target.value)} aria-invalid={Boolean(fieldErrors.customer_name)} />
              {fieldErrors.customer_name && <span className="field-error">{fieldErrors.customer_name}</span>}
            </label>
            <label className={fieldErrors.phone ? "has-error" : ""}>
              Phone number
              <input value={form.phone} onChange={e => setField("phone", e.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />
              {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
            </label>
          </div>

          <label className={fieldErrors.address_line ? "has-error" : ""}>
            Full address
            <input value={form.address_line} onChange={e => setField("address_line", e.target.value)} aria-invalid={Boolean(fieldErrors.address_line)} />
            {fieldErrors.address_line && <span className="field-error">{fieldErrors.address_line}</span>}
          </label>

          <div className="form-grid">
            <label className={fieldErrors.city ? "has-error" : ""}>
              City
              <input value={form.city} onChange={e => setField("city", e.target.value)} aria-invalid={Boolean(fieldErrors.city)} />
              {fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}
            </label>
            <label className={fieldErrors.pincode ? "has-error" : ""}>
              Pincode
              <input value={form.pincode} onChange={e => setField("pincode", e.target.value)} inputMode="numeric" aria-invalid={Boolean(fieldErrors.pincode)} />
              {fieldErrors.pincode && <span className="field-error">{fieldErrors.pincode}</span>}
            </label>
          </div>

          <label>
            Delivery notes
            <textarea
              value={form.delivery_notes}
              onChange={e => setField("delivery_notes", e.target.value)}
              placeholder="Gate, floor, landmark, or order instructions"
              rows="3"
            />
          </label>

          <div className="section-title-row payment-title">
            <h2>Payment</h2>
            <span className="status-chip">Secure checkout</span>
          </div>

          <section className="payment-shell" aria-label="Payment methods">
            <div className="payment-method-menu">
              {paymentOptions.map(option => (
                <button
                  className={form.payment_method === option.id ? "payment-method-button active" : "payment-method-button"}
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentMethod(option.id)}
                >
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.text}</small>
                  </span>
                  <em>{option.badge}</em>
                </button>
              ))}
            </div>

            <div className="payment-detail-panel">
              {form.payment_method === "upi" && (
                <section className="upi-payment-panel" aria-label="UPI payment details">
                  <div className="upi-manual">
                    <span>Pay by UPI</span>
                    <h3>Choose a UPI app</h3>
                    <p>Select an app, then use the Place order button. The order is created only after you return and enter the successful UPI transaction ID.</p>
                    <div className="upi-app-grid" aria-label="Select UPI app">
                      {UPI_APPS.map(app => (
                        <button
                          className={selectedUpiApp === app.id ? "upi-app-button active" : "upi-app-button"}
                          key={app.id}
                          type="button"
                          onClick={() => selectUpiApp(app)}
                        >
                          {app.label}
                        </button>
                      ))}
                    </div>
                    <div className="upi-qr-option">
                      <button className="secondary-button compact" type="button" onClick={generateUpiQrCode} disabled={upiQrLoading}>
                        {upiQrLoading ? "Generating QR..." : upiQrCode ? "Refresh QR code" : "Generate UPI QR code"}
                      </button>
                      {upiQrRequested && upiQrCode && (
                        <div className="upi-qr-card">
                          <img src={upiQrCode} alt={`UPI QR code for Rs ${total.toFixed(2)} payable to ${UPI_NAME}`} />
                        </div>
                      )}
                    </div>
                    <div className="payment-confirm-panel">
                      <label className={paymentError && !form.payment_reference.trim() ? "has-error" : ""}>
                        Successful UPI transaction ID
                        <input
                          value={form.payment_reference}
                          onChange={e => setField("payment_reference", e.target.value)}
                          placeholder="Example: 412345678901"
                        />
                      </label>
                      {upiPaymentStep === "opened" && (
                        <p className="payment-confirmed">UPI app opened. Complete payment there, then return here.</p>
                      )}
                      {upiPaymentStep === "returned" && (
                        <p className="payment-confirmed">Welcome back. Enter the transaction ID and press Place order.</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {form.payment_method === "card" && (
                <section className="gateway-payment-panel" aria-label="Card payment details">
                  <span>Card payment</span>
                  <h3>Pay securely by card</h3>
                  <p>Card details are entered on the payment gateway page, not stored in Cafaline. Supports major debit and credit cards.</p>
                  <div className="payment-brand-row">
                    <small>Visa</small>
                    <small>Mastercard</small>
                    <small>RuPay</small>
                    <small>Amex</small>
                  </div>
                  <button className="primary-link compact" type="button" onClick={() => openGatewayPayment("card")}>
                    Continue to card payment - Rs {total.toFixed(0)}
                  </button>
                </section>
              )}

              {form.payment_method === "wallet" && (
                <section className="gateway-payment-panel" aria-label="Wallet payment details">
                  <span>Wallet payment</span>
                  <h3>Select wallet</h3>
                  <p>Choose a wallet provider. Your order is created only after the payment gateway confirms the wallet payment.</p>
                  <div className="wallet-option-list" aria-label="Select wallet">
                    {WALLET_APPS.map(app => (
                      <button
                        className="wallet-option-button"
                        key={app.id}
                        type="button"
                        onClick={() => openGatewayPayment("wallet", app.id)}
                      >
                        <span>
                          <strong>{app.label}</strong>
                          <small>{app.text}</small>
                        </span>
                        <em>Pay Rs {total.toFixed(0)}</em>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </section>

          {paymentError && <p className="field-error payment-field-error">{paymentError}</p>}
          {paymentNotice && <p className="payment-notice">{paymentNotice}</p>}
          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Placing order..." : form.payment_method === "upi" && upiPaymentStep === "idle" && !upiQrCode
              ? `Pay with ${selectedUpiAppLabel || "UPI app"} - Rs ${total.toFixed(0)}`
              : `Place paid order - Rs ${total.toFixed(0)}`}
          </button>
        </form>

        <aside className="cart-panel checkout-summary">
          <div className="section-title-row">
            <h2>Order summary</h2>
            <span className="status-chip">{cartItems.length} lines</span>
          </div>

          <div className="cart-list">
            {cartItems.length === 0 && (
              <div className="empty-state">
                <strong>No cart found</strong>
                <p>Return to the menu to select items.</p>
              </div>
            )}
            {cartItems.map(item => (
              <div className="cart-line" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.quantity} x Rs {Number(item.price).toFixed(0)}</span>
                </div>
                <span>Rs {(Number(item.price) * Number(item.quantity)).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <span>Total payable</span>
            <strong>Rs {total.toFixed(0)}</strong>
          </div>
        </aside>
      </section>

      {successOrder && (
        <div className="success-modal-backdrop" role="presentation">
          <div className="success-modal" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
            <span className="success-modal-mark">OK</span>
            <h2 id="order-success-title">Order placed</h2>
            <p>Order #{successOrder.id} has been created and the order email has been sent when EmailJS is configured.</p>
            <button className="primary-button compact" type="button" onClick={closeSuccess}>
              Go to dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
