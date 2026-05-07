import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Menu from "./pages/Menu";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import "./App.css";

function ProtectedRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  return localStorage.getItem("token") && localStorage.getItem("isAdmin") === "true"
    ? children
    : <Navigate to="/admin-login" replace />;
}

function UserRoute({ children }) {
  if (!localStorage.getItem("token")) return <Navigate to="/" replace />;
  return localStorage.getItem("isAdmin") === "true"
    ? <Navigate to="/admin-panel" replace />
    : children;
}

function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username") || "Staff";
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("cart");
    localStorage.removeItem("checkoutCart");
    navigate("/");
  };

  if (location.pathname === "/" || location.pathname === "/signup" || location.pathname === "/admin-login") {
    return children;
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <Link className="brand" to="/menu" aria-label="Cafaline menu">
          <span className="brand-mark">Cf</span>
          <span>Cafaline Reserve</span>
        </Link>
        <nav className="nav-tabs" aria-label="Primary navigation">
          <Link className={location.pathname === "/menu" ? "active" : ""} to="/menu">
            Menu
          </Link>
          <Link className={location.pathname === "/contact" ? "active" : ""} to="/contact">
            Contact
          </Link>
          {!isAdmin && (
            <Link className={location.pathname === "/dashboard" ? "active" : ""} to="/dashboard">
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link className={location.pathname === "/admin-panel" ? "active" : ""} to="/admin-panel">
              Admin
            </Link>
          )}
        </nav>
        <div className="user-actions">
          <span className="user-pill">{username}</span>
          <button className="icon-button" type="button" onClick={logout} title="Logout" aria-label="Logout">
            Out
          </button>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-brand-block">
          <Link className="footer-brand" to="/menu" aria-label="Cafaline home">
            <span className="brand-mark">Cf</span>
            <span>Cafaline Reserve</span>
          </Link>
          <p>Premium cafe ordering, curated menu service, and quick support for every table, counter, and doorstep order.</p>
        </div>

        <div className="footer-grid">
          <div>
            <span>Explore</span>
            <Link to="/menu">Menu</Link>
            {!isAdmin && <Link to="/dashboard">Dashboard</Link>}
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <span>Service</span>
            <p>Freshly prepared</p>
            <p>UPI, card, wallet</p>
            <p>Reviews and complaints</p>
          </div>
          <div>
            <span>Hours</span>
            <p>Mon - Sun</p>
            <p>8:00 AM - 10:00 PM</p>
            <p>Cafaline care desk</p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Cafaline Reserve</span>
          <span>Made for smooth cafe service</span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <Menu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <UserRoute>
                <Dashboard />
              </UserRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
