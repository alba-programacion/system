import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/DashboardAlumno.css";

const getDynamicHost = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? `http://${window.location.hostname}:5000`
    : window.location.origin;
};
const BASE_URL = `${getDynamicHost()}/api`;
const FILE_SERVER_URL = getDynamicHost();

export default function DashboardAlumno() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 1. ESTADOS
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("inicio");
  const [misEvidencias, setMisEvidencias] = useState([]);
  const [stats, setStats] = useState({ encuestas: 0, constancias: 0, creditos: "0/20", pendientes: 0 });

  // Estado para controlar permisos de módulos
  const [permisos, setPermisos] = useState({
    encuestasGlobal: false, // Habilitación global
    evidenciaCompIndividual: false // Habilitación por alumno
  });

  const [editingEvidencia, setEditingEvidencia] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editUploading, setEditUploading] = useState(false);

  // Inicialización de usuario
  const [usuario] = useState(() => {
    const nombre = localStorage.getItem("nombreUsuario");
    const control = localStorage.getItem("numeroControl");
    return {
      nombre: nombre || "Alumno",
      numeroControl: control || "..."
    };
  });

  // 2. FUNCIONES DE CARGA
  
  const cargarConfiguracionPrivilegios = useCallback(async (alumnoId) => {
    try {
      const res = await axios.get(`${BASE_URL}/usuarios/permisos/${alumnoId}`);
      setPermisos({
        encuestasGlobal: res.data.encuestasHabilitadas,
        evidenciaCompIndividual: res.data.evidenciaComplementariaHabilitada
      });
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    }
  }, []);

  const cargarStats = useCallback(async (id) => {
    try {
      const res = await axios.get(`${BASE_URL}/evidencias/stats/${id}`);
      setStats({
        encuestas: res.data.encuestas || 0,
        constancias: res.data.constancias || 0,
        creditos: `${res.data.creditos || 0}/20`,
        pendientes: res.data.pendientes || 0
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    }
  }, []);

  const cargarMisEvidencias = useCallback(async (id) => {
    try {
      const res = await axios.get(`${BASE_URL}/evidencias/alumno/${id}`);
      setMisEvidencias(res.data);
    } catch (error) {
      console.error("Error al cargar historial de evidencias:", error);
    }
  }, []);

  // 3. EFECTO
  useEffect(() => {
    const alumnoId = localStorage.getItem("usuarioId");
    
    if (alumnoId) {
      const fetchDashboardData = async () => {
        await cargarConfiguracionPrivilegios(alumnoId);
        await cargarStats(alumnoId);
        if (seccionActiva === "evidencias") {
          await cargarMisEvidencias(alumnoId);
        }
      };
      fetchDashboardData();
    }
  }, [seccionActiva, cargarStats, cargarMisEvidencias, cargarConfiguracionPrivilegios]);

  // 4. MANEJADORES DE EVENTOS
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const alumnoId = localStorage.getItem("usuarioId");
    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("usuarioId", alumnoId);
    formData.append("tipo", "MOOC");
    formData.append("descripcion", `Constancia MOOC de ${usuario.nombre}`);

    try {
      const res = await axios.post(`${BASE_URL}/evidencias/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message || "Archivo subido con éxito");
      e.target.value = ""; // Limpieza del input de archivo
      await cargarStats(alumnoId);
    } catch (error) {
      console.error("Error en la subida:", error);
      alert("No se pudo subir el archivo.");
    }
  };

  const handleEliminarEvidencia = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta evidencia?")) return;
    const alumnoId = localStorage.getItem("usuarioId");
    try {
      await axios.delete(`${BASE_URL}/evidencias/${id}`);
      alert("Evidencia eliminada.");
      await cargarMisEvidencias(alumnoId);
      await cargarStats(alumnoId);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al intentar eliminar el registro.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEvidencia) return;
    const alumnoId = localStorage.getItem("usuarioId");

    setEditUploading(true);
    const formData = new FormData();
    if (editFile) {
      formData.append("archivo", editFile);
    }
    formData.append("descripcion", editDesc);

    try {
      const res = await axios.put(`${BASE_URL}/evidencias/edit/${editingEvidencia._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message || "Evidencia editada correctamente");
      setEditingEvidencia(null);
      setEditDesc("");
      setEditFile(null);
      await cargarMisEvidencias(alumnoId);
      await cargarStats(alumnoId);
    } catch (error) {
      console.error("Error al editar:", error);
      alert(error.response?.data?.message || "No se pudo actualizar la evidencia.");
    } finally {
      setEditUploading(false);
    }
  };

  // 5. RENDERIZADO DE CONTENIDO
  const renderContenido = () => {
    switch (seccionActiva) {
      case "inicio":
        return (
          <>
            <section className="welcome-section">
              <h1>Hola de nuevo, {usuario.nombre}</h1>
              <p>Estado de tus actividades actuales.</p>
            </section>
            <div className="stats-grid">
              <Card icon="poll" value={stats.encuestas} label="Encuestas" />
              <Card icon="verified" value={stats.constancias} label="Aprobadas" />
              <Card icon="pending_actions" value={stats.pendientes} label="Pendientes" />
              <Card icon="history" value={stats.creditos} label="Créditos" highlight />
            </div>
            <div className="upload-box" onClick={() => fileInputRef.current.click()}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept=".pdf,.jpg,.png" />
              <span className="material-symbols-outlined upload-icon">cloud_upload</span>
              <h3>Subir Constancia MOOC</h3>
              <p>PDF, JPG o PNG (Máx. 5MB)</p>
              <button className="btn-upload-trigger">Seleccionar Archivo</button>
            </div>
          </>
        );
      case "evidencias":
        return (
          <section className="history-section">
            <h2>Historial de Evidencias</h2>
            <div className="table-container">
              {misEvidencias.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px' }}>inventory_2</span>
                  <p>Aún no has enviado evidencias.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TIPO / DESCRIPCIÓN</th>
                      <th>FECHA</th>
                      <th>ESTADO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {misEvidencias.map((evi) => (
                      <tr key={evi._id}>
                        <td>
                          <div className="font-bold" style={{ color: '#0f172a', fontWeight: 'bold' }}>{evi.tipoEvidencia}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{evi.descripcion}</div>
                        </td>
                        <td>{new Date(evi.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${evi.estado.toLowerCase()}`}>
                            {evi.estado}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={() => {
                                const filename = evi.archivoUrl.split(/[\\/]/).pop();
                                window.open(`${FILE_SERVER_URL}/uploads/evidencias/${filename}`, '_blank');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#0284c7',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Revisar constancia"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingEvidencia(evi);
                                setEditDesc(evi.descripcion || "");
                                setEditFile(null);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#16a34a',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Editar constancia"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              onClick={() => handleEliminarEvidencia(evi._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#dc2626',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Eliminar constancia"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        );
      case "encuestas":
        return permisos.encuestasGlobal ? (
          <PlaceholderSeccion titulo="Módulo de Encuestas" icon="poll" descripcion="Aquí aparecerán las encuestas activas." />
        ) : (
          <PlaceholderSeccion titulo="Encuestas No Disponibles" icon="lock" descripcion="El administrador aún no ha habilitado este módulo." />
        );
      case "evidencia_comp":
        return permisos.evidenciaCompIndividual ? (
          <PlaceholderSeccion titulo="Evidencia Complementaria" icon="add_notes" descripcion="Sube aquí tus documentos adicionales." />
        ) : (
          <PlaceholderSeccion titulo="Evidencia Complementaria No Disponible" icon="lock" descripcion="El administrador aún no ha habilitado este módulo para ti." />
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img 
            src={`${FILE_SERVER_URL}/uploads/logo_gam.png`} 
            alt="ITGAM" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
          />
          <h1 className="logo-text">ITGAM</h1>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${seccionActiva === "inicio" ? "active" : ""}`} 
            onClick={() => { setSeccionActiva("inicio"); setIsMobileMenuOpen(false); }}
          >
            <span className="material-symbols-outlined">home</span> Inicio
          </div>
          <div 
            className={`nav-item ${seccionActiva === "evidencias" ? "active" : ""}`} 
            onClick={() => { setSeccionActiva("evidencias"); setIsMobileMenuOpen(false); }}
          >
            <span className="material-symbols-outlined">history</span> Evidencias
          </div>
          <div 
            className={`nav-item ${seccionActiva === "encuestas" ? "active" : ""} ${!permisos.encuestasGlobal ? "disabled-nav" : ""}`} 
            onClick={() => { if (permisos.encuestasGlobal) { setSeccionActiva("encuestas"); setIsMobileMenuOpen(false); } }}
            style={!permisos.encuestasGlobal ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="material-symbols-outlined">{permisos.encuestasGlobal ? "poll" : "lock"}</span> Encuestas
          </div>
          <div 
            className={`nav-item ${seccionActiva === "evidencia_comp" ? "active" : ""} ${!permisos.evidenciaCompIndividual ? "disabled-nav" : ""}`} 
            onClick={() => { if (permisos.evidenciaCompIndividual) { setSeccionActiva("evidencia_comp"); setIsMobileMenuOpen(false); } }}
            style={!permisos.evidenciaCompIndividual ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="material-symbols-outlined">{permisos.evidenciaCompIndividual ? "library_add" : "lock_person"}</span> Evidencia complementaria
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span> Cerrar Sesión
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2>Portal Alumno</h2>
          </div>
          <div className="header-right">
            <span>{usuario.nombre}</span>
            <div className="user-avatar"><span className="material-symbols-outlined">person</span></div>
          </div>
        </header>

        <div className="content-wrapper">
          {renderContenido()}
        </div>
      </main>

      {/* MODAL DE EDICIÓN DE EVIDENCIA */}
      {editingEvidencia && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }} className="no-print animate-fade-in">
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #e2e8f0',
            padding: '30px',
            width: '450px',
            maxWidth: '95%',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            position: 'relative'
          }}>
            <h3 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'left', margin: 0 }}>
              Editar Constancia
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', textAlign: 'left', marginTop: '6px' }}>
              Modifica la descripción o sube un nuevo archivo de evidencia para reemplazar el actual.
            </p>

            <form onSubmit={handleEditSubmit} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Nombre/Descripción de la Constancia:
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Archivo de Reemplazo (Opcional):
                </label>
                <input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  accept=".pdf,.jpg,.png"
                  style={{
                    width: '100%',
                    fontSize: '14px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  Dejar vacío para conservar el archivo actual: {editingEvidencia.archivoUrl ? editingEvidencia.archivoUrl.split(/[\\/]/).pop() : ''}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvidencia(null);
                    setEditDesc("");
                    setEditFile(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editUploading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: editUploading ? 0.7 : 1
                  }}
                >
                  {editUploading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTES AUXILIARES ACTUALIZADOS
function Card({ icon, value, label, highlight }) {
  return (
    <div className="info-card">
      <span className={`material-symbols-outlined ${highlight ? "highlight" : ""}`}>{icon}</span>
      <h3 className="card-value">{value}</h3>
      <p className="card-label">{label}</p>
    </div>
  );
}

function PlaceholderSeccion({ titulo, icon, descripcion }) {
  return (
    <div className="placeholder-card" style={{ padding: '50px', textAlign: 'center', background: 'white', borderRadius: '1rem', border: '1px solid var(--border)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '16px' }}>{icon}</span>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-dark)', margin: '0 0 8px 0' }}>{titulo}</h2>
      <p style={{ color: '#64748b', margin: 0 }}>{descripcion || "Próximamente disponible."}</p>
    </div>
  );
}