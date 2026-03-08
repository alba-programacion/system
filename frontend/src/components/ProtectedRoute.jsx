import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const roles = JSON.parse(localStorage.getItem("roles") || "[]");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(role)) {
    return <Navigate to="/login" />;
  }

  return children;
}
 