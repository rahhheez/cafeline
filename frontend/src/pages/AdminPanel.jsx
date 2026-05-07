import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

const blankItem = {
  name: "",
  category: "Coffee",
  description: "",
  price: "",
  image_url: "",
  preparation_time: 10,
  is_available: true,
  is_featured: false,
  is_coming_soon: false,
};

export default function AdminPanel() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankItem);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const categories = useMemo(() => {
    const existing = items.map(item => item.category).filter(Boolean);
    return ["Coffee", "Cold Coffee", "Tea", "Food", "Bakery", ...existing]
      .filter((category, index, all) => all.indexOf(category) === index);
  }, [items]);

  const loadItems = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await API.get("admin/menu/");
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load admin menu items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    API.get("admin/menu/")
      .then(res => {
        if (mounted) setItems(res.data);
      })
      .catch(err => {
        if (mounted) setError(err.response?.data?.detail || "Could not load admin menu items.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(blankItem);
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || "",
      price: item.price,
      image_url: item.image_url || "",
      preparation_time: item.preparation_time,
      is_available: item.is_available,
      is_featured: item.is_featured,
      is_coming_soon: item.is_coming_soon,
    });
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      price: Number(form.price),
      preparation_time: Number(form.preparation_time),
    };

    try {
      if (editingId) {
        await API.put(`admin/menu/${editingId}/`, payload);
        setNotice("Menu item updated.");
      } else {
        await API.post("admin/menu/", payload);
        setNotice("Menu item added.");
      }
      resetForm();
      await loadItems();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Could not save this item.");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item) => {
    const ok = window.confirm(`Remove ${item.name} from the menu?`);
    if (!ok) return;

    setError("");
    setNotice("");

    try {
      await API.delete(`admin/menu/${item.id}/`);
      setNotice("Menu item removed.");
      await loadItems();
    } catch {
      setError("Could not remove this item. It may be linked to previous orders.");
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await API.patch(`admin/menu/${item.id}/`, { is_available: !item.is_available });
      await loadItems();
    } catch {
      setError("Could not update availability.");
    }
  };

  return (
    <main className="workspace">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Menu curation</p>
          <h1>Reserve admin panel</h1>
        </div>
        <button className="secondary-button" type="button" onClick={loadItems} disabled={loading}>
          Refresh
        </button>
      </section>

      <section className="admin-layout">
        <form className="admin-form" onSubmit={saveItem}>
          <div className="section-title-row">
            <h2>{editingId ? "Edit item" : "Add item"}</h2>
            {editingId && (
              <button className="ghost-button compact" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              Item name
              <input value={form.name} onChange={e => setField("name", e.target.value)} required />
            </label>
            <label>
              Category
              <input
                value={form.category}
                list="categories"
                onChange={e => setField("category", e.target.value)}
                required
              />
              <datalist id="categories">
                {categories.map(category => <option value={category} key={category} />)}
              </datalist>
            </label>
            <label>
              Price
              <input
                value={form.price}
                type="number"
                min="1"
                step="1"
                onChange={e => setField("price", e.target.value)}
                required
              />
            </label>
            <label>
              Preparation time
              <input
                value={form.preparation_time}
                type="number"
                min="1"
                step="1"
                onChange={e => setField("preparation_time", e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            Image URL
            <input
              value={form.image_url}
              onChange={e => setField("image_url", e.target.value)}
              placeholder="Paste cafe item image URL"
            />
          </label>

          <div className="admin-image-preview">
            {form.image_url ? <img src={form.image_url} alt="Menu item preview" /> : <span>Image preview</span>}
          </div>

          <label>
            Description
            <textarea value={form.description} onChange={e => setField("description", e.target.value)} rows="4" />
          </label>

          <div className="check-row">
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={e => setField("is_available", e.target.checked)}
              />
              In stock
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={e => setField("is_featured", e.target.checked)}
              />
              Featured
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.is_coming_soon}
                onChange={e => setField("is_coming_soon", e.target.checked)}
              />
              Coming soon
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-success">{notice}</p>}

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Add item"}
          </button>
        </form>

        <section className="table-panel admin-list">
          <div className="section-title-row">
            <h2>Menu inventory</h2>
            <span className="status-chip">{loading ? "Loading" : `${items.length} items`}</span>
          </div>

          <div className="admin-items">
            {items.map(item => (
              <article className="admin-item" key={item.id}>
                <div className="admin-item-main">
                  <div className="admin-item-photo">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                    ) : (
                      <span>{item.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.category} - Rs {Number(item.price).toFixed(0)} - {item.preparation_time} min</span>
                    <small className={item.is_coming_soon ? "admin-stock coming-soon" : item.is_available ? "admin-stock in-stock" : "admin-stock out-stock"}>
                      {item.is_coming_soon ? "Coming soon" : item.is_available ? "In stock" : "Out of stock"}
                    </small>
                    <p>{item.description || "No description added."}</p>
                  </div>
                </div>
                <div className="admin-item-actions">
                  <button className="secondary-button compact" type="button" onClick={() => toggleAvailability(item)}>
                    {item.is_available ? "Mark out of stock" : "Restock"}
                  </button>
                  <button className="secondary-button compact" type="button" onClick={() => editItem(item)}>
                    Edit
                  </button>
                  <button className="danger-button compact" type="button" onClick={() => removeItem(item)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
            {!loading && items.length === 0 && <p className="muted">No menu items yet.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
