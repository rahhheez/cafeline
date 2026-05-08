import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const CART_STORAGE_KEY = "cart";

const readSavedCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState(readSavedCart);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartToast, setCartToast] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(() => new URLSearchParams(window.location.search).get("cart") === "1");
  const cartPanelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    API.get("menu/")
      .then(res => {
        if (mounted) setMenu(res.data);
      })
      .catch(() => {
        if (mounted) setError("Could not load the menu. Make sure Django is running on port 8000.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cafaline:cart-updated"));
  }, [cart]);

  useEffect(() => {
    const openCart = () => setIsCartOpen(true);
    window.addEventListener("cafaline:open-cart", openCart);

    return () => window.removeEventListener("cafaline:open-cart", openCart);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("cart-drawer-active", isCartOpen);
    return () => document.body.classList.remove("cart-drawer-active");
  }, [isCartOpen]);

  useEffect(() => {
    if (!cartToast) return undefined;

    const timer = window.setTimeout(() => setCartToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [cartToast]);

  const changeQuantity = (item, amount) => {
    setCartToast(null);
    setError("");

    if (item.is_coming_soon && amount > 0) {
      setError(`${item.name} is coming soon.`);
      return;
    }

    if (!item.is_available && amount > 0) {
      setError(`${item.name} is out of stock.`);
      return;
    }

    setCart(current => {
      const nextQuantity = (current[item.id] || 0) + amount;
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[item.id];
      } else {
        next[item.id] = nextQuantity;
      }

      return next;
    });

    if (amount > 0) {
      setCartToast({
        title: `${item.name} added to cart`,
        text: `${(cart[item.id] || 0) + 1} selected. Tap to review your cart.`,
      });
    }
  };

  const removeFromCart = (item) => {
    setCartToast(null);
    setError("");
    setCart(current => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
  };

  const cartItems = menu
    .filter(item => cart[item.id])
    .map(item => ({ ...item, quantity: cart[item.id], lineTotal: cart[item.id] * item.price }));
  const categories = ["All", ...menu.map(item => item.category).filter((category, index, all) => category && all.indexOf(category) === index)];
  const visibleMenu = activeCategory === "All" ? menu : menu.filter(item => item.category === activeCategory);
  const total = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const goToCheckout = () => {
    setError("");
    setCartToast(null);

    if (!cartItems.length) {
      setError("Add at least one item before placing an order.");
      return;
    }

    const unavailableItem = cartItems.find(item => item.is_coming_soon || !item.is_available);
    if (unavailableItem) {
      setError(`${unavailableItem.name} is not ready to order. Remove it from the cart.`);
      return;
    }

    localStorage.setItem("checkoutCart", JSON.stringify(cartItems));
    navigate("/checkout");
  };

  const showCart = () => {
    setCartToast(null);
    setIsCartOpen(true);
    cartPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="workspace menu-workspace">
      {cartToast && (
        <button className="cart-toast" type="button" onClick={showCart} aria-label="View cart">
          <span className="cart-toast-mark">OK</span>
          <span>
            <strong>{cartToast.title}</strong>
            <small>{cartToast.text}</small>
          </span>
        </button>
      )}

      <section className="cafe-hero">
        <div>
          <p className="eyebrow">Cafaline Reserve</p>
          <h1>Premium tea, coffee, and bakery service.</h1>
          <p>Crafted drinks, fresh bites, warm counter flow, and fast checkout for a polished cafe experience.</p>
        </div>
        <div className="hero-stat">
          <span>Today&apos;s cart</span>
          <strong>Rs {total.toFixed(0)}</strong>
          <small>{itemCount} selected</small>
        </div>
      </section>

      <section className="page-heading">
        <div>
          <p className="eyebrow">Signature menu</p>
          <h1>Build a cafe order</h1>
        </div>
        {!isAdmin && (
          <Link className="secondary-button" to="/dashboard">
            View dashboard
          </Link>
        )}
      </section>

      <section className="menu-layout">
        <div className="menu-section">
          <div className="section-title-row">
            <h2>Menu</h2>
            <span className="status-chip">{loading ? "Loading" : `${menu.length} items`}</span>
          </div>

          <div className="category-strip" aria-label="Menu categories">
            {categories.map(category => (
              <button
                className={activeCategory === category ? "category-chip active" : "category-chip"}
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {error && <p className="inline-alert">{error}</p>}

          <div className="menu-grid" aria-live="polite">
            {loading && Array.from({ length: 6 }, (_, index) => (
              <div className="menu-card skeleton" key={index}>
                <span />
                <strong />
                <small />
              </div>
            ))}

            {!loading && visibleMenu.map(item => (
              <article className="menu-card" key={item.id}>
                <div className="menu-photo">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} loading="lazy" />
                  ) : (
                    <span>{item.name.slice(0, 2).toUpperCase()}</span>
                  )}
                  <small className={item.is_coming_soon ? "stock-ribbon coming-soon" : item.is_available ? "stock-ribbon in-stock" : "stock-ribbon out-stock"}>
                    {item.is_coming_soon ? "Coming soon" : item.is_available ? "In stock" : "Out of stock"}
                  </small>
                  {item.is_featured && item.is_available && !item.is_coming_soon && <small className="featured-ribbon">Featured</small>}
                </div>
                <div className="menu-card-top">
                  <span className="item-badge">{item.name.slice(0, 2).toUpperCase()}</span>
                  <span className="price">Rs {item.price.toFixed(0)}</span>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description || `${item.category} - ${item.preparation_time} min`}</p>
                <div className="quantity-row">
                  <button
                    className="round-button"
                    type="button"
                    onClick={() => changeQuantity(item, -1)}
                    aria-label={`Remove one ${item.name}`}
                  >
                    -
                  </button>
                  <span>{cart[item.id] || 0}</span>
                  <button
                    className="round-button"
                    type="button"
                    onClick={() => changeQuantity(item, 1)}
                    disabled={!item.is_available || item.is_coming_soon}
                    aria-label={`Add one ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button className={isCartOpen ? "cart-backdrop open" : "cart-backdrop"} type="button" onClick={() => setIsCartOpen(false)} aria-label="Close cart" />

        <aside className={isCartOpen ? "cart-panel cart-panel-open" : "cart-panel"} ref={cartPanelRef} id="current-cart">
          <div className="section-title-row">
            <h2>Current cart</h2>
            <div className="cart-heading-actions">
              <span className="status-chip">{itemCount} items</span>
              <button className="ghost-button compact cart-close-button" type="button" onClick={() => setIsCartOpen(false)}>
                Close
              </button>
            </div>
          </div>

          <div className="cart-list">
            {cartItems.length === 0 && (
              <div className="empty-state">
                <strong>No items yet</strong>
                <p>Add menu items to start the order.</p>
              </div>
            )}

            {cartItems.map(item => (
              <div className="cart-line" key={item.id}>
                <div className="cart-line-main">
                  <strong>{item.name}</strong>
                  <span>{item.quantity} x Rs {item.price.toFixed(0)}</span>
                </div>
                <div className="cart-line-actions">
                  <span>Rs {item.lineTotal.toFixed(0)}</span>
                  <button className="danger-button compact" type="button" onClick={() => removeFromCart(item)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <span>Total</span>
            <strong>Rs {total.toFixed(0)}</strong>
          </div>

          <button className="primary-button" type="button" onClick={goToCheckout}>
            Continue to payment
          </button>
          <button className="ghost-button" type="button" onClick={() => setCart({})} disabled={!cartItems.length}>
            Clear cart
          </button>
        </aside>
      </section>
    </main>
  );
}
