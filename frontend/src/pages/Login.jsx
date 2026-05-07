import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import AuthCarousel from "../components/AuthCarousel";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("auth/login/", form);
      if (res.data.access) {
        localStorage.setItem("token", res.data.access);
        localStorage.setItem("refreshToken", res.data.refresh);
        localStorage.setItem("username", form.username);
        localStorage.setItem("isAdmin", String(Boolean(res.data.is_admin)));
        navigate("/menu");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Login failed. Check your username and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page cafe-auth">
      <AuthCarousel />

      <section className="auth-panel">
        <form className="auth-card" onSubmit={login}>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2> Sign in</h2>
          </div>

          <label>
            Gmail
            <input
              value={form.username}
              type="email"
              autoComplete="email"
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username "
            />
          </label>

          <label>
            Password
            <input
              value={form.password}
              type="password"
              autoComplete="current-password"
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-switch">
            You don't have an account? <Link to="/signup">Create one</Link>
          </p>
          <p className="auth-switch">
            Admin access? <Link to="/admin-login">Open admin login</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
