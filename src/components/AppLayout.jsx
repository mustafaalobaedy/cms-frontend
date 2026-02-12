import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../routes/AuthContext";

function NavItem({ to, label }) {
  const loc = useLocation();
  const active = loc.pathname === to;

  return (
    <Link
      to={to}
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: 8,
        textDecoration: "none",
        background: active ? "#eee" : "transparent",
        color: "#111",
      }}
    >
      {label}
    </Link>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();

  const name = user?.user?.fullName || user?.fullName || "User";
  const roles = (user?.user?.roles || user?.roles || []).join(", ");

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div>
          <b>Conference CMS</b>
          <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>
            {roles}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13 }}>{name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 240,
            padding: 14,
            borderRight: "1px solid #ddd",
          }}
        >
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/conferences" label="Conferences" />
          <NavItem to="/submit" label="Submit Paper" />
          <NavItem to="/my-submissions" label="My Submissions" />
          <NavItem to="/admin" label="Admin" />
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 18 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
