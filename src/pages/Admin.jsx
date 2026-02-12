import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { useAuth } from "../routes/AuthContext";

export default function Admin() {
  const { user } = useAuth();
  const roles = useMemo(() => user?.user?.roles || user?.roles || [], [user]);
  const isAdmin = roles.includes("ADMIN");
  const isChair = roles.includes("CHAIR");
  const isTPC = roles.includes("TPC");

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // Create user form
  const [uEmail, setUEmail] = useState("reviewer1@icaici.com");
  const [uName, setUName] = useState("Reviewer 1");
  const [uPass, setUPass] = useState("Pass12345!");
  const [uRoles, setURoles] = useState("REVIEWER"); // single role for now

  // Conferences + submissions
  const [confs, setConfs] = useState([]);
  const [conferenceId, setConferenceId] = useState("");
  const [subs, setSubs] = useState([]);

  // Reviewer assignment
  const [reviewerId, setReviewerId] = useState(""); // paste user id for now

  async function loadConfs() {
    const data = await apiFetch("/conferences");
    const items = data.items || [];
    setConfs(items);
    if (!conferenceId && items.length) setConferenceId(items[0]._id);
  }

  async function loadSubs(cid) {
    if (!cid) return;
    const data = await apiFetch(`/submissions/by-conference/${cid}`);
    setSubs(data.items || []);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadConfs();
      } catch (e) {
        setErr(e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (conferenceId) await loadSubs(conferenceId);
      } catch (e) {
        setErr(e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId]);

  async function createUser(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      if (!isAdmin) throw new Error("Only ADMIN can create users");

      const res = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          email: uEmail,
          fullName: uName,
          password: uPass,
          roles: [uRoles],
        }),
      });

      setMsg(`User created: ${res.user.email} (id: ${res.user.id})`);
      // helpful: auto-fill reviewerId
      setReviewerId(res.user.id);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function assignReviewer(subId) {
    setErr("");
    setMsg("");
    try {
      if (!reviewerId) throw new Error("Set reviewerId first (user id)");

      await apiFetch(`/submissions/${subId}/assign-reviewers`, {
        method: "POST",
        body: JSON.stringify({ reviewerIds: [reviewerId] }),
      });

      setMsg("Reviewer assigned. Status moved to UNDER_REVIEW.");
      await loadSubs(conferenceId);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function decide(subId, decision) {
    setErr("");
    setMsg("");
    try {
      if (!(isAdmin || isChair)) throw new Error("Only ADMIN/CHAIR can decide");

      await apiFetch(`/submissions/${subId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, note: `Decision: ${decision}` }),
      });

      setMsg(`Decision saved: ${decision}`);
      await loadSubs(conferenceId);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <h2>Admin</h2>

      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      {/* Create user */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Create User (ADMIN)</h3>

        {!isAdmin ? (
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            You are not ADMIN. This section is read-only.
          </p>
        ) : (
          <form onSubmit={createUser} style={{ display: "grid", gap: 10 }}>
            <label>
              Email
              <input
                value={uEmail}
                onChange={(e) => setUEmail(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label>
              Full Name
              <input
                value={uName}
                onChange={(e) => setUName(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label>
              Password
              <input
                value={uPass}
                onChange={(e) => setUPass(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label>
              Role
              <select
                value={uRoles}
                onChange={(e) => setURoles(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              >
                <option value="TPC">TPC</option>
                <option value="REVIEWER">REVIEWER</option>
                <option value="CHAIR">CHAIR</option>
                <option value="AUTHOR">AUTHOR</option>
              </select>
            </label>

            <button type="submit" style={{ width: 170 }}>
              Create User
            </button>
          </form>
        )}
      </div>

      {/* Submission management */}
      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>
          Submissions by Conference (TPC/CHAIR/ADMIN)
        </h3>

        {!(isAdmin || isChair || isTPC) ? (
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            You need ADMIN/CHAIR/TPC role.
          </p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <select
                value={conferenceId}
                onChange={(e) => setConferenceId(e.target.value)}
                style={{ padding: 8, minWidth: 320 }}
              >
                {confs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>

              <button onClick={() => loadSubs(conferenceId)}>
                Refresh submissions
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, opacity: 0.7 }}>
                Reviewer/User ID to assign (for now paste the created user id)
              </label>
              <input
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                placeholder="e.g. 65f... (user id)"
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {subs.length === 0 ? (
                <p>No submissions found.</p>
              ) : (
                subs.map((s) => (
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
                        <div
                          style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}
                        >
                          ID: {s._id}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <button onClick={() => assignReviewer(s._id)}>
                          Assign reviewer
                        </button>

                        {(isAdmin || isChair) && (
                          <>
                            <button onClick={() => decide(s._id, "ACCEPT")}>
                              Accept
                            </button>
                            <button onClick={() => decide(s._id, "REJECT")}>
                              Reject
                            </button>
                            <button onClick={() => decide(s._id, "REVISION")}>
                              Revision
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
