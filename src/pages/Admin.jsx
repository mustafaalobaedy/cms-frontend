import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { useAuth } from "../routes/AuthContext";

// Decisions allowed by backend
const DECISIONS = ["ACCEPTED", "REJECTED", "REVISION_REQUESTED"];

export default function Admin() {
  const { user, token } = useAuth();

  const [conferences, setConferences] = useState([]);
  const [selectedConferenceId, setSelectedConferenceId] = useState("");

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state for actions
  const [reviewerEmails, setReviewerEmails] = useState("");
  const [decisionValue, setDecisionValue] = useState("ACCEPTED");
  const [decisionNote, setDecisionNote] = useState("");

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // Roles
  const canAdmin = useMemo(() => {
    const rolesRaw = user?.roles ?? [];
    const roles = Array.isArray(rolesRaw)
      ? rolesRaw
      : String(rolesRaw)
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);

    return roles.includes("ADMIN") || roles.includes("CHAIR");
  }, [user]);

  // Load conferences on page open
  useEffect(() => {
    let mounted = true;

    async function loadConferences() {
      setErr("");
      setMsg("");
      try {
        const data = await apiFetch("/conferences", { token });
        if (!mounted) return;
        setConferences(Array.isArray(data) ? data : data.items || []);
        // auto-select first
        const firstId =
          (Array.isArray(data) ? data[0]?._id : data.items?.[0]?._id) || "";
        setSelectedConferenceId((prev) => prev || firstId);
      } catch (e) {
        setErr(e?.message || "Failed to load conferences");
      }
    }

    loadConferences();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Load submissions when conference changes
  useEffect(() => {
    if (!selectedConferenceId) return;
    refreshSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConferenceId]);

  async function refreshSubmissions() {
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const data = await apiFetch(
        `/admin/submissions/by-conference/${encodeURIComponent(selectedConferenceId)}`,
        { token },
      );

      setSubmissions(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      setErr(e?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  // -------- Actions --------

  async function assignReviewers(subId) {
    setErr("");
    setMsg("");

    if (!canAdmin) return setErr("Only ADMIN/CHAIR can assign reviewers");

    const emails = reviewerEmails
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      return setErr("Please enter at least 1 reviewer email");
    }

    try {
      await apiFetch(`/admin/submissions/${subId}/assign-reviewers`, {
        method: "POST",
        token,
        body: { reviewerEmails: emails },
      });
      setMsg("Reviewers assigned. Status should be UNDER_REVIEW.");
      await refreshSubmissions();
    } catch (e) {
      setErr(e?.message || "Assign reviewers failed");
    }
  }

  async function applyDecision(subId) {
    setErr("");
    setMsg("");

    if (!canAdmin) return setErr("Only ADMIN/CHAIR can set decision");

    if (!DECISIONS.includes(decisionValue)) {
      return setErr("Invalid decision value");
    }

    try {
      await apiFetch(`/admin/submissions/${subId}/decision`, {
        method: "PATCH",
        token,
        body: { decision: decisionValue, decisionNote },
      });
      setMsg(`Decision saved: ${decisionValue}`);
      await refreshSubmissions();
    } catch (e) {
      setErr(e?.message || "Set decision failed");
    }
  }

  // Download with Authorization header
  async function downloadPaper(subId, fallbackName = "paper.pdf") {
    setErr("");
    setMsg("");

    try {
      const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const url = `${base}/submissions/${subId}/download`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Download failed (${res.status})`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(objectUrl);
      setMsg("Download started");
    } catch (e) {
      setErr(e?.message || "Download failed");
    }
  }

  // -------- UI --------

  return (
    <div style={{ padding: 16, maxWidth: 1100 }}>
      <h2>Admin</h2>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label>
            Conference:&nbsp;
            <select
              value={selectedConferenceId}
              onChange={(e) => setSelectedConferenceId(e.target.value)}
            >
              {conferences.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name || c.title || c.shortName || c._id}
                </option>
              ))}
            </select>
          </label>

          <button onClick={refreshSubmissions} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {!canAdmin && (
        <div
          style={{ padding: 10, border: "1px solid #ccc", marginBottom: 12 }}
        >
          You are logged in, but your role is not ADMIN/CHAIR. You can view
          only.
        </div>
      )}

      {err && (
        <div style={{ color: "crimson", marginBottom: 8 }}>
          <b>Error:</b> {err}
        </div>
      )}
      {msg && (
        <div style={{ color: "green", marginBottom: 8 }}>
          <b>OK:</b> {msg}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Actions Panel</h3>

          <div style={{ display: "grid", gap: 10, maxWidth: 700 }}>
            <div>
              <label>
                Reviewer emails (comma-separated):&nbsp;
                <input
                  style={{ width: "100%" }}
                  value={reviewerEmails}
                  onChange={(e) => setReviewerEmails(e.target.value)}
                  placeholder="reviewer1@email.com, reviewer2@email.com"
                />
              </label>
            </div>

            <div>
              <label>
                Decision:&nbsp;
                <select
                  value={decisionValue}
                  onChange={(e) => setDecisionValue(e.target.value)}
                >
                  {DECISIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <label>
                Decision note (optional):&nbsp;
                <textarea
                  style={{ width: "100%", minHeight: 70 }}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Short note for authors..."
                />
              </label>
            </div>
          </div>

          <p style={{ marginBottom: 0, color: "#666" }}>
            Tip: Select a submission below, then use “Assign Reviewers” or “Set
            Decision”.
          </p>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Submissions</h3>

          {submissions.length === 0 ? (
            <div>No submissions yet for this conference.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr>
                    {["Title", "Status", "Authors", "Created", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #ccc",
                            padding: 8,
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id}>
                      <td
                        style={{ padding: 8, borderBottom: "1px solid #eee" }}
                      >
                        <div style={{ fontWeight: 600 }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          ID: {s._id}
                        </div>
                      </td>

                      <td
                        style={{ padding: 8, borderBottom: "1px solid #eee" }}
                      >
                        {s.status || "-"}
                      </td>

                      <td
                        style={{ padding: 8, borderBottom: "1px solid #eee" }}
                      >
                        {(s.authors || [])
                          .map((a) => a.fullName || a.name || a.email)
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>

                      <td
                        style={{ padding: 8, borderBottom: "1px solid #eee" }}
                      >
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleString()
                          : "-"}
                      </td>

                      <td
                        style={{ padding: 8, borderBottom: "1px solid #eee" }}
                      >
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <button
                            onClick={() =>
                              downloadPaper(s._id, `${s.title || "paper"}.pdf`)
                            }
                          >
                            Download Paper
                          </button>

                          <button
                            onClick={() => assignReviewers(s._id)}
                            disabled={!canAdmin}
                            title={!canAdmin ? "ADMIN/CHAIR only" : ""}
                          >
                            Assign Reviewers
                          </button>

                          <button
                            onClick={() => applyDecision(s._id)}
                            disabled={!canAdmin}
                            title={!canAdmin ? "ADMIN/CHAIR only" : ""}
                          >
                            Set Decision
                          </button>
                        </div>

                        {s.reviewers?.length ? (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: "#666",
                            }}
                          >
                            Reviewers: {s.reviewers.join(", ")}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
