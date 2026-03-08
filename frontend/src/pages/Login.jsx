import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [numeroControl, setNumeroControl] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        numeroControl,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("roles", JSON.stringify(res.data.roles));

      if (res.data.roles.includes("admin")) navigate("/dashboard/admin");
      else if (res.data.roles.includes("profesor")) navigate("/dashboard/profesor");
      else if (res.data.roles.includes("alumno")) navigate("/dashboard/alumno");
      else if (res.data.roles.includes("psicologa")) navigate("/dashboard/psicologa");
    } catch (err) {
      alert("Error en login: " + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ background: "#222", padding: "2rem", borderRadius: "8px", color: "#fff", width: "350px", margin: "2rem auto" }}>
      <h2 style={{ textAlign: "center" }}>Login</h2>
      <input
        type="text"
        placeholder="Número de control"
        value={numeroControl}
        onChange={(e) => setNumeroControl(e.target.value)}
        style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "10px 0", padding: "8px", width: "100%" }}
      />
      <button type="submit" style={{ padding: "10px", width: "100%", background: "#444", color: "#fff", border: "none" }}>
        Entrar
      </button>
    </form>
  );
}
