import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!token;

  async function refreshMe() {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await apiFetch("/me");
      setUser(me);
    } catch {
      localStorage.removeItem("token");
      setToken("");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthed,
        login,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
