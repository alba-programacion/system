import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";


export default function ActivateAccount() {
  const [numeroControl, setNumeroControl] = useState("");
  const [correoInstitucional, setCorreoInstitucional] = useState("");
  const [password, setPassword] = useState("");
  const [carrera, setCarrera] = useState(""); 
  const navigate = useNavigate();

  const handleActivate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        numeroControl,
        correoInstitucional,
        password,
      };

      // si es alumno (9 dígitos), incluir carrera
      if (numeroControl.length === 9) {
        payload.carrera = carrera;
      }

      const res = await axios.post("http://localhost:3000/api/auth/activar", payload);

      alert(res.data.msg);
      navigate("/login");
    } catch (err) {
      alert("Error en activación: " + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#111" }}>
      <form onSubmit={handleActivate} style={{ background: "#222", padding: "2rem", borderRadius: "8px", color: "#fff", width: "350px" }}>
        <h2 style={{ textAlign: "center" }}>Activar Cuenta</h2>
        
        <input
          type="text"
          placeholder="Número de control"
          value={numeroControl}
          onChange={(e) => setNumeroControl(e.target.value)}
          style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
        />
        <input
          type="email"
          placeholder="Correo institucional"
          value={correoInstitucional}
          onChange={(e) => setCorreoInstitucional(e.target.value)}
          style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
        />

        
        {numeroControl.length === 9 && (
          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
          >
            <option value="">Selecciona tu carrera</option>
            <option value="Ingeniería Industrial">Ingeniería Industrial</option>
            <option value="Ingeniería Ferroviaria">Ingeniería Ferroviaria</option>
            <option value="Ingeniería Ambiental">Ingeniería Ambiental</option>
            <option value="Ingeniería en Logística">Ingeniería en Logística</option>
            <option value="Ingeniería en Gestión Empresarial">Ingeniería en Gestión Empresarial</option>
            <option value="Ingeniería en Tecnologías de la Información y Comunicaciones">Ingeniería en Tecnologías de la Información y Comunicaciones</option>
            <option value="Ingeniería Industrial (Virtual)">Ingeniería Industrial (Virtual)</option>
            <option value="Ingeniería en Gestión Empresarial (Virtual)">Ingeniería en Gestión Empresarial (Virtual)</option>
          </select>
        )}
        
        <button type="submit" style={{ padding: "10px", width: "100%", background: "#444", color: "#fff", border: "none" }}>
          Activar
        </button>

        
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <p>
            ¿Ya tienes tu cuenta activada?{" "}
            <Link to="/login" style={{ color: "#4da6ff" }}>Inicia sesión</Link>
          </p>
          <p>
            ¿Olvidaste tu contraseña?{" "}
            <Link to="/forgot-password" style={{ color: "#4da6ff" }}>Recupérala aquí</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
