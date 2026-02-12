import React from "react";
import { useAuth } from "../routes/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div
      style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <p>
        Welcome, <b>{user?.user?.fullName || user?.fullName}</b>
      </p>
      <p>Roles: {(user?.user?.roles || user?.roles || []).join(", ")}</p>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        Next: we will add navigation + pages (Conferences, Submit Paper, My
        Submissions, Admin).
      </div>
    </div>
  );
}
