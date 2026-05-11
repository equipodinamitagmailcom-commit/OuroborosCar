import React from "react";
import { Navigate } from "react-router-dom";

const RutaProtegida = ({ children, allowedRoles = [] }) => {
  const estaLogueado = !!localStorage.getItem("usuario-supabase");
  const rol = localStorage.getItem("rol-supabase")?.toLowerCase();

  if (!estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
};

export default RutaProtegida;
