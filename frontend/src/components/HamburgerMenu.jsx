import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Botón hamburguesa */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "1.8rem",
          cursor: "pointer"
        }}
      >
        ☰
      </button>

      {/* Menú desplegable */}
      {open && (
        <ul
          style={{
            position: "absolute",
            right: 0,
            top: "2.5rem",
            background: "#222",
            listStyle: "none",
            padding: "1rem",
            margin: 0,
            borderRadius: "8px",
            width: "220px"
          }}
        >
          <li style={{ margin: "0.5rem 0" }}>
            <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>Inicio</Link>
          </li>
          <li style={{ margin: "0.5rem 0" }}>
            <Link to="/carreras" style={{ color: "#fff", textDecoration: "none" }}>Carreras</Link>
          </li>
          <li style={{ margin: "0.5rem 0" }}>
            <Link to="/contacto" style={{ color: "#fff", textDecoration: "none" }}>Contacto</Link>
          </li>
          <li style={{ margin: "0.5rem 0" }}>
            <Link to="/activar" style={{ color: "#fff", textDecoration: "none" }}>
              Activar cuenta
            </Link>
            <p style={{ fontSize: "0.8rem", color: "#aaa" }}>
              Solo para miembros del plantel
            </p>
          </li>
          <li style={{ margin: "0.5rem 0" }}>
            <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>
              Iniciar sesión
            </Link>
            <p style={{ fontSize: "0.8rem", color: "#aaa" }}>
              Solo para miembros del plantel
            </p>
          </li>
        </ul>
      )}
    </div>
  );
}
