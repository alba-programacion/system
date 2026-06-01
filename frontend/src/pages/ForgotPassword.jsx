import React, { useState } from "react";
// 1. Cambiamos la importación de axios por tu instancia personalizada
import api from "../api/axios"; 
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css"; // Usamos el mismo CSS compartido
import campusImg from "../assets/campus.jpeg";
import logoInstitucional from "../assets/logo1.jpg";

export default function ForgotPassword() {
  const [numeroControl, setNumeroControl] = useState("");
  const [correoInstitucional, setCorreoInstitucional] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      // 2. Usamos 'api' en lugar de 'axios' y la ruta relativa /auth/...
      const res = await api.post("/auth/reset-password", {
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
          
          {/* Banner con los ajustes de visibilidad aplicados */}
          <div className="auth-banner">
            <div className="auth-overlay"></div>
            <img src={campusImg} alt="Banner ITGAM" />
          </div>

          {/* Icono flotante de reseteo */}
          <div className="auth-icon-float">
            <span className="material-symbols-outlined">lock_reset</span>
          </div>

          <div className="auth-form-container">
            <h2>Recuperar Contraseña</h2>
            <p className="auth-subtitle">
              Ingresa tus datos institucionales para establecer una nueva contraseña.
            </p>

            <form onSubmit={handleReset} className="auth-form">
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
                    value={correoInstitucional} 
                    onChange={(e) => setCorreoInstitucional(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nueva Contraseña</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">key</span>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn-auth-submit">
                Cambiar Contraseña 
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="auth-switch">
              <p>
                ¿Recordaste tu contraseña? <Link to="/login">Iniciar Sesión</Link>
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