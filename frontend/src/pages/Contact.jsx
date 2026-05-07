import { useState } from "react";
import { sendContactEmail } from "../services/email";

const blankForm = {
  type: "review",
  name: "",
  email: "",
  phone: "",
  rating: "5",
  subject: "",
  message: "",
};

const validateContactForm = (values) => {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9+\-\s()]{7,15}$/;

  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.phone.trim() && !phonePattern.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!values.subject.trim()) errors.subject = "Subject is required.";
  if (!values.message.trim()) {
    errors.message = "Message is required.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message should be at least 10 characters.";
  }

  return errors;
};

export default function Contact() {
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const setField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setFieldErrors(current => ({ ...current, [field]: "" }));
    setError("");
  };

  const submitContact = async (event) => {
    event.preventDefault();
    setError("");

    const nextErrors = validateContactForm(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);

    try {
      await sendContactEmail(form);
      setForm(blankForm);
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || "Could not send your message. Check EmailJS settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="workspace">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Support desk</p>
          <h1>Reviews and complaints</h1>
        </div>
        <span className="status-chip">EmailJS powered</span>
      </section>

      <section className="contact-layout">
        <form className="contact-form" onSubmit={submitContact} noValidate>
          <div className="section-title-row">
            <h2>Send a message</h2>
            <span className="status-chip">{form.type === "review" ? "Review" : "Complaint"}</span>
          </div>

          <div className="contact-type-grid" aria-label="Message type">
            <label className={form.type === "review" ? "contact-type active" : "contact-type"}>
              <input
                checked={form.type === "review"}
                name="contact_type"
                onChange={() => setField("type", "review")}
                type="radio"
              />
              Review
            </label>
            <label className={form.type === "complaint" ? "contact-type active" : "contact-type"}>
              <input
                checked={form.type === "complaint"}
                name="contact_type"
                onChange={() => setField("type", "complaint")}
                type="radio"
              />
              Complaint
            </label>
          </div>

          <div className="form-grid">
            <label className={fieldErrors.name ? "has-error" : ""}>
              Name
              <input value={form.name} onChange={e => setField("name", e.target.value)} aria-invalid={Boolean(fieldErrors.name)} />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </label>
            <label className={fieldErrors.email ? "has-error" : ""}>
              Email
              <input value={form.email} onChange={e => setField("email", e.target.value)} type="email" aria-invalid={Boolean(fieldErrors.email)} />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </label>
          </div>

          <div className="form-grid">
            <label className={fieldErrors.phone ? "has-error" : ""}>
              Phone
              <input value={form.phone} onChange={e => setField("phone", e.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />
              {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
            </label>
            <label>
              Rating
              <select value={form.rating} onChange={e => setField("rating", e.target.value)}>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Okay</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Very poor</option>
              </select>
            </label>
          </div>

          <label className={fieldErrors.subject ? "has-error" : ""}>
            Subject
            <input value={form.subject} onChange={e => setField("subject", e.target.value)} aria-invalid={Boolean(fieldErrors.subject)} />
            {fieldErrors.subject && <span className="field-error">{fieldErrors.subject}</span>}
          </label>

          <label className={fieldErrors.message ? "has-error" : ""}>
            Message
            <textarea
              value={form.message}
              onChange={e => setField("message", e.target.value)}
              placeholder="Tell us what happened or what you loved."
              rows="6"
              aria-invalid={Boolean(fieldErrors.message)}
            />
            {fieldErrors.message && <span className="field-error">{fieldErrors.message}</span>}
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send message"}
          </button>
        </form>

        <aside className="contact-aside">
          <div>
            <p className="eyebrow">Cafaline care</p>
            <h2>We read every note.</h2>
            <p>Use reviews for service feedback and complaints for order, payment, delivery, or menu issues.</p>
          </div>
          <div className="contact-info-list">
            <span>Order issue</span>
            <strong>Include your order number if available.</strong>
          </div>
          <div className="contact-info-list">
            <span>Payment issue</span>
            <strong>Add UPI/card/wallet reference details.</strong>
          </div>
          <div className="contact-info-list">
            <span>Menu feedback</span>
            <strong>Tell us which item needs attention.</strong>
          </div>
        </aside>
      </section>

      {showSuccess && (
        <div className="success-modal-backdrop" role="presentation">
          <div className="success-modal" role="dialog" aria-modal="true" aria-labelledby="contact-success-title">
            <span className="success-modal-mark">OK</span>
            <h2 id="contact-success-title">Message sent</h2>
            <p>Your review or complaint has reached the Cafaline care desk.</p>
            <button className="primary-button compact" type="button" onClick={() => setShowSuccess(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
