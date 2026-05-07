import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState({ orders: 0, sales: 0, recent_orders: [] });
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setError("");
    setLoading(true);

    try {
      const [dashboard, orders] = await Promise.all([
        API.get("dashboard/"),
        API.get("order/"),
      ]);
      setData(dashboard.data);
      setMyOrders(orders.data);
    } catch {
      setError("Could not refresh the dashboard. Check the backend server and sign in again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    Promise.all([
      API.get("dashboard/"),
      API.get("order/"),
    ])
      .then(([dashboard, orders]) => {
        if (!mounted) return;
        setData(dashboard.data);
        setMyOrders(orders.data);
      })
      .catch(() => {
        if (mounted) setError("Could not refresh the dashboard. Check the backend server and sign in again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const recentOrders = data.recent_orders || [];

  return (
    <main className="workspace">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Reserve performance</p>
          <h1>Your dashboard</h1>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" type="button" onClick={loadDashboard} disabled={loading}>
            Refresh
          </button>
          <Link className="primary-link" to="/menu">
            New order
          </Link>
        </div>
      </section>

      {error && <p className="inline-alert">{error}</p>}

      <section className="metric-grid" aria-live="polite">
        <article className="metric-card">
          <span>Your orders</span>
          <strong>{loading ? "..." : data.orders}</strong>
        </article>
        <article className="metric-card">
          <span>Your total</span>
          <strong>{loading ? "..." : `Rs ${Number(data.sales || 0).toFixed(0)}`}</strong>
        </article>
        <article className="metric-card">
          <span>Your recent orders</span>
          <strong>{loading ? "..." : myOrders.length}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="table-panel">
          <div className="section-title-row">
            <h2>Your latest orders</h2>
            <span className="status-chip">{recentOrders.length} shown</span>
          </div>
          <div className="order-list">
            {recentOrders.length === 0 && <p className="muted">No orders have been placed yet.</p>}
            {recentOrders.map(order => (
              <article className="order-row" key={order.id}>
                <div>
                  <strong>Order #{order.id}</strong>
                  <span>{order.items.map(item => `${item.quantity}x ${item.item_name}`).join(", ")}</span>
                  <span>{order.payment_method} payment - {order.city || "No city"}</span>
                </div>
                <div>
                  <strong>Rs {Number(order.total_price).toFixed(0)}</strong>
                  <span>{order.status}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="table-panel">
          <div className="section-title-row">
            <h2>Your history</h2>
            <span className="status-chip">{myOrders.length} orders</span>
          </div>
          <div className="compact-list">
            {myOrders.length === 0 && <p className="muted">Your new orders will appear here.</p>}
            {myOrders.map(order => (
              <div className="compact-row" key={order.id}>
                <span>#{order.id}</span>
                <strong>Rs {Number(order.total_price).toFixed(0)}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
