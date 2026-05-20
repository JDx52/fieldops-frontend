import { useState, useEffect } from "react";

const STORAGE_KEY = "fieldops_pricebook";
const API_URL = process.env.REACT_APP_API_URL || "https://fieldops-api-production-b341.up.railway.app/v1";

function getToken() { return localStorage.getItem("fieldops_token"); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Request failed");
  return data.data;
}

export const CATEGORIES = [
  "Electrical", "Refrigerants", "Filters", "Belts & Pulleys",
  "Motors", "Controls", "Labor", "Misc Parts", "Chemicals",
];

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.unit_of_measure || CATEGORIES[0],
    price: parseFloat(p.unit_price || 0),
    description: p.description || "",
  };
}

export function loadPricebook() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}

export function savePricebook(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function Pricebook() {
  const [items, setItems] = useState(() => loadPricebook());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], price: "", description: "" });
  const [sortCol, setSortCol] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/products?limit=500")
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapProduct);
          setItems(mapped);
          savePricebook(mapped);
        }
      })
      .catch(() => {
        const local = loadPricebook();
        if (local.length > 0) setItems(local);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { savePricebook(items); }, [items]);

  async function handleSave() {
    if (!form.name.trim()) { alert("Item name is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { alert("Valid price is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || "",
        unit_price: parseFloat(form.price),
        unit_cost: 0,
        unit_of_measure: form.category,
        is_service: form.category === "Labor",
      };
      if (editing) {
        try {
          await apiFetch(`/products/${editing}`, { method: "PATCH", body: JSON.stringify(payload) });
        } catch {}
        setItems(p => p.map(i => i.id === editing ? { ...i, name: form.name, category: form.category, price: parseFloat(form.price), description: form.description } : i));
      } else {
        let newItem = { id: Date.now(), name: form.name, category: form.category, price: parseFloat(form.price), description: form.description };
        try {
          const saved = await apiFetch("/products", { method: "POST", body: JSON.stringify(payload) });
          if (saved?.id) newItem = mapProduct(saved);
        } catch {}
        setItems(p => [...p, newItem]);
      }
    } finally {
      setSaving(false);
      setShowForm(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this item?")) return;
    try { await apiFetch(`/products/${id}`, { method: "DELETE" }); } catch {}
    setItems(p => p.filter(i => i.id !== id));
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", category: CATEGORIES[0], price: "", description: "" });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({ name: item.name, category: item.category, price: String(item.price), description: item.description || "" });
    setShowForm(true);
  }

  function toggleSort(col) {
    if (sortCol === col) setSortAsc(p => !p);
    else { setSortCol(col); setSortAsc(true); }
  }

  const filtered = items
    .filter(i => filterCat === "all" || i.category === filterCat)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.description || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === "price") { av = parseFloat(av); bv = parseFloat(bv); }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13, border: "1px solid var(--border)", outline: "none", fontFamily: "var(--sans)", boxSizing: "border-box" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6, fontFamily: "var(--display)" };
  const th = { padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text3)", fontFamily: "var(--display)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--surface2)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" };
  const td = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontFamily: "var(--display)", fontWeight: 700 }}>Pricebook</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{items.length} item{items.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={openNew} style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Add Item</button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" style={{ ...inp, paddingLeft: 28 }} />
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 13 }}>⌕</span>
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inp, width: "auto" }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>Loading pricebook...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 18, fontFamily: "var(--display)", fontWeight: 700, color: "var(--text1)", marginBottom: 8 }}>{items.length === 0 ? "Pricebook is empty" : "No results"}</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>{items.length === 0 ? "Add parts, labor, and materials you commonly use" : "Try a different search or filter"}</div>
            {items.length === 0 && <button onClick={openNew} style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Add First Item</button>}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[["name","Item Name"],["category","Category"],["price","Price"],["description","Description"]].map(([col, label]) => (
                  <th key={col} style={th} onClick={() => toggleSort(col)}>{label} {sortCol === col ? (sortAsc ? "↑" : "↓") : ""}</th>
                ))}
                <th style={{ ...th, cursor: "default" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={{ ...td, fontWeight: 600 }}>{item.name}</td>
                  <td style={td}><span style={{ background: "var(--blue-lt)", color: "var(--blue)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, border: "1px solid var(--blue-bd)" }}>{item.category}</span></td>
                  <td style={{ ...td, fontFamily: "var(--mono)", fontWeight: 600, color: "var(--green)" }}>${parseFloat(item.price).toFixed(2)}</td>
                  <td style={{ ...td, color: "var(--text3)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description || "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => openEdit(item)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "var(--text2)", marginRight: 6 }}>Edit</button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "1px solid var(--red-bd)", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "var(--red)" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: "var(--surface)", borderRadius: 16, width: "100%", maxWidth: 480, border: "1px solid var(--border)", boxShadow: "0 24px 64px #00000030" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 18, fontFamily: "var(--display)", fontWeight: 700 }}>{editing ? "Edit Item" : "Add Item"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, color: "var(--text3)", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Item Name *</label><input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 5-Ton Capacitor, R-410A Refrigerant" autoFocus /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Price *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 13 }}>$</span>
                    <input type="number" min="0" step="0.01" style={{ ...inp, paddingLeft: 22 }} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
              </div>
              <div><label style={lbl}>Description</label><input style={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional — part number, brand, notes" /></div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ background: "var(--surface)", color: "var(--text2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
