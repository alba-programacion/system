import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar'; 
import UsuariosPermisos from './UsuariosPermisos'; 
import ValidacionEvidencias from './ValidacionEvidencias';
import GestionContenido from './GestionContenido'; 
import CedulaAdmin from './CedulaAdmin';
import '../styles/AdminDashboard.css';

const getDynamicHost = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? `http://${window.location.hostname}:5000`
    : window.location.origin;
};
const BASE_URL = `${getDynamicHost()}/api`;

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Módulo de Reportes de Auditoría de Cursos
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedCourseData, setSelectedCourseData] = useState(null);
    const [reportData, setReportData] = useState({
        loading: false,
        cedulas: [],
        opinionReport: null,
        eficaciaProfReport: null,
        eficaciaEstReport: null
    });

    // Mapeo de preguntas para mostrar en la auditoría
    const opinionQuestions = [
        "Expuso el objetivo y temario del curso.",
        "Mostró dominio del contenido abordado.",
        "Fomentó la participación del grupo.",
        "Aclaró las dudas que se presentaron.",
        "Dio retroalimentación a los ejercicios.",
        "Aplicó una evaluación final relacionada.",
        "Inició y concluyó puntualmente las sesiones.",
        "El material didáctico fue útil en el curso.",
        "La impresión del material fue legible.",
        "La variedad de material fue suficiente.",
        "La distribución del tiempo fue adecuada.",
        "Los temas fueron suficientes para el objetivo.",
        "El curso comprendió ejercicios prácticos.",
        "El curso cubrió sus expectativas.",
        "La iluminación del aula fue adecuada.",
        "La ventilación del aula fue adecuada.",
        "El aseo del aula fue adecuado.",
        "El servicio de sanitarios fue adecuado.",
        "El servicio de café fue adecuado.",
        "Recibió apoyo del personal coordinador."
    ];

    const eficaciaQuestions = [
        "Conocimientos aplicables en el ámbito laboral.",
        "Ayudó a mejorar el desempeño de funciones.",
        "Ayudó a considerar nuevas formas de trabajo.",
        "Produjo un incremento en su motivación.",
        "Ha servido para su desarrollo personal.",
        "Sirvió para integrarse con sus compañeros.",
        "Mayor comprensión del servicio del TecNM/SNEST.",
        "Facilitó mejoría de actitud hacia la Institución.",
        "Permitió desarrollar habilidades adicionales.",
        "Mejor comprensión de conceptos aplicables.",
        "Relacionó conocimientos con la docencia.",
        "Ofreció sentido ético y moral laboral.",
        "Ofreció valores compatibles con los suyos."
    ];

    const calculateOverallAverage = (report) => {
        if (!report || !report.promedios || report.promedios.length === 0) return "N/A";
        const sum = report.promedios.reduce((acc, curr) => acc + parseFloat(curr), 0);
        return (sum / report.promedios.length).toFixed(2);
    };

    const getRatingBadge = (scoreStr) => {
        const score = parseFloat(scoreStr);
        if (isNaN(score)) return <span className="badge-rating low">N/A</span>;
        if (score >= 4.5) return <span className="badge-rating high">{score.toFixed(2)} (Excelente)</span>;
        if (score >= 3.5) return <span className="badge-rating mid">{score.toFixed(2)} (Satisfactorio)</span>;
        return <span className="badge-rating low">{score.toFixed(2)} (Insuficiente)</span>;
    };

    const [stats, setStats] = useState({
        users: 0,
        pending: 0,
        publicContent: 0,
        toValidate: 0,
        recentActivity: [] 
    });

    const [loading, setLoading] = useState(true);

    // Configuración del sistema
    const [configData, setConfigData] = useState({
        adminActual: ""
    });
    const [configSaving, setConfigSaving] = useState(false);



    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/auth/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConfigData(res.data);
        } catch (error) {
            console.error("Error al cargar la configuración:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'config') {
            fetchConfig();
        }
    }, [activeTab]);

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setConfigSaving(true);
        try {
            const token = localStorage.getItem("token");
            
            // 1. Guardar administrador actual
            const res = await axios.put(`${BASE_URL}/auth/config/update-admin`, {
                adminActual: configData.adminActual
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Configuración guardada exitosamente.");
            setConfigData({ ...configData, adminActual: res.data.adminActual });
        } catch (error) {
            console.error("Error al guardar configuración:", error);
            alert(error.response?.data?.msg || "Error al guardar la configuración");
        } finally {
            setConfigSaving(false);
        }
    };

    // Función para obtener datos de la API
    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/admin/stats`);
            setStats(response.data);
        } catch (error) {
            console.error("Error cargando estadísticas:", error);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para disparar la carga de datos cuando el dashboard esté activo
    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchStats();
        }
    }, [activeTab]);

    // Efecto para disparar la carga de cursos y reportes cuando el tab de reportes esté activo
    useEffect(() => {
        if (activeTab === 'reports') {
            const fetchCourses = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await axios.get(`${BASE_URL}/admin/events?type=course`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setCourses(res.data);
                    if (res.data.length > 0) {
                        setSelectedCourseId(res.data[0]._id);
                        handleFetchReport(res.data[0]._id, res.data);
                    }
                } catch (err) {
                    console.error("Error al cargar cursos para reportes:", err);
                }
            };
            fetchCourses();
        }
    }, [activeTab]);

    const handleFetchReport = async (courseId, loadedCourses = courses) => {
        if (!courseId) return;
        setReportData(prev => ({ ...prev, loading: true }));
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            
            const [cedulasRes, opinionRes, eficaciaProfRes, eficaciaEstRes] = await Promise.all([
                axios.get(`${BASE_URL}/cedulas/event/${courseId}`, { headers }),
                axios.get(`${BASE_URL}/surveys/report/${courseId}/tipo/opinion`, { headers }),
                axios.get(`${BASE_URL}/surveys/report/${courseId}/tipo/eficacia_profesor`, { headers }),
                axios.get(`${BASE_URL}/surveys/report/${courseId}/tipo/eficacia_estudiante`, { headers })
            ]);

            const course = loadedCourses.find(c => c._id === courseId);
            setSelectedCourseData(course);

            setReportData({
                loading: false,
                cedulas: cedulasRes.data || [],
                opinionReport: opinionRes.data,
                eficaciaProfReport: eficaciaProfRes.data,
                eficaciaEstReport: eficaciaEstRes.data
            });
        } catch (err) {
            console.error("Error al cargar reportes:", err);
            setReportData(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar activePage={activeTab} onPageChange={setActiveTab} />

            <main className="admin-main-content">
                <header className="main-header">
                    <div className="header-info">
                        <h2>
                            {activeTab === 'dashboard' && 'Dashboard General'}
                            {activeTab === 'usuarios' && 'Usuarios y Permisos'}
                            {activeTab === 'evidence' && 'Validación de Evidencias'}
                            {activeTab === 'videos' && 'Gestión de Contenido Público'}
                            {activeTab === 'formatos' && 'Formatos'}
                            {activeTab === 'reports' && 'Reportes Estadísticos'}
                            {activeTab === 'config' && 'Configuración del Sistema'}
                        </h2>
                        <p>Panel Administrativo ITGAM | Scholar Tech Ledger</p>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        <section className="kpi-container">
                            {/* Card de Usuarios */}
                            <div className="kpi-card">
                                <div className="kpi-icon-row">
                                    <span className="material-symbols-outlined text-blue">group</span>
                                    <span className="badge positive">Total</span>
                                </div>
                                <div className="kpi-data">
                                    <h3>{loading ? '...' : stats.users}</h3>
                                    <p>Usuarios registrados</p>
                                </div>
                            </div>

                            {/* Card de Pendientes */}
                            <div className="kpi-card">
                                <div className="kpi-icon-row">
                                    <span className="material-symbols-outlined text-orange">pending_actions</span>
                                    <span className="badge warning">Pendientes</span>
                                </div>
                                <div className="kpi-data">
                                    <h3>{loading ? '...' : stats.pending}</h3>
                                    <p>Evidencias por revisar</p>
                                </div>
                            </div>

                            {/* Card de Público */}
                            <div className="kpi-card">
                                <div className="kpi-icon-row">
                                    <span className="material-symbols-outlined text-blue-light">public</span>
                                    <span className="badge info">Público</span>
                                </div>
                                <div className="kpi-data">
                                    <h3>{loading ? '...' : stats.publicContent}</h3>
                                    <p>Contenido en plataforma</p>
                                </div>
                            </div>

                            {/* Card de Crítico */}
                            <div className="kpi-card">
                                <div className="kpi-icon-row">
                                    <span className="material-symbols-outlined text-red">rule</span>
                                    <span className="badge danger">Crítico</span>
                                </div>
                                <div className="kpi-data">
                                    <h3>{loading ? '...' : stats.toValidate}</h3>
                                    <p>Cuentas bloqueadas</p>
                                </div>
                            </div>
                        </section>

                        <section className="activity-section">
                            <div className="section-header">
                                <h3>Actividad Reciente del Sistema</h3>
                            </div>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Acción Realizada</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Cargando actividad...</td>
                                            </tr>
                                        ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
                                            stats.recentActivity.map((log, index) => (
                                                <tr key={log._id || index}>
                                                    <td>{log.usuario || 'Sistema'}</td>
                                                    <td>{log.accion}</td>
                                                    <td>
                                                        <span className={`status ${log.estado === 'Completado' ? 'success' : 'active'}`}>
                                                            {log.estado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No hay actividad reciente</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'usuarios' && <UsuariosPermisos />}
                {activeTab === 'evidence' && <ValidacionEvidencias />}
                {activeTab === 'videos' && <GestionContenido />}
                {activeTab === 'formatos' && <CedulaAdmin />}

                {activeTab === 'reports' && (
                    <div className="reports-container">
                        {/* Selector de Cursos y Botones no-print */}
                        <div className="report-filter-bar no-print">
                            <label htmlFor="course-select">Seleccionar Curso para Auditoría:</label>
                            <select 
                                id="course-select"
                                value={selectedCourseId}
                                onChange={(e) => {
                                    setSelectedCourseId(e.target.value);
                                    handleFetchReport(e.target.value);
                                }}
                                disabled={reportData.loading}
                            >
                                <option value="" disabled>-- Selecciona un curso --</option>
                                {courses.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.title} ({c.period || 'Sin periodo'})
                                    </option>
                                ))}
                            </select>
                            
                            <button 
                                className="btn-generate"
                                onClick={() => handleFetchReport(selectedCourseId)}
                                disabled={reportData.loading || !selectedCourseId}
                            >
                                <span className="material-symbols-outlined">refresh</span>
                                Recargar Datos
                            </button>

                            {selectedCourseData && (
                                <button 
                                    className="btn-generate"
                                    onClick={() => window.print()}
                                    style={{ marginLeft: 'auto', background: '#0ea5e9' }}
                                >
                                    <span className="material-symbols-outlined">print</span>
                                    Imprimir Reporte (PDF)
                                </button>
                            )}
                        </div>

                        {reportData.loading ? (
                            <div style={{ textAlign: 'center', padding: '50px' }}>
                                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '3rem', color: '#003366', display: 'inline-block', animation: 'spin 1s linear infinite' }}>sync</span>
                                <p style={{ marginTop: '15px', color: '#475569', fontWeight: 'bold' }}>Generando Reporte Estadístico...</p>
                            </div>
                        ) : !selectedCourseData ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '4rem' }}>school</span>
                                <h3 style={{ marginTop: '15px' }}>Auditoría y Reportes de Cursos</h3>
                                <p>Por favor, selecciona un curso del menú desplegable superior para generar el reporte de auditoría completo.</p>
                            </div>
                        ) : (
                            <div className="audit-report-content">
                                {/* Encabezado Institucional del Reporte */}
                                <div className="audit-report-header">
                                    <div>
                                        <h4>INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO</h4>
                                        <p style={{ fontWeight: 'bold', color: '#003366', margin: '5px 0' }}>
                                            REPORTE CONSOLIDADO DE AUDITORÍA Y EVALUACIÓN DE SERVICIO
                                        </p>
                                        <h3 style={{ margin: '15px 0 5px 0', fontSize: '1.6rem', color: '#1e293b' }}>
                                            {selectedCourseData.title}
                                        </h3>
                                        <p style={{ fontSize: '0.95rem', margin: '3px 0' }}>
                                            <strong>Docente / Facilitador:</strong> {selectedCourseData.instructorName || 'No asignado'}
                                        </p>
                                        <p style={{ fontSize: '0.95rem', margin: '3px 0' }}>
                                            <strong>Periodo:</strong> {selectedCourseData.period || 'N/A'} | 
                                            <strong> Horario:</strong> {selectedCourseData.schedule || 'N/A'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
                                        <p style={{ margin: '3px 0' }}><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString()}</p>
                                        <p style={{ margin: '3px 0' }}><strong>ID Evento:</strong> {selectedCourseData._id}</p>
                                        <p style={{ margin: '3px 0' }}><strong>Clave:</strong> {selectedCourseData.clave || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Grid de Tarjetas KPI / Auditoría */}
                                <div className="audit-grid">
                                    {/* Total Inscritos */}
                                    <div className="audit-card">
                                        <h5>Total Participantes Inscritos</h5>
                                        <div className="value">{reportData.cedulas.length}</div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>Con Cédula de Inscripción cargada</p>
                                    </div>

                                    {/* Promedio Opinión */}
                                    <div className="audit-card info-border">
                                        <h5>Encuesta de Opinión</h5>
                                        <div className="value">
                                            {reportData.opinionReport && reportData.opinionReport.total > 0 
                                                ? calculateOverallAverage(reportData.opinionReport) 
                                                : 'N/A'}
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>
                                            {reportData.opinionReport ? `${reportData.opinionReport.total} encuestas respondidas` : '0 encuestas'}
                                        </p>
                                    </div>

                                    {/* Promedio Eficacia Docente (Evaluada por Jefe/Colaborador) */}
                                    <div className="audit-card success-border">
                                        <h5>Eficacia Docente (Jefe)</h5>
                                        <div className="value">
                                            {reportData.eficaciaProfReport && reportData.eficaciaProfReport.total > 0 
                                                ? calculateOverallAverage(reportData.eficaciaProfReport) 
                                                : 'N/A'}
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>
                                            {reportData.eficaciaProfReport ? `${reportData.eficaciaProfReport.total} encuestas` : '0 encuestas'}
                                        </p>
                                    </div>

                                    {/* Promedio Eficacia Estudiante (Autoevaluación) */}
                                    <div className="audit-card purple-border">
                                        <h5>Eficacia Estudiante</h5>
                                        <div className="value">
                                            {reportData.eficaciaEstReport && reportData.eficaciaEstReport.total > 0 
                                                ? calculateOverallAverage(reportData.eficaciaEstReport) 
                                                : 'N/A'}
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>
                                            {reportData.eficaciaEstReport ? `${reportData.eficaciaEstReport.total} encuestas` : '0 encuestas'}
                                        </p>
                                    </div>
                                </div>

                                {/* Auditoría de Distribución de Género */}
                                <div className="audit-section-title">
                                    <span className="material-symbols-outlined">wc</span>
                                    Auditoría de Equidad de Género (Participantes)
                                </div>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div className="gender-labels">
                                        <span>Mujeres (Femenino): {(() => {
                                            const total = reportData.cedulas.length;
                                            let count = 0;
                                            reportData.cedulas.forEach(c => {
                                                const g = (c.personalData?.genero || '').trim().toUpperCase();
                                                if (g === 'M' || g === 'MUJER' || g === 'FEMENINO' || g === 'F') count++;
                                            });
                                            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                                            return `${count} (${pct}%)`;
                                        })()}</span>
                                        <span>Hombres (Masculino): {(() => {
                                            const total = reportData.cedulas.length;
                                            let count = 0;
                                            reportData.cedulas.forEach(c => {
                                                const g = (c.personalData?.genero || '').trim().toUpperCase();
                                                if (g === 'H' || g === 'HOMBRE' || g === 'MASCULINO') count++;
                                            });
                                            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                                            return `${count} (${pct}%)`;
                                        })()}</span>
                                    </div>
                                    <div className="gender-indicator-bar">
                                        <div 
                                            className="bar-female" 
                                            style={{ 
                                                width: `${(() => {
                                                    const total = reportData.cedulas.length;
                                                    if (total === 0) return 50;
                                                    let count = 0;
                                                    reportData.cedulas.forEach(c => {
                                                        const g = (c.personalData?.genero || '').trim().toUpperCase();
                                                        if (g === 'M' || g === 'MUJER' || g === 'FEMENINO' || g === 'F') count++;
                                                    });
                                                    return (count / total) * 100;
                                                })()}%` 
                                            }}
                                        />
                                        <div 
                                            className="bar-male" 
                                            style={{ 
                                                width: `${(() => {
                                                    const total = reportData.cedulas.length;
                                                    if (total === 0) return 50;
                                                    let count = 0;
                                                    reportData.cedulas.forEach(c => {
                                                        const g = (c.personalData?.genero || '').trim().toUpperCase();
                                                        if (g === 'H' || g === 'HOMBRE' || g === 'MASCULINO') count++;
                                                    });
                                                    return (count / total) * 100;
                                                })()}%` 
                                            }}
                                        />
                                    </div>
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                                        * Datos extraídos automáticamente de las Cédulas de Inscripción del personal registrado.
                                    </p>
                                </div>

                                {/* Detalle de Encuestas en Formato de Tablas de Auditoría */}
                                
                                {/* 1. Encuesta de Opinión */}
                                <div className="audit-section-title">
                                    <span className="material-symbols-outlined">assessment</span>
                                    Encuesta de Opinión de los Participantes (Formato ITGAM-AC-005-09)
                                </div>
                                {reportData.opinionReport && reportData.opinionReport.total > 0 ? (
                                    <div className="table-responsive">
                                        <table className="audit-details-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '8%' }}>No.</th>
                                                    <th>Aspecto Evaluado</th>
                                                    <th style={{ width: '25%', textAlign: 'center' }}>Calificación Promedio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {opinionQuestions.map((qText, index) => {
                                                    const pVal = reportData.opinionReport.promedios[index] || "N/A";
                                                    return (
                                                        <tr key={index}>
                                                            <td style={{ fontWeight: 'bold' }}>{index + 1}</td>
                                                            <td>{qText}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                {getRatingBadge(pVal)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                                        No hay respuestas registradas para la Encuesta de Opinión en este curso.
                                    </div>
                                )}

                                {/* 2. Encuestas de Eficacia (Jefe y Estudiante) */}
                                <div className="audit-section-title">
                                    <span className="material-symbols-outlined">fact_check</span>
                                    Evaluaciones de Eficacia y Transferencia del Conocimiento (Formato ITGAM-AC-005-04 e ITGAM-AC-005-03)
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {/* Eficacia Docente - Evaluación del Jefe */}
                                    <div>
                                        <h5 style={{ color: '#003366', fontSize: '0.95rem', marginBottom: '10px', fontWeight: 'bold' }}>
                                            Eficacia Docente (Evaluada por el Jefe Inmediato / Coordinador)
                                        </h5>
                                        {reportData.eficaciaProfReport && reportData.eficaciaProfReport.total > 0 ? (
                                            <div className="table-responsive">
                                                <table className="audit-details-table">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '10%' }}>No.</th>
                                                            <th>Aspecto de Transferencia</th>
                                                            <th style={{ width: '35%', textAlign: 'center' }}>Promedio</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {eficaciaQuestions.map((qText, index) => {
                                                            const pVal = reportData.eficaciaProfReport.promedios[index] || "N/A";
                                                            return (
                                                                <tr key={index}>
                                                                    <td style={{ fontWeight: 'bold' }}>{index + 1}</td>
                                                                    <td style={{ fontSize: '0.8rem' }}>{qText}</td>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        {getRatingBadge(pVal)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                                                Sin respuestas registradas para Eficacia Docente (Jefe).
                                            </div>
                                        )}
                                    </div>

                                    {/* Eficacia Estudiante - Autoevaluación */}
                                    <div>
                                        <h5 style={{ color: '#003366', fontSize: '0.95rem', marginBottom: '10px', fontWeight: 'bold' }}>
                                            Eficacia del Estudiante (Autoevaluación del Participante)
                                        </h5>
                                        {reportData.eficaciaEstReport && reportData.eficaciaEstReport.total > 0 ? (
                                            <div className="table-responsive">
                                                <table className="audit-details-table">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '10%' }}>No.</th>
                                                            <th>Aspecto de Transferencia</th>
                                                            <th style={{ width: '35%', textAlign: 'center' }}>Promedio</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {eficaciaQuestions.map((qText, index) => {
                                                            const pVal = reportData.eficaciaEstReport.promedios[index] || "N/A";
                                                            return (
                                                                <tr key={index}>
                                                                    <td style={{ fontWeight: 'bold' }}>{index + 1}</td>
                                                                    <td style={{ fontSize: '0.8rem' }}>{qText}</td>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        {getRatingBadge(pVal)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                                                Sin respuestas registradas para Eficacia del Estudiante.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sugerencias y Observaciones para Auditorías (Comentarios Cualitativos) */}
                                <div className="audit-section-title">
                                    <span className="material-symbols-outlined">chat</span>
                                    Sugerencias y Observaciones Recopiladas (Evidencia de Auditoría de Calidad)
                                </div>
                                {(() => {
                                    const allComments = [
                                        ...(reportData.opinionReport?.comentarios || []).map(c => ({ text: c, source: 'Opinión' })),
                                        ...(reportData.eficaciaProfReport?.comentarios || []).map(c => ({ text: c, source: 'Eficacia (Jefe)' })),
                                        ...(reportData.eficaciaEstReport?.comentarios || []).map(c => ({ text: c, source: 'Eficacia (Estudiante)' }))
                                    ];

                                    return allComments.length > 0 ? (
                                        <div className="audit-comments-list">
                                            {allComments.map((comment, index) => (
                                                <div key={index} className="audit-comment-item">
                                                    <span 
                                                        style={{ 
                                                            display: 'inline-block', 
                                                            padding: '2px 6px', 
                                                            borderRadius: '4px', 
                                                            fontSize: '0.7rem', 
                                                            fontWeight: 'bold', 
                                                            marginRight: '8px',
                                                            background: comment.source === 'Opinión' ? '#e0f2fe' : comment.source.includes('Jefe') ? '#d1fae5' : '#f5f3ff',
                                                            color: comment.source === 'Opinión' ? '#0369a1' : comment.source.includes('Jefe') ? '#065f46' : '#6d28d9'
                                                        }}
                                                    >
                                                        {comment.source}
                                                    </span>
                                                    "{comment.text}"
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                                            No se registraron comentarios, observaciones ni sugerencias en las encuestas de este curso.
                                        </div>
                                    );
                                })()}

                                {/* Firmas de Validación para Auditoría (Solo visible en impresión o pie de reporte) */}
                                <div 
                                    className="audit-signature-block"
                                    style={{ 
                                        marginTop: '50px', 
                                        display: 'flex', 
                                        justifyContent: 'space-around', 
                                        textAlign: 'center', 
                                        fontSize: '0.85rem' 
                                    }}
                                >
                                    <div style={{ width: '200px', borderTop: '1px solid #475569', paddingTop: '10px' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>Elaboró</p>
                                        <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Coordinador de Capacitación</p>
                                    </div>
                                    <div style={{ width: '200px', borderTop: '1px solid #475569', paddingTop: '10px' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>Revisó y Validó</p>
                                        <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Administrador del Sistema</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'config' && (
                    <section className="animate-fade-in text-left" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                        <div className="card-glass" style={{ padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ color: '#001e3c', marginBottom: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined">settings</span>
                                Parámetros del Sistema
                            </h3>
                            
                            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#4a5568' }}>Correo del Administrador Principal:</label>
                                    <input 
                                        type="email" 
                                        value={configData.adminActual}
                                        onChange={(e) => setConfigData({ ...configData, adminActual: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '15px' }}
                                        placeholder="admin@itgam.edu.mx"
                                    />
                                    <span style={{ fontSize: '11px', color: '#718096', marginTop: '4px', display: 'block' }}>Este correo se usará para notificaciones de administración y recuperación del sistema.</span>
                                </div>



                                <button 
                                    type="submit" 
                                    className="btn-primary" 
                                    disabled={configSaving}
                                    style={{ padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', marginTop: '10px', cursor: 'pointer' }}
                                >
                                    {configSaving ? "Guardando..." : "Guardar Configuración"}
                                </button>
                            </form>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;