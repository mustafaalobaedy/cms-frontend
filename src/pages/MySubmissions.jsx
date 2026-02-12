import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function MySubmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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

  async function download(submissionId) {
    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_BASE_URL}/submissions/${submissionId}/paper`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Download failed");
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `paper-${submissionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
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

                <button onClick={() => download(s._id)}>Download PDF</button>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                Submitted:{" "}
                {s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}
              </div>

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                ID: {s._id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
