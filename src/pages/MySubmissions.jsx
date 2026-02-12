import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function MySubmissions() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch("/submissions/mine");
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function downloadPaper(id) {
    // Use browser download via a direct fetch+blob to include Authorization
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/submissions/${id}/paper`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Download failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paper-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>My Submissions</h2>
        <button onClick={load}>Refresh</button>
      </div>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && !err && items.length === 0 && <p>No submissions yet.</p>}

      {!loading && !err && items.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((s) => (
            <div
              key={s._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{s.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Status: <b>{s.status}</b>
                  </div>
                </div>
                <button onClick={() => downloadPaper(s._id)}>
                  Download PDF
                </button>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                Submission ID: {s._id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
