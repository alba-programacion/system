import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import logoITGAM from "../assets/logo1.jpg";
import "../styles/AsistenciaLanding.css";

export default function AsistenciaLanding() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Validando código QR...");
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    const validateAndRegister = async () => {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setErrorMsg("Sesión no iniciada. Redirigiendo...");
        return navigate(`/login?redirect=/asistencia/${token}`);
      }

      try {
        setLoading(true);
        // 1. Obtener detalles de la sesión de manera transparente
        const resSession = await api.get(`/attendance/asistencia/${token}`);
        setSessionInfo(resSession.data.session);

        // 2. Registrar asistencia directamente sin solicitar ubicación por GPS (Geolocalización desactivada)
        setLoadingStatus("Registrando tu asistencia de forma automática...");
        const userAgent = navigator.userAgent || "Navegador Web";
        
        // Formatear dispositivo simplificado
        let device = "Dispositivo Web";
        if (/Android/i.test(userAgent)) device = "Android Mobile";
        else if (/iPhone|iPad|iPod/i.test(userAgent)) device = "iOS Mobile";
        else if (/Windows/i.test(userAgent)) device = "PC Windows";
        else if (/Macintosh/i.test(userAgent)) device = "Mac OS";

        const resRegister = await api.post(`/attendance/asistencia/registrar`, {
          token,
          latitude: null,
          longitude: null,
          deviceInfo: device
        });

        setSuccessData(resRegister.data.record);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.error || err.message || "Error al registrar la asistencia.");
        setLoading(false);
      }
    };

    validateAndRegister();
  }, [token, navigate]);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-logo-group">
          <div className="landing-logo-box">
            <img src={logoITGAM} alt="Logo ITGAM" />
          </div>
          <div className="landing-logo-text">
            <h1>ITGAM</h1>
            <span>CONTROL DE ASISTENCIA</span>
          </div>
        </div>
      </header>

      <main className="landing-main">
        {loading ? (
          <div className="landing-card loading-card">
            <div className="spinner"></div>
            <h3>Procesando Asistencia</h3>
            <p className="loading-status">{loadingStatus}</p>
            {sessionInfo && (
              <div className="session-preview-box">
                <span className="course-key">{sessionInfo.courseKey}</span>
                <span className="course-title">{sessionInfo.courseTitle}</span>
              </div>
            )}
          </div>
        ) : errorMsg ? (
          <div className="landing-card error-card">
            <div className="result-icon-box error-icon">
              <span className="material-symbols-outlined">close</span>
            </div>
            <h2>Registro Fallido</h2>
            <p className="error-description">{errorMsg}</p>
            
            <div className="action-buttons">
              <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
                Reintentar Registro
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate("/dashboard/profesor")}>
                Ir al Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="landing-card success-card">
            {/* Círculo verde con palomita blanca de éxito */}
            <div className="result-icon-box success-icon animate-pop" style={{
                backgroundColor: '#10b981',
                color: 'white',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', fontWeight: 'bold' }}>check</span>
            </div>
            
            {/* Título Principal */}
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', margin: '0 0 10px 0' }}>
              ¡Asistencia Registrada!
            </h2>
            
            {/* Texto de Confirmación */}
            <p className="success-subtitle" style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 24px auto' }}>
              Tu asistencia ha sido procesada correctamente para el día de hoy. ¡Gracias, Halcón!
            </p>
            
            {/* Caja de Comprobante Simplificada */}
            {successData && (
              <div className="receipt-box" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Curso:</span>
                  <span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '13px' }}>{successData.courseTitle}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Fecha:</span>
                  <span style={{ color: '#0f172a', fontSize: '13px' }}>{successData.attendanceDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Hora de Entrada:</span>
                  <span style={{ color: '#001e3c', fontWeight: 'bold', fontSize: '13px' }}>{successData.attendanceTime}</span>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn-primary-complete" 
                onClick={() => navigate("/dashboard/profesor")}
                style={{
                  backgroundColor: '#001e3c',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 30, 60, 0.2)'
                }}
              >
                Ir al Dashboard
              </button>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => navigate("/")}
                style={{
                  backgroundColor: 'transparent',
                  color: '#001e3c',
                  border: '2px solid #001e3c',
                  padding: '10px 22px',
                  borderRadius: '30px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="landing-footer">
        <p>© 2026 Instituto Tecnológico de Gustavo A. Madero.</p>
        <p className="sub-footer">Scholar Tech Ledger | Control de Asistencia</p>
      </footer>
    </div>
  );
}
