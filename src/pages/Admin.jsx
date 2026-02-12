import React, { useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { useAuth } from "../routes/AuthContext";

export default function Admin() {
  const { user } = useAuth();
  const roles = useMemo(() => user?.user?.roles || user?.roles || [], [user]);
  const isAdmin = roles.includes("ADMIN");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TPC");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

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

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Admin</h2>

      {!isAdmin && (
        <p style={{ color: "red" }}>
          You are not ADMIN. This page is for ADMIN only.
        </p>
      )}

      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Create User</h3>

        <form onSubmit={createUser} style={{ display: "grid", gap: 10 }}>
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

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        Next: Submissions management (by conference, assign reviewers,
        decision).
      </p>
    </div>
  );
}
