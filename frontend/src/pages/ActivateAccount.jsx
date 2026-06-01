import React, { useState } from "react";
import api from "../api/axios"; 
import { useNavigate, Link } from "react-router-dom";
import "../styles/activate.css"; 
import campusImg from "../assets/campus.jpeg";
import logoInstitucional from "../assets/logo1.jpg";

export default function ActivateAccount() {
  const [numeroControl, setNumeroControl] = useState("");
  const [correoInstitucional, setCorreoInstitucional] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [carrera, setCarrera] = useState(""); 
  const navigate = useNavigate();

  const handleActivate = async (e) => {
    e.preventDefault();
    try {
      const payload = { numeroControl, correoInstitucional, password };
      if (numeroControl.length === 9) { payload.carrera = carrera; }

    
      const res = await api.post("/auth/activar", payload);
      alert(res.data.msg);
      navigate("/login");
    } catch (err) {
      alert("Error en activación: " + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div className="activate-page">
      {/* Header */}
      <header className="activate-header">
        <div className="activate-logo-group">
          <div className="activate-logo-box">
            <img src={logoInstitucional} alt="Logo ITGAM" />
          </div>
          <div className="activate-logo-text">
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
      <main className="activate-main">
        <div className="activate-card">
          {/* Banner */}
          <div className="activate-banner">
            <div className="activate-overlay"></div>
            <img src={campusImg} alt="Banner ITGAM" />
          </div>

          {/* Overlapping Icon */}
          <div className="activate-icon-float">
            <span className="material-symbols-outlined">person_add</span>
          </div>

          <div className="activate-form-container">
            <h2>Activar Cuenta</h2>
            <p className="activate-subtitle">
              Ingresa tus datos institucionales para comenzar el proceso de activación.
            </p>

            <form onSubmit={handleActivate} className="activate-form">
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
                <label>Contraseña</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">lock</span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
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
                <p className="input-hint">La contraseña debe contener al menos 8 caracteres, una mayúscula y un número.</p>
              </div>

              {numeroControl.length === 9 && (
                <div className="form-group">
                  <label>Carrera</label>
                  <div className="input-with-icon">
                    <span className="material-symbols-outlined">school</span>
                    <select value={carrera} onChange={(e) => setCarrera(e.target.value)} required>
                      <option value="">Selecciona tu carrera</option>
                      <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                      <option value="Ingeniería Ferroviaria">Ingeniería Ferroviaria</option>
                      <option value="Ingeniería Ambiental">Ingeniería Ambiental</option>
                      <option value="Ingeniería en Logística">Ingeniería en Logística</option>
                      <option value="Ingeniería en Gestión Empresarial">Ingeniería en Gestión Empresarial</option>
                      <option value="Ingeniería en TICs">Ingeniería en TICs</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-activate-submit">
                Activar mi cuenta 
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="activate-support">
              <p>
                ¿Tienes problemas? <span>Contactar a Soporte TI</span>
              </p>
            </div>
          </div>
        </div>

        <div className="activate-footer-links">
          <a href="#">AVISO DE PRIVACIDAD</a>
          <span className="dot-separator">•</span>
          <a href="#">TÉRMINOS DE USO</a>
          <span className="dot-separator">•</span>
          <a href="#">AYUDA</a>
        </div>
      </main>

      {/* Footer Estático */}
      <footer className="activate-footer-bottom">
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