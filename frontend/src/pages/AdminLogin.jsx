import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import AuthCarousel from "../components/AuthCarousel";
import { cafeSlides } from "../components/authSlides";

const adminSlides = [
  {
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "Back office lounge",
    title: "Cafaline Reserve Admin",
    text: "Curate the premium menu, manage product photography, and keep service polished.",
    tags: ["Menu curation", "Item photos", "Premium service"],
  },
  cafeSlides[2],
  cafeSlides[0],
];

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("auth/admin-login/", form);
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("isAdmin", String(Boolean(res.data.is_admin)));
      navigate("/admin-panel");
    } catch (err) {
      setError(err.response?.data?.error || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page cafe-auth">
      <AuthCarousel slides={adminSlides} />

      <section className="auth-panel">
        <form className="auth-card" onSubmit={login}>
          <div>
            <p className="eyebrow">Restricted access</p>
            <h2>Admin login</h2>
          </div>

          <label>
            Admin ID
            <input
              value={form.username}
              type="email"
              autoComplete="email"
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
            />
          </label>

          <label>
            Password
            <input
              value={form.password}
              type="password"
              autoComplete="current-password"
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter admin password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Enter admin panel"}
          </button>

          <p className="auth-switch">
            user login? <Link to="/">Use user login</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
