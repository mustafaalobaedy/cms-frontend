import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { useAuth } from "../routes/AuthContext";

export default function Admin() {
  const { user } = useAuth();
  const roles = useMemo(() => user?.user?.roles || user?.roles || [], [user]);

  const isAdmin = roles.includes("ADMIN");
  const isChair = roles.includes("CHAIR");
  const isTPC = roles.includes("TPC");
  const canManageSubs = isAdmin || isChair || isTPC;
  const canDecide = isAdmin || isChair;

  // --- Create user form (ADMIN only)
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TPC");

  // --- Submission management
  const [confs, setConfs] = useState([]);
  const [confId, setConfId] = useState("");
  const [subs, setSubs] = useState([]);
  const [reviewerIdsCsv, setReviewerIdsCsv] = useState("");
  const [decision, setDecision] = useState("ACCEPT");
  const [note, setNote] = useState("Decision note...");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function loadConfs() {
    const data = await apiFetch("/conferences");
    const items = data.items || [];
    setConfs(items);
    if (items.length && !confId) setConfId(items[0]._id);
  }

  async function loadSubs(cid) {
    if (!cid) return;
    const data = await apiFetch(`/submissions/by-conference/${cid}`);
    setSubs(data.items || []);
  }

  useEffect(() => {
    loadConfs().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canManageSubs) return;
    if (!confId) return;
    loadSubs(confId).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confId]);

  async function createUser(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!isAdmin) return setErr("Only ADMIN can create users");
    if (!email || !fullName || !password)
      return setErr("email, fullName, password are required");

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          fullName,
          password,
          roles: [role],
        }),
      });

      setMsg(`User created: ${email} (${role})`);
      setEmail("");
      setFullName("");
      setPassword("");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function assignReviewers(subId) {
    setErr("");
    setMsg("");

    const reviewerIds = reviewerIdsCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (reviewerIds.length < 1)
      return setErr("Enter reviewerIds (comma-separated)");

    try {
      await apiFetch(`/submissions/${subId}/assign-reviewers`, {
        method: "POST",
        body: JSON.stringify({ reviewerIds }),
      });

      setMsg("Reviewers assigned. Status set to UNDER_REVIEW.");
      await loadSubs(confId);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function setDecision(subId) {
    setErr("");
    setMsg("");

    if (!canDecide) return setErr("Only ADMIN/CHAIR can set decision");

    try {
      await apiFetch(`/submissions/${subId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, note }),
      });

      setMsg(`Decision applied: ${decision}`);
      await loadSubs(confId);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2>Admin / Management</h2>

      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      {/* Create User */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Create User (ADMIN only)</h3>

        {!isAdmin && (
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Login as ADMIN to create users.
          </p>
        )}

        <form
          onSubmit={createUser}
          style={{ display: "grid", gap: 10, maxWidth: 520 }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label>Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="AUTHOR">AUTHOR</option>
              <option value="REVIEWER">REVIEWER</option>
              <option value="TPC">TPC</option>
              <option value="CHAIR">CHAIR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <button type="submit" disabled={!isAdmin} style={{ width: 160 }}>
            Create User
          </button>
        </form>
      </div>

      {/* Submission Management */}
      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>
          Submissions Management (ADMIN/CHAIR/TPC)
        </h3>

        {!canManageSubs && (
          <p style={{ color: "red" }}>
            You do not have permission. Login as ADMIN/CHAIR/TPC.
          </p>
        )}

        {canManageSubs && (
          <>
            <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
              <label>Select Conference</label>
              <select
                value={confId}
                onChange={(e) => setConfId(e.target.value)}
              >
                {confs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => loadSubs(confId)}
                style={{ width: 160 }}
              >
                Refresh Submissions
              </button>

              <label>Reviewer IDs (comma separated)</label>
              <input
                placeholder="e.g. 65a..., 65b..."
                value={reviewerIdsCsv}
                onChange={(e) => setReviewerIdsCsv(e.target.value)}
              />

              <label>Decision (ADMIN/CHAIR)</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={!canDecide}
              >
                <option value="ACCEPT">ACCEPT</option>
                <option value="REJECT">REJECT</option>
                <option value="REVISION">REVISION</option>
              </select>

              <label>Decision Note</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!canDecide}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Submissions</h4>

              {subs.length === 0 ? (
                <p>No submissions for this conference.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {subs.map((s) => (
                    <div
                      key={s._id}
                      style={{
                        border: "1px solid #eee",
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
                            Status: <b>{s.status}</b> | Decision:{" "}
                            <b>{s.decision || "NONE"}</b>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => assignReviewers(s._id)}>
                            Assign Reviewers
                          </button>
                          <button
                            onClick={() => setDecision(s._id)}
                            disabled={!canDecide}
                          >
                            Set Decision
                          </button>
                        </div>
                      </div>

                      <div
                        style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}
                      >
                        Submission ID: {s._id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
