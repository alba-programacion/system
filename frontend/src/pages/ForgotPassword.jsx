import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [numeroControl, setNumeroControl] = useState("");
  const [correoInstitucional, setCorreoInstitucional] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/reset-password", {
        numeroControl,
        correoInstitucional,
        newPassword,
      });

      alert(res.data.msg);
      navigate("/login");
    } catch (err) {
      alert("Error al cambiar contraseña: " + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <form
      onSubmit={handleReset}
      style={{
        background: "#222",
        padding: "2rem",
        borderRadius: "8px",
        color: "#fff",
        width: "350px",
        margin: "2rem auto"
      }}
    >
      <h2 style={{ textAlign: "center" }}>Recuperar / Cambiar Contraseña</h2>
      
      <input
        type="text"
        placeholder="Número de control"
        value={numeroControl}
        onChange={(e) => setNumeroControl(e.target.value)}
        style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
        required
      />
      
      <input
        type="email"
        placeholder="Correo institucional"
        value={correoInstitucional}
        onChange={(e) => setCorreoInstitucional(e.target.value)}
        style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
        required
      />
      
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
        required
      />
      
      <button
        type="submit"
        style={{
          padding: "10px",
          width: "100%",
          background: "#444",
          color: "#fff",
          border: "none"
        }}
      >
        Cambiar Contraseña
      </button>
    </form>
  );
}
