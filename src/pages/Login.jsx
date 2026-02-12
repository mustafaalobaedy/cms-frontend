import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../routes/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("admin@icaici.com");
  const [password, setPassword] = useState("MunadilPassword123!");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      nav("/", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      style={{ maxWidth: 420, margin: "80px auto", fontFamily: "sans-serif" }}
    >
      <h2>CMS Login</h2>

      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", margin: "6px 0 14px", padding: 8 }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", margin: "6px 0 14px", padding: 8 }}
        />

        <button type="submit" style={{ padding: "8px 14px" }}>
          Login
        </button>

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </form>

      <p style={{ marginTop: 18, fontSize: 12, opacity: 0.7 }}>
        Use: https://www.cms.icaici.com
      </p>
    </div>
  );
}
