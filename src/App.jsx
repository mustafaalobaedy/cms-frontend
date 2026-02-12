import { useState } from "react";
import { apiRequest } from "./services/api";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", res.token);
      setUser(res.user);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadMe() {
    try {
      const res = await apiRequest("/me");
      setUser(res.user);
    } catch {
      setUser(null);
      localStorage.removeItem("token");
    }
  }

  return (
    <div
      style={{ maxWidth: 400, margin: "80px auto", fontFamily: "sans-serif" }}
    >
      <h2>CMS Login</h2>

      {!user ? (
        <form onSubmit={login}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <button type="submit">Login</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      ) : (
        <>
          <p>
            Logged in as <b>{user.fullName}</b>
          </p>
          <p>Roles: {user.roles.join(", ")}</p>
          <button onClick={loadMe}>Refresh /me</button>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              setUser(null);
            }}
            style={{ marginLeft: 10 }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;
