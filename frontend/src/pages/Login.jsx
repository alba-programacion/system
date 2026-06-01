import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css"; // Archivo de estilos compartido
import campusImg from "../assets/campus.jpeg";
import logoInstitucional from "../assets/logo1.jpg";

export default function Login() {
  const [numeroControl, setNumeroControl] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        numeroControl,
        correo,
        password,
      });

      // --- GUARDADO DE DATOS ---
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("roles", JSON.stringify(res.data.roles));
      
      // GUARDAR EL ID PARA LAS EVIDENCIAS (Importante)
      if (res.data.user && res.data.user._id) {
        localStorage.setItem("usuarioId", res.data.user._id);
      }
      
      if (res.data.nombreCompleto) {
        localStorage.setItem("nombreUsuario", res.data.nombreCompleto);
      }
      localStorage.setItem("numeroControl", numeroControl);

      // --- REDIRECCIÓN ---
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        const roles = res.data.roles;
        if (roles.includes("admin")) navigate("/dashboard/admin");
        else if (roles.includes("profesor")) navigate("/dashboard/profesor");
        else if (roles.includes("alumno")) navigate("/dashboard/alumno");
        else if (roles.includes("psicologa")) navigate("/dashboard/psicologa");
        else navigate("/");
      }

    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Error de conexión";
      alert("Error: " + errorMsg);
    }
  };

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="auth-header">
        <div className="auth-logo-group">
          <div className="auth-logo-box">
            <img src={logoInstitucional} alt="Logo ITGAM" />
          </div>
          <div className="auth-logo-text">
            <h1>ITGAM</h1>
            <span>PORTAL INSTITUCIONAL</span>
          </div>
        </div>
        <Link to="/" className="btn-back">
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al Inicio
        </Link>
      </header>

      {/* Main Content */}
      <main className="auth-main">
        <div className="auth-card">
          {/* Banner */}
          <div className="auth-banner">
            <div className="auth-overlay"></div>
            <img src={campusImg} alt="Banner ITGAM" />
          </div>

          {/* Overlapping Icon */}
          <div className="auth-icon-float">
            <span className="material-symbols-outlined">login</span>
          </div>

          <div className="auth-form-container">
            <h2>Iniciar Sesión</h2>
            <p className="auth-subtitle">
              Ingresa tus credenciales institucionales para acceder al portal.
            </p>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label>Número de Control</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">badge</span>
                  <input 
                    type="text" 
                    placeholder="Ej. 19230456" 
                    value={numeroControl} 
                    onChange={(e) => setNumeroControl(e.target.value)} 
                    required 
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Correo Institucional</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">alternate_email</span>
                  <input 
                    type="email" 
                    placeholder="nombre.apellido@itgam.edu.mx" 
                    value={correo} 
                    onChange={(e) => setCorreo(e.target.value)} 
                    required 
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">lock</span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    autoComplete="new-password"
                    className="password-input"
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <div className="forgot-pass-link">
                  <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                </div>
              </div>

              <button type="submit" className="btn-auth-submit">
                Iniciar Sesión 
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="auth-switch">
              <p>
                ¿No tienes cuenta? <Link to="/activar">Crea una aquí</Link>
              </p>
            </div>
          </div>
        </div>

        <div className="auth-footer-links">
          <a href="#">AVISO DE PRIVACIDAD</a>
          <span className="dot-separator">•</span>
          <a href="#">TÉRMINOS DE USO</a>
          <span className="dot-separator">•</span>
          <a href="#">AYUDA</a>
        </div>
      </main>

      {/* Footer Bottom */}
      <footer className="auth-footer-bottom">
        <div className="footer-info">
          <div className="footer-icon-circle">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <p>© 2024 Instituto Tecnológico de Gustavo A. Madero.</p>
            <p className="sub-footer">Tecnológico Nacional de México.</p>
          </div>
        </div>
        <div className="footer-social-icons">
          <div className="social-icon"><span className="material-symbols-outlined">public</span></div>
          <div className="social-icon"><span className="material-symbols-outlined">description</span></div>
        </div>
      </footer>
    </div>
  );
}