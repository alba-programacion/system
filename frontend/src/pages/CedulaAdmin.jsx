import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import '../styles/GestionContenido.css'; 
import SurveyForm from '../components/SurveyForm';
import CedulaInscripcion from '../components/CedulaInscripcion';
import OpinionSurvey from '../components/OpinionSurvey';
import EficaciaSurvey from '../components/EficaciaSurvey';
import EficaciaEstudianteSurvey from '../components/EficaciaEstudianteSurvey';
import { QRCodeSVG } from 'qrcode.react';

const getDynamicHost = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? `http://${window.location.hostname}:5000`
    : window.location.origin;
};

const CedulaAdmin = () => {
    const [activeSubTab, setActiveSubTab] = useState('courses'); // 'courses' | 'formats' | 'eficacia_surveys' | 'eficacia_estudiante_surveys' | 'opinion_surveys' | 'asistencia'
    const [events, setEvents] = useState([]);
    const [cedulas, setCedulas] = useState([]);
    const [courseSurveys, setCourseSurveys] = useState([]);
    const [courseEficaciaSurveys, setCourseEficaciaSurveys] = useState([]);
    const [courseEficaciaEstudianteSurveys, setCourseEficaciaEstudianteSurveys] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [loading, setLoading] = useState(true);
    const [activePrintPreview, setActivePrintPreview] = useState(null); // null | { type, data }
    const [attendanceReport, setAttendanceReport] = useState(null);

    // --- QR Attendance States ---
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionAttendees, setSessionAttendees] = useState([]);
    const [serverLocalIP, setServerLocalIP] = useState("localhost");
    const [customIP, setCustomIP] = useState("");
    const [qrLoading, setQrLoading] = useState(false);

    // Form states for new course
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [courseKey, setCourseKey] = useState('');
    const [instructorName, setInstructorName] = useState('');
    const [period, setPeriod] = useState('');
    const [schedule, setSchedule] = useState('');
    const [duration, setDuration] = useState('');

    const [teachers, setTeachers] = useState([]);
    const [selectedInstructorId, setSelectedInstructorId] = useState('');
    const [evidenceUploadEnabled, setEvidenceUploadEnabled] = useState(false);

    const fetchSessions = async (courseId) => {
        if (!courseId) return;
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`/attendance/session/history/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(res.data);
            if (selectedSession) {
                const updated = res.data.find(s => s._id === selectedSession._id);
                if (updated) {
                    setSelectedSession(updated);
                    fetchSessionAttendees(updated._id);
                }
            }
        } catch (error) {
            console.error("Error al cargar historial de sesiones:", error);
        }
    };

    const fetchSessionAttendees = async (sessionId) => {
        if (!sessionId) return;
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`/attendance/session/${sessionId}/attendees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessionAttendees(res.data);
        } catch (error) {
            console.error("Error al cargar asistentes:", error);
        }
    };

    const handleGenerateQR = async () => {
        if (!selectedEventId) return alert("Selecciona un curso primero");
        setQrLoading(true);
        try {
            const token = localStorage.getItem("token");
            const now = new Date();
            const sessionDate = now.toISOString().split('T')[0];

            const res = await api.post(`/attendance/session`, {
                courseId: selectedEventId,
                sessionDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Código QR generado con vigencia de 15 minutos.");
            await fetchSessions(selectedEventId);
            setSelectedSession(res.data.session);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Error al generar sesión QR.");
        } finally {
            setQrLoading(false);
        }
    };

    const handleRegenerateQR = async (sessionId) => {
        if (!window.confirm("¿Estás seguro de regenerar el código QR? El token anterior dejará de funcionar inmediatamente.")) return;
        setQrLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.post(`/attendance/session/${sessionId}/regenerate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Código QR regenerado. Vigencia restablecida por 15 minutos.");
            await fetchSessions(selectedEventId);
            setSelectedSession(res.data.session);
        } catch (error) {
            console.error(error);
            alert("Error al regenerar token.");
        } finally {
            setQrLoading(false);
        }
    };

    const handleCancelQR = async (sessionId) => {
        if (!window.confirm("¿Estás seguro de cancelar esta sesión de asistencia? Los docentes ya no podrán registrarse.")) return;
        setQrLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await api.post(`/attendance/session/${sessionId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Sesión de asistencia cancelada.");
            await fetchSessions(selectedEventId);
            setSelectedSession(res.data.session);
        } catch (error) {
            console.error(error);
            alert("Error al cancelar sesión.");
        } finally {
            setQrLoading(false);
        }
    };

    const getVisualStatus = (session) => {
        if (!session) return "";
        if (session.qrStatus === "revoked") return "revoked";
        if (session.qrStatus === "expired") return "expired";
        
        const expiresTime = new Date(session.expiresAt).getTime();
        const nowTime = new Date().getTime();
        if (nowTime > expiresTime) {
            return "expired";
        }
        return "active";
    };

    const handleExportCSV = (session) => {
        if (!sessionAttendees.length) return alert("No hay asistentes registrados para exportar.");
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Nombre del Docente,Correo,Hora de Registro,IP,Dispositivo,Latitud,Longitud\n";
        
        sessionAttendees.forEach(att => {
            const user = att.userId || {};
            const name = `${user.nombres} ${user.apPaterno} ${user.apMaterno}`.replace(/,/g, " ");
            const mail = user.correoInstitucional || "N/A";
            const time = att.attendanceTime || "N/A";
            const ip = att.ipAddress || "N/A";
            const dev = (att.deviceInfo || "N/A").replace(/,/g, " ");
            const lat = att.geolocation?.latitude || "N/A";
            const lon = att.geolocation?.longitude || "N/A";
            
            csvContent += `"${name}","${mail}","${time}","${ip}","${dev}","${lat}","${lon}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `asistencias_curso_${session.sessionDate}_${selectedEvent?.courseKey || "QR"}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (activeSubTab === 'asistencia' && selectedEventId) {
            const fetchConfigAndSessions = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const resConfig = await api.get(`/auth/config`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (resConfig.data && resConfig.data.localIP) {
                        setServerLocalIP(resConfig.data.localIP);
                        setCustomIP(resConfig.data.localIP);
                    }
                    await fetchSessions(selectedEventId);
                } catch (error) {
                    console.error("Error al inicializar Asistencia QR:", error);
                }
            };
            fetchConfigAndSessions();
        }
    }, [activeSubTab, selectedEventId]);

    useEffect(() => {
        let intervalId = null;
        if (activeSubTab === 'asistencia' && selectedSession) {
            const status = getVisualStatus(selectedSession);
            fetchSessionAttendees(selectedSession._id);

            if (status === 'active') {
                intervalId = setInterval(() => {
                    fetchSessionAttendees(selectedSession._id);
                }, 3000);
            }
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeSubTab, selectedSession]);

    const fetchTeachers = useCallback(async () => {
        try {
            const res = await api.get('/admin/users?role=profesor');
            setTeachers(res.data);
        } catch (err) {
            console.error("Error al cargar profesores:", err);
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/admin/events?type=course');
            setEvents(res.data);
        } catch (err) {
            console.error("Error al cargar eventos:", err);
        }
    }, []);

    const fetchCedulas = useCallback(async () => {
        try {
            const res = await api.get('/cedulas/report');
            setCedulas(res.data);
        } catch (err) {
            console.error("Error al cargar cédulas:", err);
        }
    }, []);

    const fetchCourseSurveys = useCallback(async () => {
        if (!selectedEventId) {
            setCourseSurveys([]);
            setCourseEficaciaSurveys([]);
            setCourseEficaciaEstudianteSurveys([]);
            return;
        }
        try {
            const res = await api.get(`/surveys/event/${selectedEventId}`);
            setCourseSurveys(res.data.filter(s => s.tipo === 'opinion'));
            setCourseEficaciaSurveys(res.data.filter(s => s.tipo === 'eficacia_profesor'));
            setCourseEficaciaEstudianteSurveys(res.data.filter(s => s.tipo === 'eficacia_estudiante'));
        } catch (err) {
            console.error("Error al cargar encuestas del curso:", err);
        }
    }, [selectedEventId]);

    const fetchAttendanceReport = useCallback(async () => {
        if (!selectedEventId) {
            setAttendanceReport(null);
            return;
        }
        try {
            const res = await api.get(`/attendance/report/${selectedEventId}`);
            setAttendanceReport(res.data);
        } catch (err) {
            console.error("Error al cargar reporte de asistencia:", err);
            setAttendanceReport(null);
        }
    }, [selectedEventId]);

    useEffect(() => {
        fetchCourseSurveys();
        if (selectedEventId) {
            fetchAttendanceReport();
        }
    }, [selectedEventId, fetchCourseSurveys, fetchAttendanceReport]);

    const loadData = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchEvents(), fetchCedulas(), fetchTeachers()]);
        setLoading(false);
    }, [fetchEvents, fetchCedulas, fetchTeachers]);

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newTitle || !courseKey || !instructorName || !period || !schedule || !duration) {
            return alert("Por favor, completa todos los campos requeridos.");
        }
        setLoading(true);
        try {
            await api.post('/admin/events', {
                title: newTitle,
                description: newDescription,
                date: eventDate || new Date().toLocaleDateString(),
                courseKey,
                instructorName,
                instructor: selectedInstructorId || null,
                evidenceUploadEnabled,
                period,
                schedule,
                duration,
                type: "course"
            });
            alert("Curso creado con éxito");
            setNewTitle('');
            setNewDescription('');
            setEventDate('');
            setCourseKey('');
            setInstructorName('');
            setSelectedInstructorId('');
            setEvidenceUploadEnabled(false);
            setPeriod('');
            setSchedule('');
            setDuration('');
            await fetchEvents();
        } catch (err) {
            console.error("Error al crear curso:", err);
            alert(err.response?.data?.error || "Error al registrar el curso");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este curso? Los profesores ya no podrán vincularlo.")) return;
        try {
            setLoading(true);
            await api.delete(`/admin/events/${id}`);
            await loadData();
            alert("Curso eliminado correctamente.");
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el curso.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEventInstructor = async (eventId, instructorId) => {
        try {
            await api.patch(`/admin/events/${eventId}`, {
                instructor: instructorId || null
            });
            setEvents(prev => prev.map(ev => ev._id === eventId ? { ...ev, instructor: instructorId } : ev));
        } catch (err) {
            console.error("Error al actualizar instructor:", err);
            alert("No se pudo actualizar el instructor.");
        }
    };

    const handleUpdateEventUploadToggle = async (eventId, isEnabled) => {
        try {
            await api.patch(`/admin/events/${eventId}`, {
                evidenceUploadEnabled: isEnabled
            });
            setEvents(prev => prev.map(ev => ev._id === eventId ? { ...ev, evidenceUploadEnabled: isEnabled } : ev));
        } catch (err) {
            console.error("Error al actualizar permiso de subida:", err);
            alert("No se pudo actualizar el permiso de subida.");
        }
    };

    const handlePrintReport = () => {
        window.print();
    };

    // Filtrar cédulas del curso seleccionado
    const selectedEvent = events.find(e => e._id === selectedEventId);
    const courseCedulas = cedulas.filter(c => c.eventId?._id === selectedEventId);

    // Calcular estadísticas
    const countHombres = courseCedulas.filter(c => c.personalData?.genero?.toLowerCase() === 'masculino').length;
    const countMujeres = courseCedulas.filter(c => c.personalData?.genero?.toLowerCase() === 'femenino').length;
    const totalInscritos = courseCedulas.length;

    const fechaHoy = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="vida-campus-container" style={{ padding: '0px' }}>
            <style>{`
                .subtab-navigation {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 25px;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 10px;
                }
                .subtab-btn {
                    background: none;
                    border: none;
                    font-size: 16px;
                    font-weight: 600;
                    color: #64748b;
                    padding: 8px 16px;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.3s;
                }
                .subtab-btn:hover {
                    color: #001e3c;
                }
                .subtab-btn.active {
                    color: #001e3c;
                }
                .subtab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -12px;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background-color: #001e3c;
                    border-radius: 3px;
                }
                .course-selector-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    margin-bottom: 20px;
                }
                .stats-badge-container {
                    display: flex;
                    gap: 15px;
                    margin: 15px 0;
                }
                .stat-badge {
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 14px;
                }
                .stat-badge.male {
                    background-color: #e0f2fe;
                    color: #0369a1;
                }
                .stat-badge.female {
                    background-color: #fce7f3;
                    color: #be185d;
                }
                .stat-badge.total {
                    background-color: #f1f5f9;
                    color: #334155;
                }
                .btn-print-report {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background-color: #001e3c;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: bold;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-print-report:hover {
                    background-color: #002d5c;
                }
                        /* Estilos específicos para impresión del listado oficial */
                @media print {
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-report, #printable-report * {
                        visibility: visible;
                    }
                    #printable-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        color: black !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .custom-table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                    .custom-table th, .custom-table td {
                        border: 1px solid #000 !important;
                        padding: 8px;
                        color: black !important;
                    }
            `}</style>

            {/* Navegación de pestañas internas */}
            <div className="subtab-navigation no-print">
                <button 
                    type="button" 
                    className={`subtab-btn ${activeSubTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('courses')}
                >
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '5px' }}>edit_note</span>
                    Gestionar Cursos
                </button>
                <button 
                    type="button" 
                    className={`subtab-btn ${activeSubTab === 'formats' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('formats')}
                >
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '5px' }}>folder_shared</span>
                    Cédulas de Inscripción
                </button>
                <button 
                    type="button" 
                    className={`subtab-btn ${activeSubTab === 'eficacia_surveys' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveSubTab('eficacia_surveys');
                        setActivePrintPreview(null);
                    }}
                >
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '5px' }}>analytics</span>
                    Encuesta de eficacia
                </button>
                <button 
                    type="button" 
                    className={`subtab-btn ${activeSubTab === 'eficacia_estudiante_surveys' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveSubTab('eficacia_estudiante_surveys');
                        setActivePrintPreview(null);
                    }}
                >
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '5px' }}>assessment</span>
                    Encuesta de eficacia (Estudiante)
                </button>
                <button 
                    type="button" 
                    className={`subtab-btn ${activeSubTab === 'opinion_surveys' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveSubTab('opinion_surveys');
                        setActivePrintPreview(null);
                    }}
                >
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '5px' }}>rate_review</span>
                    Encuesta de opinión
                </button>
                <button 
                    type="button" 
                    className={`subtab-btn ${activeSubTab === 'asistencia' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveSubTab('asistencia');
                        setActivePrintPreview(null);
                        if (selectedEventId) fetchAttendanceReport();
                    }}
                >
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '5px' }}>qr_code_2</span>
                    Lista de asistencia (con QR)
                </button>
            </div>

            {loading && <div className="loading-container"><p>Cargando información...</p></div>}

            {/* PESTAÑA 1: GESTIONAR CURSOS */}
            {!loading && activeSubTab === 'courses' && (
                <>
                    <section className="admin-section no-print" style={{ maxHeight: 'none', height: 'auto' }}>
                        <h2 className="section-title">
                            <span className="material-symbols-outlined">assignment</span> Registrar Nuevo Curso (Cédula de Inscripción)
                        </h2>
                        
                        <form onSubmit={handleCreateEvent} className="event-form-card" style={{ padding: '0px' }}>
                            <div className="event-inputs-grid">
                                <div className="form-group">
                                    <label>Clave del Curso (Requerido)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: CURSO-102" 
                                        value={courseKey} 
                                        onChange={(e) => setCourseKey(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nombre del Curso / Título (Requerido)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Introducción a la Inteligencia Artificial" 
                                        value={newTitle} 
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="event-inputs-grid">
                                <div className="form-group">
                                    <label>Nombre del Instructor (Requerido)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Dr. Aaron Guzmán" 
                                        value={instructorName} 
                                        onChange={(e) => setInstructorName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Usuario Docente Asociado (Opcional, para Subida de Evidencias)</label>
                                    <select
                                        value={selectedInstructorId}
                                        onChange={(e) => setSelectedInstructorId(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                                    >
                                        <option value="">-- Sin Vincular --</option>
                                        {teachers.map(t => (
                                            <option key={t._id} value={t._id}>
                                                {t.nombres} {t.apPaterno} {t.apMaterno}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="event-inputs-grid">
                                <div className="form-group">
                                    <label>Periodo de Realización (Requerido)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: del 15 al 30 de Octubre 2026" 
                                        value={period} 
                                        onChange={(e) => setPeriod(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="create-upload-enable"
                                        checked={evidenceUploadEnabled} 
                                        onChange={(e) => setEvidenceUploadEnabled(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="create-upload-enable" style={{ cursor: 'pointer', fontWeight: '500', fontSize: '13px', userSelect: 'none' }}>
                                        Habilitar subida de evidencias para este instructor
                                    </label>
                                </div>
                            </div>

                            <div className="event-inputs-grid">
                                <div className="form-group">
                                    <label>Horario (Requerido)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: 09:00 a 13:00 hrs" 
                                        value={schedule} 
                                        onChange={(e) => setSchedule(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Duración en Horas (Requerido)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: 30 horas" 
                                        value={duration} 
                                        onChange={(e) => setDuration(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="event-inputs-grid">
                                <div className="form-group">
                                    <label>Fecha de Registro (Opcional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: 2026-10-15 o Octubre" 
                                        value={eventDate} 
                                        onChange={(e) => setEventDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Descripción / Observaciones (Opcional)</label>
                                    <textarea 
                                        placeholder="Agregar descripción del curso..." 
                                        value={newDescription} 
                                        onChange={(e) => setNewDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="event-submit-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? "Procesando..." : "Crear y Publicar Curso"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="admin-section no-print" style={{ maxHeight: 'none', height: 'auto', marginTop: '25px' }}>
                        <h2 className="section-title">Cursos Activos Registrados</h2>
                        <div className="events-admin-list">
                            {events.length > 0 ? events.map(event => (
                                <div key={event._id} className="event-admin-row" style={{ flexWrap: 'wrap', gap: '15px' }}>
                                    <div className="event-row-text" style={{ flex: '1 1 300px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ backgroundColor: '#001e3c', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                                {event.courseKey}
                                            </span>
                                            <strong>{event.title}</strong>
                                        </div>
                                        <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                                            <span>Instructor original: {event.instructorName} | Horario: {event.schedule} | Duración: {event.duration}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                        {/* Docente Asociado - Fijo */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Docente Asociado
                                            </label>
                                            <div style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 12px', 
                                                borderRadius: '8px', 
                                                border: '1px solid #cbd5e1', 
                                                fontSize: '13px', 
                                                backgroundColor: '#f8fafc', 
                                                color: '#0f172a',
                                                fontWeight: '600',
                                                minHeight: '38px',
                                                boxSizing: 'border-box'
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#001e3c' }}>person</span>
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {(() => {
                                                        const teacher = teachers.find(t => t._id === (event.instructor?._id || event.instructor));
                                                        return teacher 
                                                            ? `${teacher.nombres || ''} ${teacher.apPaterno || ''} ${teacher.apMaterno || ''}`.trim() 
                                                            : (event.instructorName || "Sin Vincular");
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Checkbox to enable upload */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
                                            <input 
                                                type="checkbox"
                                                id={`upload-enable-${event._id}`}
                                                checked={!!event.evidenceUploadEnabled}
                                                onChange={(e) => handleUpdateEventUploadToggle(event._id, e.target.checked)}
                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                            />
                                            <label htmlFor={`upload-enable-${event._id}`} style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                                                Habilitar subida
                                            </label>
                                        </div>

                                        <button 
                                            onClick={() => handleDelete(event._id)}
                                            className="btn-event-delete"
                                            disabled={loading}
                                            style={{ marginTop: '16px' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="no-data-text">No hay cursos registrados en el sistema actualmente.</p>}
                        </div>
                    </section>
                </>
            )}

            {/* PESTAÑA 2: FORMATOS - CÉDULAS DE INSCRIPCIÓN */}
            {!loading && activeSubTab === 'formats' && (
                <>
                    <div className="course-selector-card no-print">
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001e3c' }}>
                            Selecciona el Curso para Visualizar Cédulas de Inscripción:
                        </label>
                        <select 
                            value={selectedEventId} 
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                        >
                            <option value="">-- Selecciona un Curso --</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id}>
                                    [{ev.courseKey}] - {ev.title} (Instructor: {ev.instructorName})
                                </option>
                            ))}
                        </select>

                        {selectedEvent && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                <div className="stats-badge-container">
                                    <span className="stat-badge male">Hombres: {countHombres}</span>
                                    <span className="stat-badge female">Mujeres: {countMujeres}</span>
                                    <span className="stat-badge total">Total Inscritos: {totalInscritos}</span>
                                </div>
                                
                                {totalInscritos > 0 && (
                                    <button 
                                        type="button" 
                                        className="btn-print-report" 
                                        onClick={handlePrintReport}
                                    >
                                        <span className="material-symbols-outlined">print</span>
                                        Imprimir Lista de Inscripción
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* VISTA PRINCIPAL O REPORTE OFICIAL (Imprimible) */}
                    <div id="printable-report" className="card-glass" style={{ padding: '30px', background: 'white' }}>
                        {!selectedEventId ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }} className="no-print">
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '10px' }}>layers_clear</span>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Ningún Curso Seleccionado</h3>
                                <p style={{ fontSize: '13px', margin: 0 }}>Por favor, selecciona un curso del menú desplegable superior para visualizar sus estadísticas y cédulas registradas.</p>
                            </div>
                        ) : activePrintPreview ? (
                            <div className="print-preview-container">
                                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#001e3c', fontSize: '16px', fontWeight: 'bold' }}>Vista Previa de Impresión</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Formato: Cédula de Inscripción</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}
                                            onClick={() => window.print()}
                                        >
                                            <span className="material-symbols-outlined">print</span> Imprimir Formato
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px', backgroundColor: '#64748b' }}
                                            onClick={() => setActivePrintPreview(null)}
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span> Volver
                                        </button>
                                    </div>
                                </div>

                                <div className="printable-preview-content">
                                    {activePrintPreview.type === 'cedula' && (
                                        <CedulaInscripcion 
                                            courseData={selectedEvent}
                                            cedulaData={activePrintPreview.data}
                                            onSave={() => Promise.resolve(true)}
                                            onPrint={() => window.print()}
                                            readOnly={true}
                                        />
                                    )}
                                    {activePrintPreview.type === 'opinion' && (
                                        <OpinionSurvey 
                                            courseData={selectedEvent}
                                            surveyData={activePrintPreview.data}
                                            onSave={() => Promise.resolve(true)}
                                            readOnly={true}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : selectedEvent ? (
                            <>
                                {/* Encabezado del Reporte Oficial para impresión */}
                                <div style={{ borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px', textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#000' }}>
                                        INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO
                                    </h2>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'normal', textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '1px', color: '#333' }}>
                                        Reporte de Cédula de Inscripción Docente
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', textAlign: 'left', marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div><strong>Curso:</strong> {selectedEvent.title}</div>
                                        <div><strong>Clave:</strong> {selectedEvent.courseKey}</div>
                                        <div><strong>Instructor:</strong> {selectedEvent.instructorName}</div>
                                        <div><strong>Periodo:</strong> {selectedEvent.period}</div>
                                        <div><strong>Horario/Duración:</strong> {selectedEvent.schedule} ({selectedEvent.duration})</div>
                                        <div><strong>Fecha Reporte:</strong> {fechaHoy}</div>
                                    </div>
                                </div>

                                {/* Estadísticas impresas */}
                                <div style={{ margin: '15px 0', fontSize: '13px', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
                                    <strong>Resumen de Inscripción:</strong> &nbsp;&nbsp;&nbsp;
                                    Hombres: {countHombres} &nbsp;&nbsp;|&nbsp;&nbsp; 
                                    Mujeres: {countMujeres} &nbsp;&nbsp;|&nbsp;&nbsp; 
                                    Total de Participantes: {totalInscritos}
                                </div>

                                {/* Tabla de Registrados */}
                                {totalInscritos > 0 ? (
                                    <div className="table-responsive">
                                        <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                    <th>Docente</th>
                                                    <th>RFC / CURP</th>
                                                    <th>Género</th>
                                                    <th>Adscripción / Grado</th>
                                                    <th style={{ width: '140px' }}>Firma Digital</th>
                                                    <th className="no-print">Evidencia</th>
                                                    <th className="no-print" style={{ width: '180px' }}>Cédula de Inscripción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseCedulas.map((c) => (
                                                    <tr key={c._id}>
                                                        <td>
                                                            <strong style={{ color: '#001e3c' }}>
                                                                {c.personalData?.nombres} {c.personalData?.apPaterno} {c.personalData?.apMaterno}
                                                            </strong>
                                                            <br />
                                                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                                {c.userId?.correoInstitucional}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            RFC: <code>{c.personalData?.rfc || 'N/A'}</code>
                                                            <br />
                                                            CURP: <code>{c.personalData?.curp || 'N/A'}</code>
                                                        </td>
                                                        <td style={{ textTransform: 'capitalize' }}>
                                                            {c.personalData?.genero || 'No especificado'}
                                                        </td>
                                                        <td>
                                                            {c.laborData?.departamento || 'N/A'}
                                                            <br />
                                                            <span style={{ fontSize: '11px', fontStyle: 'italic' }}>
                                                                {c.personalData?.gradoEstudios || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center', backgroundColor: '#fafafa', verticalAlign: 'middle' }}>
                                                            {c.signature ? (
                                                                <img 
                                                                    src={c.signature} 
                                                                    alt="Firma" 
                                                                    style={{ maxHeight: '45px', width: 'auto', display: 'block', margin: '0 auto' }} 
                                                                />
                                                            ) : (
                                                                <span style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>Sin firma</span>
                                                            )}
                                                        </td>
                                                        <td className="no-print" style={{ textAlign: 'center' }}>
                                                            {c.evidenceUrl ? (
                                                                <a 
                                                                    href={`${getDynamicHost()}/${c.evidenceUrl}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}
                                                                >
                                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                                                                    Ver Archivo
                                                                </a>
                                                            ) : (
                                                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Ninguna</span>
                                                            )}
                                                        </td>
                                                        <td className="no-print" style={{ textAlign: 'center' }}>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => setActivePrintPreview({ type: 'cedula', data: c })}
                                                                 style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                             >
                                                                 <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>assignment</span> Ver Cédula
                                                             </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>group_add</span>
                                        <p>Ningún docente se ha inscrito a este curso todavía.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Crea un curso primero en la pestaña "Gestionar Cursos".</p>
                        )}
                    </div>
                </>
            )}

            {/* PESTAÑA 3: ENCUESTAS DE EFICACIA */}
            {!loading && activeSubTab === 'eficacia_surveys' && (
                <>
                    <div className="course-selector-card no-print">
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001e3c' }}>
                            Selecciona el Curso para Visualizar Encuestas de Eficacia:
                        </label>
                        <select 
                            value={selectedEventId} 
                            onChange={(e) => {
                                setSelectedEventId(e.target.value);
                                setActivePrintPreview(null);
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                        >
                            <option value="">-- Selecciona un Curso --</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id}>
                                    [{ev.courseKey}] - {ev.title} (Instructor: {ev.instructorName})
                                </option>
                            ))}
                        </select>

                        {selectedEvent && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                <div className="stats-badge-container">
                                    <span className="stat-badge total" style={{ backgroundColor: '#001e3c', color: 'white' }}>
                                        Total Encuestas Recibidas: {courseEficaciaSurveys.length}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* VISTA PRINCIPAL O FORMATO INDIVIDUAL */}
                    <div id="printable-report" className="card-glass" style={{ padding: '30px', background: 'white' }}>
                        {!selectedEventId ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }} className="no-print">
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '10px' }}>layers_clear</span>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Ningún Curso Seleccionado</h3>
                                <p style={{ fontSize: '13px', margin: 0 }}>Por favor, selecciona un curso del menú desplegable superior para visualizar las encuestas de eficacia registradas.</p>
                            </div>
                        ) : activePrintPreview ? (
                            <div className="print-preview-container">
                                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#001e3c', fontSize: '16px', fontWeight: 'bold' }}>Vista Previa de Impresión</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Formato: Encuesta de Eficacia (ITGAM-AC-005-04)</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}
                                            onClick={() => window.print()}
                                        >
                                            <span className="material-symbols-outlined">print</span> Imprimir Formato
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px', backgroundColor: '#64748b' }}
                                            onClick={() => setActivePrintPreview(null)}
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span> Volver
                                        </button>
                                    </div>
                                </div>

                                <div className="printable-preview-content">
                                    {activePrintPreview.type === 'eficacia' && (
                                        <EficaciaSurvey 
                                            courseData={selectedEvent}
                                            surveyData={activePrintPreview.data}
                                            onSave={() => Promise.resolve(true)}
                                            readOnly={true}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : selectedEvent ? (
                            <>
                                {/* Encabezado para impresión */}
                                <div className="report-print-header" style={{ marginBottom: '20px', borderBottom: '2px solid #001e3c', paddingBottom: '10px' }}>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#001e3c', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
                                        Reporte de Encuestas de Eficacia de Capacitación Docente
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                                        Curso: <strong style={{ color: '#001e3c' }}>{selectedEvent.title} ({selectedEvent.courseKey})</strong> | Instructor: <strong>{selectedEvent.instructorName}</strong>
                                    </p>
                                </div>

                                {/* Tabla de Registros */}
                                {courseEficaciaSurveys.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                    <th>Docente Participante</th>
                                                    <th>Fecha de Registro</th>
                                                    <th>Departamento</th>
                                                    <th className="no-print" style={{ width: '180px', textAlign: 'center' }}>Encuesta de Eficacia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseEficaciaSurveys.map((s) => (
                                                    <tr key={s._id}>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <strong style={{ color: '#001e3c', fontSize: '13px' }}>
                                                                    {s.userId ? `${s.userId.nombres || ''} ${s.userId.apPaterno || ''} ${s.userId.apMaterno || ''}` : 'Docente'}
                                                                </strong>
                                                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                                                    RFC / CURP: {s.userId?.rfc || s.userId?.curp || 'No registrado'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {new Date(s.createdAt).toLocaleDateString('es-MX', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>{s.departamento || 'No especificado'}</td>
                                                        <td className="no-print" style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePrintPreview({ type: 'eficacia', data: s })}
                                                                style={{ backgroundColor: '#001e3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>analytics</span> Ver Encuesta
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>analytics</span>
                                        <p>Ningún docente ha contestado la encuesta de eficacia para este curso todavía.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Crea un curso primero en la pestaña "Gestionar Cursos".</p>
                        )}
                    </div>
                </>
            )}

            {/* PESTAÑA 4: ENCUESTAS DE EFICACIA (ESTUDIANTE) */}
            {!loading && activeSubTab === 'eficacia_estudiante_surveys' && (
                <>
                    <div className="course-selector-card no-print">
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001e3c' }}>
                            Selecciona el Curso para Visualizar Encuestas de Eficacia (Estudiante):
                        </label>
                        <select 
                            value={selectedEventId} 
                            onChange={(e) => {
                                setSelectedEventId(e.target.value);
                                setActivePrintPreview(null);
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                        >
                            <option value="">-- Selecciona un Curso --</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id}>
                                    [{ev.courseKey}] - {ev.title} (Instructor: {ev.instructorName})
                                </option>
                            ))}
                        </select>

                        {selectedEvent && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                <div className="stats-badge-container">
                                    <span className="stat-badge total" style={{ backgroundColor: '#001e3c', color: 'white' }}>
                                        Total Encuestas Recibidas: {courseEficaciaEstudianteSurveys.length}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* VISTA PRINCIPAL O FORMATO INDIVIDUAL */}
                    <div id="printable-report" className="card-glass" style={{ padding: '30px', background: 'white' }}>
                        {!selectedEventId ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }} className="no-print">
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '10px' }}>layers_clear</span>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Ningún Curso Seleccionado</h3>
                                <p style={{ fontSize: '13px', margin: 0 }}>Por favor, selecciona un curso del menú desplegable superior para visualizar las encuestas de eficacia (Estudiante) registradas.</p>
                            </div>
                        ) : activePrintPreview ? (
                            <div className="print-preview-container">
                                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#001e3c', fontSize: '16px', fontWeight: 'bold' }}>Vista Previa de Impresión</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Formato: Encuesta de Eficacia (Estudiante) (ITGAM-AC-005-03)</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}
                                            onClick={() => window.print()}
                                        >
                                            <span className="material-symbols-outlined">print</span> Imprimir Formato
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px', backgroundColor: '#64748b' }}
                                            onClick={() => setActivePrintPreview(null)}
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span> Volver
                                        </button>
                                    </div>
                                </div>

                                <div className="printable-preview-content">
                                    {activePrintPreview.type === 'eficacia_estudiante' && (
                                        <EficaciaEstudianteSurvey 
                                            courseData={selectedEvent}
                                            surveyData={activePrintPreview.data}
                                            onSave={() => Promise.resolve(true)}
                                            readOnly={true}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : selectedEvent ? (
                            <>
                                {/* Encabezado para impresión */}
                                <div className="report-print-header" style={{ marginBottom: '20px', borderBottom: '2px solid #001e3c', paddingBottom: '10px' }}>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#001e3c', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
                                        Reporte de Encuestas de Eficacia (Estudiante)
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                                        Curso: <strong style={{ color: '#001e3c' }}>{selectedEvent.title} ({selectedEvent.courseKey})</strong> | Instructor: <strong>{selectedEvent.instructorName}</strong>
                                    </p>
                                </div>

                                {/* Tabla de Registros */}
                                {courseEficaciaEstudianteSurveys.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                    <th>Docente Participante</th>
                                                    <th>Fecha de Registro</th>
                                                    <th>Departamento</th>
                                                    <th className="no-print" style={{ width: '180px', textAlign: 'center' }}>Encuesta de Eficacia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseEficaciaEstudianteSurveys.map((s) => (
                                                    <tr key={s._id}>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <strong style={{ color: '#001e3c', fontSize: '13px' }}>
                                                                    {s.userId ? `${s.userId.nombres || ''} ${s.userId.apPaterno || ''} ${s.userId.apMaterno || ''}` : 'Docente'}
                                                                </strong>
                                                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                                                    RFC / CURP: {s.userId?.rfc || s.userId?.curp || 'No registrado'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {new Date(s.createdAt).toLocaleDateString('es-MX', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>{s.departamento || 'No especificado'}</td>
                                                        <td className="no-print" style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePrintPreview({ type: 'eficacia_estudiante', data: s })}
                                                                style={{ backgroundColor: '#001e3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>assessment</span> Ver Encuesta
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>assessment</span>
                                        <p>Ningún docente ha contestado la encuesta de eficacia (Estudiante) para este curso todavía.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Crea un curso primero en la pestaña "Gestionar Cursos".</p>
                        )}
                    </div>
                </>
            )}

            {/* PESTAÑA 5: ENCUESTAS DE OPINIÓN */}
            {!loading && activeSubTab === 'opinion_surveys' && (
                <>
                    <div className="course-selector-card no-print">
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001e3c' }}>
                            Selecciona el Curso para Visualizar Encuestas de Opinión:
                        </label>
                        <select 
                            value={selectedEventId} 
                            onChange={(e) => {
                                setSelectedEventId(e.target.value);
                                setActivePrintPreview(null);
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                        >
                            <option value="">-- Selecciona un Curso --</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id}>
                                    [{ev.courseKey}] - {ev.title} (Instructor: {ev.instructorName})
                                </option>
                            ))}
                        </select>

                        {selectedEvent && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                <div className="stats-badge-container">
                                    <span className="stat-badge total" style={{ backgroundColor: '#001e3c', color: 'white' }}>
                                        Total Encuestas Recibidas: {courseSurveys.length}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* VISTA PRINCIPAL O REPORTE OFICIAL (Imprimible) */}
                    <div id="printable-report" className="card-glass" style={{ padding: '30px', background: 'white' }}>
                        {!selectedEventId ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }} className="no-print">
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '10px' }}>layers_clear</span>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Ningún Curso Seleccionado</h3>
                                <p style={{ fontSize: '13px', margin: 0 }}>Por favor, selecciona un curso del menú desplegable superior para visualizar las encuestas de opinión registradas.</p>
                            </div>
                        ) : activePrintPreview ? (
                            <div className="print-preview-container">
                                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#001e3c', fontSize: '16px', fontWeight: 'bold' }}>Vista Previa de Impresión</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Formato: Encuesta de Opinión (ITGAM-AC-005-09)</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}
                                            onClick={() => window.print()}
                                        >
                                            <span className="material-symbols-outlined">print</span> Imprimir Formato
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-print-report" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '13px', backgroundColor: '#64748b' }}
                                            onClick={() => setActivePrintPreview(null)}
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span> Volver
                                        </button>
                                    </div>
                                </div>

                                <div className="printable-preview-content">
                                    {activePrintPreview.type === 'opinion' && (
                                        <OpinionSurvey 
                                            courseData={selectedEvent}
                                            surveyData={activePrintPreview.data}
                                            onSave={() => Promise.resolve(true)}
                                            readOnly={true}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : selectedEvent ? (
                            <>
                                {/* Encabezado del Reporte Oficial para impresión */}
                                <div className="report-print-header" style={{ marginBottom: '20px', borderBottom: '2px solid #001e3c', paddingBottom: '10px' }}>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#001e3c', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
                                        Reporte de Encuestas de Opinión
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                                        Curso: <strong style={{ color: '#001e3c' }}>{selectedEvent.title} ({selectedEvent.courseKey})</strong> | Instructor: <strong>{selectedEvent.instructorName}</strong>
                                    </p>
                                </div>

                                {/* Tabla de Registrados */}
                                {courseSurveys.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                    <th>Docente Participante</th>
                                                    <th>Fecha de Registro</th>
                                                    <th>Facilitador Evaluado</th>
                                                    <th className="no-print" style={{ width: '180px', textAlign: 'center' }}>Encuesta de Opinión</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseSurveys.map((s) => (
                                                    <tr key={s._id}>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <strong style={{ color: '#001e3c', fontSize: '13px' }}>
                                                                    {s.userId ? `${s.userId.nombres || ''} ${s.userId.apPaterno || ''} ${s.userId.apMaterno || ''}` : 'Docente'}
                                                                </strong>
                                                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                                                    RFC / CURP: {s.userId?.rfc || s.userId?.curp || 'No registrado'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {new Date(s.createdAt).toLocaleDateString('es-MX', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>{s.facilitador || selectedEvent.instructorName}</td>
                                                        <td className="no-print" style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePrintPreview({ type: 'opinion', data: s })}
                                                                style={{ backgroundColor: '#001e3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>rate_review</span> Ver Encuesta
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>rate_review</span>
                                        <p>Ningún docente ha contestado la encuesta de opinión para este curso todavía.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Crea un curso primero en la pestaña "Gestionar Cursos".</p>
                        )}
                    </div>
                </>
            )}

            {/* PESTAÑA 6: LISTA DE ASISTENCIA (CON QR) */}
            {!loading && activeSubTab === 'asistencia' && (
                <>
                    <div className="course-selector-card no-print">
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001e3c' }}>
                            Selecciona el Curso para Asistencia:
                        </label>
                        <select 
                            value={selectedEventId} 
                            onChange={(e) => {
                                setSelectedEventId(e.target.value);
                                setActivePrintPreview(null);
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                        >
                            <option value="">-- Selecciona un Curso --</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id}>
                                    [{ev.courseKey}] - {ev.title} (Instructor: {ev.instructorName})
                                </option>
                            ))}
                        </select>
                    </div>

                    {!selectedEventId ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }} className="card-glass no-print">
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '10px' }}>layers_clear</span>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Ningún Curso Seleccionado</h3>
                            <p style={{ fontSize: '13px', margin: 0 }}>Por favor, selecciona un curso del menú desplegable superior para proyectar el QR y ver la asistencia.</p>
                        </div>
                    ) : selectedEvent ? (
                        <>
                            {/* Panel de Gestión de Asistencia QR en Tiempo Real */}
                            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start', marginBottom: '30px' }}>
                                {/* COLUMNA IZQUIERDA: Historial de sesiones y botón generar */}
                                <div className="card-glass" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ color: '#001e3c', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                                        <span className="material-symbols-outlined" style={{ color: '#001e3c' }}>calendar_today</span>
                                        Sesiones QR
                                    </h3>
                                    
                                    <button
                                        onClick={handleGenerateQR}
                                        disabled={qrLoading || !selectedEventId}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none', transition: 'all 0.2s', marginBottom: '20px' }}
                                    >
                                        <span className="material-symbols-outlined">qr_code_2</span>
                                        {qrLoading ? "Generando..." : "Generar Código QR"}
                                    </button>

                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                        <h4 style={{ color: '#001e3c', marginBottom: '12px', fontWeight: '600', fontSize: '14px' }}>Historial del Curso</h4>
                                        {sessions.length === 0 ? (
                                            <p style={{ color: '#718096', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>
                                                No hay códigos QR generados aún para este curso.
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                                {sessions.map(s => {
                                                    const isSelected = selectedSession && selectedSession._id === s._id;
                                                    const status = getVisualStatus(s);
                                                    let badgeClass = "badge info";
                                                    let badgeText = "Activo";
                                                    if (status === "expired") {
                                                        badgeClass = "badge warning";
                                                        badgeText = "Expirado";
                                                    } else if (status === "revoked") {
                                                        badgeClass = "badge danger";
                                                        badgeText = "Cancelado";
                                                    }
                                                    return (
                                                        <div
                                                            key={s._id}
                                                            onClick={() => {
                                                                setSelectedSession(s);
                                                                fetchSessionAttendees(s._id);
                                                            }}
                                                            style={{
                                                                padding: '10px',
                                                                borderRadius: '8px',
                                                                border: isSelected ? '2px solid #0056b3' : '1px solid #e2e8f0',
                                                                background: isSelected ? '#f0f7ff' : '#f8fafc',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                textAlign: 'left'
                                                            }}
                                                        >
                                                            <div>
                                                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px', color: '#1a202c' }}>
                                                                    {s.sessionDate}
                                                                </p>
                                                                <p style={{ margin: 0, fontSize: '10px', color: '#718096' }}>
                                                                    {s.startTime} - {s.endTime}
                                                                </p>
                                                            </div>
                                                            <span className={badgeClass} style={{ fontSize: '9px', padding: '2px 6px' }}>{badgeText}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: Detalle del QR y pases de asistencia */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {selectedSession ? (
                                        <div className="card-glass" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
                                                <div>
                                                    <h4 style={{ color: '#001e3c', margin: 0, fontWeight: 'bold', fontSize: '15px' }}>Control de Código QR</h4>
                                                    <span style={{ fontSize: '11px', color: '#718096', fontFamily: 'monospace' }}>Sesión: {selectedSession._id}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleRegenerateQR(selectedSession._id)}
                                                        disabled={qrLoading || getVisualStatus(selectedSession) === 'revoked'}
                                                        className="btn-primary"
                                                        style={{ background: '#3182ce', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>autorenew</span>
                                                        Regenerar
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelQR(selectedSession._id)}
                                                        disabled={qrLoading || getVisualStatus(selectedSession) === 'revoked'}
                                                        className="btn-danger"
                                                        style={{ background: '#e53e3e', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cancel</span>
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'start' }}>
                                                {/* Código QR SVG */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                                                    {getVisualStatus(selectedSession) === 'active' ? (
                                                        <>
                                                            <QRCodeSVG value={`http://${customIP || serverLocalIP || 'localhost'}:5173/asistencia/${selectedSession.qrToken}`} size={160} level="H" includeMargin={true} />
                                                            <span style={{ fontSize: '10px', color: '#4a5568', marginTop: '10px', wordBreak: 'break-all', textAlign: 'center', maxWidth: '100%' }}>
                                                                <a href={`http://${customIP || serverLocalIP || 'localhost'}:5173/asistencia/${selectedSession.qrToken}`} target="_blank" rel="noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>
                                                                    {`http://${customIP || serverLocalIP || 'localhost'}:5173/asistencia/${selectedSession.qrToken}`}
                                                                </a>
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', padding: '20px 5px', color: '#e53e3e' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#e53e3e', marginBottom: '8px' }}>
                                                                {getVisualStatus(selectedSession) === 'revoked' ? 'block' : 'timer_off'}
                                                            </span>
                                                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>
                                                                {getVisualStatus(selectedSession) === 'revoked' ? 'CÓDIGO CANCELADO' : 'CÓDIGO EXPIRADO'}
                                                            </p>
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#718096' }}>
                                                                {getVisualStatus(selectedSession) === 'revoked' ? 'La sesión de asistencia fue revocada por la administración.' : 'La vigencia de 15 minutos ha concluido.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Datos Técnicos y Configuración IP */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                                        <tbody>
                                                            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                                                                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4a5568' }}>Fecha:</td>
                                                                <td style={{ padding: '6px 0', textAlign: 'right', color: '#1a202c', fontFamily: 'monospace' }}>{selectedSession.sessionDate}</td>
                                                            </tr>
                                                            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                                                                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4a5568' }}>Inicio:</td>
                                                                <td style={{ padding: '6px 0', textAlign: 'right', color: '#1a202c', fontFamily: 'monospace' }}>{selectedSession.startTime}</td>
                                                            </tr>
                                                            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                                                                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4a5568' }}>Expira:</td>
                                                                <td style={{ padding: '6px 0', textAlign: 'right', color: '#e53e3e', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                                    {new Date(selectedSession.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <div style={{ padding: '10px', background: '#f7fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '11px', display: 'block', color: '#4a5568', marginBottom: '4px' }}>
                                                            IP del Servidor (Red Local):
                                                        </label>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <input
                                                                type="text"
                                                                value={customIP}
                                                                onChange={(e) => setCustomIP(e.target.value)}
                                                                placeholder="Ej: 192.168.1.75"
                                                                style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    setCustomIP(serverLocalIP);
                                                                    alert(`Restaurado a la IP detectada: ${serverLocalIP}`);
                                                                }}
                                                                className="btn-primary"
                                                                style={{ padding: '5px 8px', fontSize: '10px', whiteSpace: 'nowrap', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                                                            >
                                                                Detectar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tabla de Asistentes en Tiempo Real */}
                                            <div style={{ marginTop: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <h5 style={{ color: '#001e3c', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                        <span className="material-symbols-outlined animate-pulse" style={{ color: '#48bb78', fontSize: '16px' }}>circle</span>
                                                        Docentes Registrados Hoy ({sessionAttendees.length})
                                                    </h5>
                                                    <button
                                                        onClick={() => handleExportCSV(selectedSession)}
                                                        disabled={sessionAttendees.length === 0}
                                                        className="btn-primary"
                                                        style={{ background: '#38a169', color: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span>
                                                        Exportar CSV
                                                    </button>
                                                </div>

                                                <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    <table className="custom-table" style={{ width: '100%', fontSize: '11px' }}>
                                                        <thead>
                                                            <tr>
                                                                <th>Nombre del Docente</th>
                                                                <th>NÚMERO DE CONTROL</th>
                                                                <th>Hora Registro</th>
                                                                <th>Estatus</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sessionAttendees.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="4" style={{ textAlign: 'center', color: '#718096', padding: '20px 0', fontStyle: 'italic' }}>
                                                                        Esperando pases de lista... Escanea el código QR desde el celular.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                sessionAttendees.map(att => {
                                                                    const user = att.userId || {};
                                                                    
                                                                    // Calcular estatus dinámico basado en la hora de inicio de la sesión
                                                                    let statusBadge = (
                                                                        <span style={{ 
                                                                            backgroundColor: '#e2e8f0', 
                                                                            color: '#475569', 
                                                                            padding: '2px 8px', 
                                                                            borderRadius: '4px', 
                                                                            fontWeight: 'bold', 
                                                                            fontSize: '10px'
                                                                        }}>
                                                                            Registrado
                                                                        </span>
                                                                    );
                                                                    
                                                                    if (att.attendanceTime && selectedSession?.startTime) {
                                                                        try {
                                                                            const [attHH, attMM] = att.attendanceTime.split(':').map(Number);
                                                                            const [startHH, startMM] = selectedSession.startTime.split(':').map(Number);
                                                                            const attTotalMinutes = attHH * 60 + attMM;
                                                                            const startTotalMinutes = startHH * 60 + startMM;
                                                                            
                                                                            // Tolerancia de 10 minutos para considerarse "A tiempo"
                                                                            if (attTotalMinutes <= startTotalMinutes + 10) {
                                                                                statusBadge = (
                                                                                    <span style={{ 
                                                                                        backgroundColor: '#c6f6d5', 
                                                                                        color: '#22543d', 
                                                                                        padding: '2px 8px', 
                                                                                        borderRadius: '4px', 
                                                                                        fontWeight: 'bold', 
                                                                                        fontSize: '10px'
                                                                                    }}>
                                                                                        A tiempo
                                                                                    </span>
                                                                                );
                                                                            } else {
                                                                                statusBadge = (
                                                                                    <span style={{ 
                                                                                        backgroundColor: '#feebc8', 
                                                                                        color: '#744210', 
                                                                                        padding: '2px 8px', 
                                                                                        borderRadius: '4px', 
                                                                                        fontWeight: 'bold', 
                                                                                        fontSize: '10px'
                                                                                    }}>
                                                                                        Retardo
                                                                                    </span>
                                                                                );
                                                                            }
                                                                        } catch (e) {
                                                                            console.error("Error al calcular estatus:", e);
                                                                        }
                                                                    }

                                                                    return (
                                                                        <tr key={att._id}>
                                                                            <td style={{ fontWeight: 'bold' }}>
                                                                                {`${user.nombres || ''} ${user.apPaterno || ''} ${user.apMaterno || ''}`.trim() || 'S/N'}
                                                                            </td>
                                                                            <td><code>{user.numeroControl || 'N/A'}</code></td>
                                                                            <td>{att.attendanceTime}</td>
                                                                            <td>
                                                                                {statusBadge}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="card-glass" style={{ padding: '50px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', color: '#718096' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: '#cbd5e0', marginBottom: '10px' }}>qr_code_scanner</span>
                                            <h4 style={{ color: '#2d3748', fontWeight: 'bold', margin: '0 0 5px 0' }}>Asistencia por QR</h4>
                                            <p style={{ maxWidth: '340px', margin: '0 auto', fontSize: '13px', color: '#718096', lineHeight: '1.4' }}>
                                                Presiona "Generar Código QR" en la columna de la izquierda para crear la sesión de asistencia diaria del curso.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reporte Oficial Imprimible */}
                            <div id="printable-report" className="card-glass" style={{ padding: '30px', background: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #001e3c', paddingBottom: '10px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#64748b', fontSize: '11px', fontWeight: '600', letterSpacing: '2px' }}>
                                            INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO
                                        </h4>
                                        <h3 style={{ margin: '5px 0 0', color: '#001e3c', fontSize: '18px', fontWeight: 'bold' }}>
                                            LISTA DE ASISTENCIA (QR) - FORMATO ITGAM-AC-005-08
                                        </h3>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-print-report no-print" 
                                        onClick={handlePrintReport}
                                    >
                                        <span className="material-symbols-outlined">print</span> Imprimir Lista
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px', fontSize: '13px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div><strong>Curso:</strong> {selectedEvent.title}</div>
                                    <div><strong>Clave:</strong> {selectedEvent.courseKey}</div>
                                    <div><strong>Facilitador:</strong> {selectedEvent.instructorName}</div>
                                    <div><strong>Periodo:</strong> {selectedEvent.period}</div>
                                    <div><strong>Horario:</strong> {selectedEvent.schedule}</div>
                                    <div><strong>Duración:</strong> {selectedEvent.duration} horas</div>
                                </div>

                                {attendanceReport && attendanceReport.users ? (
                                    <>
                                        <div className="table-responsive">
                                            <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                        <th style={{ width: '120px' }}>No. Control / RFC</th>
                                                        <th>Nombre del Docente</th>
                                                        <th style={{ width: '80px', textAlign: 'center' }}>Género</th>
                                                        {attendanceReport.weekdays?.map((dStr, idx) => {
                                                            const dateObj = new Date(dStr + "T00:00:00");
                                                            const formatted = dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                                                            const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
                                                            return (
                                                                <th key={idx} style={{ textAlign: 'center', width: '100px' }}>
                                                                    <div>{daysOfWeek[idx]}</div>
                                                                    <div style={{ fontSize: '9px', color: '#64748b' }}>{formatted}</div>
                                                                </th>
                                                            );
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceReport.users.map((u, uIdx) => (
                                                        <tr key={uIdx}>
                                                            <td><strong>{u.numeroControl}</strong></td>
                                                            <td>{u.nombre}</td>
                                                            <td style={{ textAlign: 'center' }}>{u.genero}</td>
                                                            {u.days?.map((status, dIdx) => (
                                                                <td key={dIdx} style={{ 
                                                                    textAlign: 'center', 
                                                                    fontWeight: 'bold',
                                                                    color: status === 'Presente' ? '#16a34a' : '#ef4444',
                                                                    backgroundColor: status === 'Presente' ? '#f0fdf4' : '#fef2f2'
                                                                }}>
                                                                    {status === 'Presente' ? '✓ Presente' : '✗ Falta'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', fontSize: '13px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                            <div><strong>Total Hombres:</strong> {attendanceReport.hombres}</div>
                                            <div><strong>Total Mujeres:</strong> {attendanceReport.mujeres}</div>
                                            <div><strong>Total Participantes:</strong> {attendanceReport.total}</div>
                                        </div>

                                        {/* Firmas Oficiales para la impresión */}
                                        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px', borderTop: '0px' }}>
                                            <div style={{ borderTop: '1px solid #000', width: '220px', textAlign: 'center', paddingTop: '8px' }}>
                                                <strong style={{ fontSize: '11px', display: 'block' }}>{selectedEvent.instructorName}</strong>
                                                <span style={{ fontSize: '10px', color: '#64748b' }}>Firma del Facilitador</span>
                                            </div>
                                            <div style={{ borderTop: '1px solid #000', width: '220px', textAlign: 'center', paddingTop: '8px' }}>
                                                <strong style={{ fontSize: '11px', display: 'block' }}>SUBDIRECCIÓN ACADÉMICA</strong>
                                                <span style={{ fontSize: '10px', color: '#64748b' }}>Sello y Firma de Autorización</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p>Cargando información de la lista de asistencia...</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#64748b' }}>Crea un curso primero en la pestaña "Gestionar Cursos".</p>
                    )}
                </>
            )}
        </div>
    );
};

const ConstanciaPreview = ({ docente, curso, periodo, duracion, fecha }) => {
    return (
        <div className="constancia-container" style={{
            fontFamily: "'Outfit', 'Georgia', serif",
            border: '18px double #001e3c',
            padding: '40px',
            backgroundColor: '#ffffff',
            position: 'relative',
            color: '#1e293b',
            maxWidth: '850px',
            margin: '0 auto',
            minHeight: '580px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'center'
        }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '30px', height: '30px', borderTop: '4px solid #001e3c', borderLeft: '4px solid #001e3c' }}></div>
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderTop: '4px solid #001e3c', borderRight: '4px solid #001e3c' }}></div>
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '30px', height: '30px', borderBottom: '4px solid #001e3c', borderLeft: '4px solid #001e3c' }}></div>
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '30px', height: '30px', borderBottom: '4px solid #001e3c', borderRight: '4px solid #001e3c' }}></div>

            <div style={{ width: '100%' }}>
                <h4 style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', letterSpacing: '2px', margin: '0 0 5px 0' }}>
                    TECNOLÓGICO NACIONAL DE MÉXICO
                </h4>
                <h2 style={{ color: '#001e3c', fontSize: '20px', fontWeight: 'bold', margin: '0 0 25px 0' }}>
                    INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO
                </h2>
                <div style={{ width: '80px', height: '2px', backgroundColor: '#e2e8f0', margin: '0 auto 20px auto' }}></div>
            </div>

            <div style={{ padding: '0 20px' }}>
                <p style={{ fontStyle: 'italic', fontSize: '16px', color: '#475569', margin: '0 0 15px 0' }}>
                    Otorga la presente
                </p>
                <h1 style={{ color: '#001e3c', fontSize: '38px', fontWeight: '800', letterSpacing: '4px', margin: '0 0 20px 0', fontFamily: 'Georgia, serif' }}>
                    CONSTANCIA
                </h1>
                <p style={{ fontSize: '16px', color: '#475569', margin: '0 0 10px 0' }}>
                    a:
                </p>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #94a3b8', display: 'inline-block', paddingBottom: '5px', marginBottom: '20px', textTransform: 'uppercase' }}>
                    {docente}
                </h3>
                <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
                    Por haber acreditado satisfactoriamente el curso de capacitación docente denominado:<br />
                    <strong style={{ color: '#001e3c', fontSize: '18px', display: 'block', margin: '10px 0', textTransform: 'uppercase' }}>
                        "{curso}"
                    </strong>
                    realizado durante el período del <strong>{periodo}</strong>, con una duración total de <strong>{duracion}</strong> horas.
                </p>
            </div>

            <div style={{ width: '100%', marginTop: '30px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginBottom: '40px' }}>
                    Gustavo A. Madero, CDMX, a {fecha}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ width: '200px', textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px' }}>
                            <strong style={{ fontSize: '12px', display: 'block', color: '#0f172a' }}>
                                DR. JOSÉ ANTONIO RODRÍGUEZ
                            </strong>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                                Director del Instituto
                            </span>
                        </div>
                    </div>

                    <div style={{ width: '200px', textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px' }}>
                            <strong style={{ fontSize: '12px', display: 'block', color: '#0f172a' }}>
                                M.C. BEATRIZ GÓMEZ PATRÓN
                            </strong>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                                Subdirectora Académica
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CedulaAdmin;
