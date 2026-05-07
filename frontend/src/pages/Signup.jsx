import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import AuthCarousel from "../components/AuthCarousel";
import { cafeSlides } from "../components/authSlides";

const validateSignupForm = (values) => {
  const errors = {};
  const email = values.username.trim();

  if (!email) {
    errors.username = "Gmail address is required.";
  } else if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
    errors.username = "Use a valid Gmail address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
};

const getApiErrorMessage = (err) => {
  const data = err.response?.data;

  if (!err.response) {
    return "Backend server is not running. Start Django on port 8000 and try again.";
  }
  if (typeof data === "string") return data;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  if (typeof data === "object" && data) return Object.values(data).flat().join(" ");

  return "Could not create this account.";
};

export default function Signup() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const setField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setFieldErrors(current => ({ ...current, [field]: "" }));
    setError("");
  };

  const signup = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");

    const nextErrors = validateSignupForm(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);

    try {
      const payload = {
        username: form.username.trim().toLowerCase(),
        password: form.password,
      };
      await API.post("auth/signup/", payload);
      const login = await API.post("auth/login/", payload);
      localStorage.setItem("token", login.data.access);
      localStorage.setItem("refreshToken", login.data.refresh);
      localStorage.setItem("username", payload.username);
      localStorage.setItem("isAdmin", String(Boolean(login.data.is_admin)));
      setNotice("Account ready. Opening the menu...");
      navigate("/menu");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page cafe-auth">
      <AuthCarousel slides={[cafeSlides[1], cafeSlides[0], cafeSlides[2]]} />

      <section className="auth-panel">
        <form className="auth-card" onSubmit={signup} noValidate>
          <div>
            <p className="eyebrow">Start service</p>
            <h2>Create account</h2>
          </div>

          <label className={fieldErrors.username ? "has-error" : ""}>
            Gmail
            <input
              value={form.username}
              type="email"
              autoComplete="email"
              onChange={e => setField("username", e.target.value)}
              placeholder="Enter Gmail username"
              aria-invalid={Boolean(fieldErrors.username)}
            />
            {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
          </label>

          <label className={fieldErrors.password ? "has-error" : ""}>
            Password
            <input
              value={form.password}
              type="password"
              autoComplete="new-password"
              onChange={e => setField("password", e.target.value)}
              placeholder="Choose a password"
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </label>

          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-success">{notice}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>

          <p className="auth-switch">
            Already have access? <Link to="/">Sign in</Link>
          </p>
        </form>
      </section>

    </div>
  );
}
