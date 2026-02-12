// src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";

export default function Admin() {
  const [me, setMe] = useState(null);

  const [confs, setConfs] = useState([]);
  const [confId, setConfId] = useState("");

  const [subs, setSubs] = useState([]);

  // Create user
  const [uEmail, setUEmail] = useState("");
  const [uName, setUName] = useState("");
  const [uPass, setUPass] = useState("");
  const [uRole, setURole] = useState("REVIEWER");

  // Actions panel
  const [selectedSubId, setSelectedSubId] = useState("");
  const [reviewerEmails, setReviewerEmails] = useState(
    "reviewer1@email.com, reviewer2@email.com",
  );
  const [decision, setDecisionValue] = useState("ACCEPTED");
  const [decisionNote, setDecisionNote] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const roles = useMemo(() => {
    const r = me?.roles || [];
    return Array.isArray(r)
      ? r
      : String(r)
          .split(",")
          .map((x) => x.trim());
  }, [me]);

  const canAdmin =
    roles.includes("ADMIN") || roles.includes("CHAIR") || roles.includes("TPC");

  useEffect(() => {
    (async () => {
      try {
        const _me = await apiFetch("/me");
        setMe(_me);

        const list = await apiFetch("/conferences"); // your existing working endpoint
        setConfs(list || []);

        if ((list || []).length > 0) setConfId(list[0]._id || list[0].id || "");
      } catch (e) {
        setErr(e.message || "Failed to load admin page");
      }
    })();
  }, []);

  async function loadSubmissions() {
    setErr("");
    setMsg("");
    if (!confId) return setErr("Please select a conference");

    try {
      // ✅ Correct endpoint (matches live)
      const data = await apiFetch(`/admin/submissions/by-conference/${confId}`);
      setSubs(Array.isArray(data) ? data : data?.items || []);
      setMsg("Submissions loaded");
    } catch (e) {
      setErr(e.message || "Failed to load submissions");
    }
  }

  async function createUser() {
    setErr("");
    setMsg("");

    if (!uEmail || !uName || !uPass)
      return setErr("Email, Full Name, Password are required");

    try {
      const created = await apiFetch("/admin/users", {
        method: "POST",
        body: {
          email: uEmail.trim(),
          fullName: uName.trim(),
          password: uPass,
          role: uRole,
        },
      });

      setMsg(`User created: ${created?.email || uEmail}`);
      setUEmail("");
      setUName("");
      setUPass("");
    } catch (e) {
      setErr(e.message || "Failed to create user");
    }
  }

  async function assignReviewers(subId) {
    setErr("");
    setMsg("");
    if (!canAdmin) return setErr("Only ADMIN/CHAIR/TPC can assign reviewers");

    const emails = reviewerEmails
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (emails.length === 0) return setErr("Enter at least one reviewer email");

    try {
      await apiFetch(`/admin/submissions/${subId}/assign-reviewers`, {
        method: "POST",
        body: { reviewerEmails: emails },
      });

      setMsg("Reviewers assigned (status should become UNDER_REVIEW)");
      await loadSubmissions();
    } catch (e) {
      setErr(e.message || "Failed to assign reviewers");
    }
  }

  async function submitDecision(subId, decisionValue) {
    setErr("");
    setMsg("");
    if (!canAdmin) return setErr("Only ADMIN/CHAIR/TPC can set decision");

    try {
      await apiFetch(`/admin/submissions/${subId}/decision`, {
        method: "POST",
        body: {
          decision: decisionValue,
          note: decisionNote || "",
        },
      });

      setMsg(`Decision set: ${decisionValue}`);
      await loadSubmissions();
    } catch (e) {
      setErr(e.message || "Failed to set decision");
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h2>Admin</h2>

      <div style={{ marginBottom: 12 }}>
        <div>
          Conference:{" "}
          <select value={confId} onChange={(e) => setConfId(e.target.value)}>
            {confs.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.shortName ? `${c.shortName} — ${c.name}` : c.name}
              </option>
            ))}
          </select>{" "}
          <button onClick={loadSubmissions}>Refresh</button>
        </div>

        {!canAdmin && (
          <div style={{ marginTop: 8, padding: 8, border: "1px solid #ddd" }}>
            You are logged in, but your role is not ADMIN/CHAIR/TPC. You can
            view only.
          </div>
        )}

        {err && (
          <div style={{ color: "crimson", marginTop: 8 }}>Error: {err}</div>
        )}
        {msg && <div style={{ color: "green", marginTop: 8 }}>{msg}</div>}
      </div>

      <hr />

      <h3>Create User (ADMIN)</h3>
      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <div>
          Email
          <br />
          <input
            value={uEmail}
            onChange={(e) => setUEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          Full Name
          <br />
          <input
            value={uName}
            onChange={(e) => setUName(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          Password
          <br />
          <input
            value={uPass}
            onChange={(e) => setUPass(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          Role
          <br />
          <select
            value={uRole}
            onChange={(e) => setURole(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="REVIEWER">REVIEWER</option>
            <option value="TPC">TPC</option>
            <option value="CHAIR">CHAIR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="AUTHOR">AUTHOR</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={createUser}>Create User</button>
        </div>
      </div>

      <hr />

      <h3>Submissions by Conference (TPC/CHAIR/ADMIN)</h3>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <div style={{ marginBottom: 8 }}>
          <b>Actions Panel</b>
        </div>

        <div>
          Reviewer emails (comma-separated):
          <br />
          <input
            value={reviewerEmails}
            onChange={(e) => setReviewerEmails(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          Decision:
          <br />
          <select
            value={decision}
            onChange={(e) => setDecisionValue(e.target.value)}
          >
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          Decision note (optional):
          <br />
          <textarea
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            rows={3}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
          Tip: select a submission below, then use “Assign reviewer” or “Set
          decision”.
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <b>Submissions</b>
        <div style={{ marginTop: 8 }}>
          {subs.length === 0 ? (
            <div>No submissions yet for this conference.</div>
          ) : (
            subs.map((s) => (
              <div
                key={s._id || s.id}
                style={{
                  border: "1px solid #eee",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <label style={{ display: "block" }}>
                  <input
                    type="radio"
                    name="selectedSub"
                    value={s._id || s.id}
                    checked={selectedSubId === (s._id || s.id)}
                    onChange={() => setSelectedSubId(s._id || s.id)}
                  />{" "}
                  <b>{s.title}</b>
                </label>

                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Status: <b>{s.status}</b> | Decision:{" "}
                  <b>{s.decision || "NONE"}</b>
                  <br />
                  ID: {s._id || s.id}
                </div>

                <div style={{ marginTop: 8 }}>
                  <button
                    disabled={!canAdmin}
                    onClick={() => assignReviewers(s._id || s.id)}
                  >
                    Assign reviewer
                  </button>{" "}
                  <button
                    disabled={!canAdmin}
                    onClick={() => submitDecision(s._id || s.id, "ACCEPTED")}
                  >
                    Accept
                  </button>{" "}
                  <button
                    disabled={!canAdmin}
                    onClick={() => submitDecision(s._id || s.id, "REJECTED")}
                  >
                    Reject
                  </button>{" "}
                  <button
                    disabled={!canAdmin}
                    onClick={() =>
                      submitDecision(s._id || s.id, "REVISION_REQUESTED")
                    }
                  >
                    Revision
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
