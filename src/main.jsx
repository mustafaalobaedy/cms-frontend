import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./routes/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Conferences from "./pages/Conferences";
import SubmitPaper from "./pages/SubmitPaper";
import MySubmissions from "./pages/MySubmissions";
import Admin from "./pages/Admin";
import AppLayout from "./components/AppLayout";

function AppRoutes() {
  const { isAuthed, loading } = useAuth();

  if (loading)
    return (
      <div style={{ padding: 30, fontFamily: "sans-serif" }}>Loading...</div>
    );

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute isAuthed={isAuthed}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="conferences" element={<Conferences />} />
        <Route path="submit" element={<SubmitPaper />} />
        <Route path="my-submissions" element={<MySubmissions />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
