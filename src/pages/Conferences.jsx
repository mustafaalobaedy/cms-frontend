import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { useAuth } from "../routes/AuthContext";

export default function Conferences() {
  const { user } = useAuth();
  const roles = useMemo(() => user?.user?.roles || user?.roles || [], [user]);
  const canCreate = roles.includes("ADMIN") || roles.includes("CHAIR");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form
  const [code, setCode] = useState("ICAICI2026B");
  const [name, setName] = useState("Test Conference B");
  const [location, setLocation] = useState("Kuala Lumpur, Malaysia");
  const [startDate, setStartDate] = useState("2026-05-09");
  const [endDate, setEndDate] = useState("2026-05-10");
  const [submissionDeadline, setSubmissionDeadline] = useState("2026-03-15");
  const [cameraReadyDeadline, setCameraReadyDeadline] = useState("2026-04-10");
  const [status, setStatus] = useState("OPEN");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch("/conferences");
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createConference(e) {
    e.preventDefault();
    setErr("");
    try {
      await apiFetch("/conferences", {
        method: "POST",
        body: JSON.stringify({
          code,
          name,
          location,
          startDate,
          endDate,
          submissionDeadline,
          cameraReadyDeadline,
          status,
        }),
      });
      await load();
      alert("Conference created");
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Conferences</h2>
        <button onClick={load}>Refresh</button>
      </div>

      {canCreate && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Create Conference</h3>
          <form
            onSubmit={createConference}
            style={{ display: "grid", gap: 10 }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <label>Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label>Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label>Submission Deadline</label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label>Camera-ready Deadline</label>
              <input
                type="date"
                value={cameraReadyDeadline}
                onChange={(e) => setCameraReadyDeadline(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <button type="submit">Create</button>
          </form>
        </div>
      )}

      {!canCreate && (
        <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.7 }}>
          You don’t have permission to create conferences.
        </div>
      )}

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && !err && items.length === 0 && <p>No conferences yet.</p>}

      {!loading && !err && items.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((c) => (
            <div
              key={c._id}
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
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{c.code}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Status: <b>{c.status}</b>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 13 }}>
                <div>
                  Dates:{" "}
                  {c.startDate
                    ? new Date(c.startDate).toLocaleDateString()
                    : "-"}{" "}
                  → {c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}
                </div>
                <div>
                  Submission deadline:{" "}
                  {c.submissionDeadline
                    ? new Date(c.submissionDeadline).toLocaleString()
                    : "-"}
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                ID: {c._id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
