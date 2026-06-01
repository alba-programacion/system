import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";
import logoITGAM from "../assets/logo1.jpg";
import OpinionSurvey from "../components/OpinionSurvey";
import CedulaInscripcion from "../components/CedulaInscripcion";
import EficaciaSurvey from "../components/EficaciaSurvey";
import EficaciaEstudianteSurvey from "../components/EficaciaEstudianteSurvey";
import "../styles/DashboardProfesor.css";

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

// Interceptor para agregar automáticamente el token Bearer a todas las peticiones con axios estándar en este componente
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default function DashboardProfesor() {
  const userId = localStorage.getItem("usuarioId");
  const [activeTab, setActiveTab] = useState("cedula");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courseKey, setCourseKey] = useState("");
  const [courseData, setCourseData] = useState(null);
  
  const isInstructor = courseData && (
    courseData.instructor === userId || 
    (courseData.instructor && courseData.instructor._id === userId)
  );

  // Auto-align activeTab depending on isInstructor role for selected course
  useEffect(() => {
    // Restricciones desactivadas temporalmente para pruebas del control QR
  }, [courseData, activeTab, userId]);

  const [userData, setUserData] = useState(null);
  const [personalData, setPersonalData] = useState({
    nombres: localStorage.getItem("nombreUsuario") || "",
    apellidos: "",
    genero: "Masculino"
  });
  const [laborData, setLaborData] = useState({
    puesto: "",
    departamento: "",
    institucion: "ITGAM"
  });
  const [loading, setLoading] = useState(false);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [cedulaData, setCedulaData] = useState(null);
  const [surveyData, setSurveyData] = useState(null);
  const [eficaciaData, setEficaciaData] = useState(null);
  const [eficaciaEstudianteData, setEficaciaEstudianteData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanningError, setScanningError] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const [myDetailedRecords, setMyDetailedRecords] = useState([]);

  // Instructor upload feature states
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [selectedInstructorCourseId, setSelectedInstructorCourseId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [courseEvidences, setCourseEvidences] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});

  // Cargar cursos disponibles al iniciar
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/admin/events?type=course`);
        setAvailableCourses(res.data);
        // SI NO HAY CURSO ACTIVO, AUTO-SELECCIONAR EL PRIMERO PARA PRUEBAS
        if (!courseData && res.data.length > 0) {
          setCourseData(res.data[0]);
          setCourseKey(res.data[0].courseKey || "");
        }
      } catch (error) {
        console.error("Error al cargar cursos:", error);
      }
    };
    fetchCourses();
  }, []);

  // Cargar datos iniciales del profesor si existen
  useEffect(() => {
    const fetchProfesorData = async () => {
      const userId = localStorage.getItem("usuarioId");
      if (!userId) return;
      try {
        const res = await axios.get(`${BASE_URL}/auth/user/${userId}`);
        if (res.data) {
          setUserData(res.data);
          setPersonalData({
            nombres: res.data.nombres || "",
            apellidos: `${res.data.apPaterno} ${res.data.apMaterno}` || "",
            genero: res.data.genero || "Masculino"
          });
          if (res.data.datosLaborales) {
            setLaborData(res.data.datosLaborales);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del profesor:", error);
      }

      // Cargar cursos donde este profesor es instructor y la subida de evidencias está habilitada
      try {
        const res = await axios.get(`${BASE_URL}/admin/events?type=course&instructor=${userId}&evidenceUploadEnabled=true`);
        setInstructorCourses(res.data);
        if (res.data.length > 0) {
          setSelectedInstructorCourseId(res.data[0]._id);
        }
      } catch (error) {
        console.error("Error al cargar cursos del instructor:", error);
      }
    };
    fetchProfesorData();
  }, []);

  const fetchParticipantsAndEvidences = async (courseId) => {
    if (!courseId) return;
    const course = instructorCourses.find(c => c._id === courseId);
    if (!course) return;
    setLoading(true);
    try {
      const [cedulasRes, evidencesRes] = await Promise.all([
        axios.get(`${BASE_URL}/cedulas/event/${courseId}`),
        axios.get(`${BASE_URL}/evidencias?descripcion=${course.courseKey}`)
      ]);
      setParticipants(cedulasRes.data);
      setCourseEvidences(evidencesRes.data);
    } catch (err) {
      console.error("Error al cargar participantes o evidencias:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvidenceForParticipant = async (participantUserId) => {
    const file = selectedFiles[participantUserId];
    if (!file) return;
    const course = instructorCourses.find(c => c._id === selectedInstructorCourseId);
    if (!course) return;

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("usuarioId", participantUserId);
    formData.append("tipo", "Curso de Capacitación");
    formData.append("descripcion", `Curso: ${course.title} (Clave: ${course.courseKey})`);

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/evidencias/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      alert("Evidencia subida correctamente en nombre del docente.");
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[participantUserId];
        return next;
      });
      await fetchParticipantsAndEvidences(selectedInstructorCourseId);
    } catch (error) {
      console.error("Error al subir evidencia:", error);
      alert(error.response?.data?.message || "Error al subir la evidencia.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta evidencia?")) return;
    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/evidencias/${evidenceId}`);
      alert("Evidencia eliminada correctamente.");
      await fetchParticipantsAndEvidences(selectedInstructorCourseId);
    } catch (error) {
      console.error("Error al eliminar evidencia:", error);
      alert("No se pudo eliminar la evidencia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "evidencias_participantes" && selectedInstructorCourseId) {
      fetchParticipantsAndEvidences(selectedInstructorCourseId);
    }
  }, [activeTab, selectedInstructorCourseId]);

  // Cargar curso guardado de localStorage al iniciar
  useEffect(() => {
    const savedCourse = localStorage.getItem("activeCourseData");
    if (savedCourse) {
      try {
        const parsed = JSON.parse(savedCourse);
        const userId = localStorage.getItem("usuarioId");
        
        const verifyCourse = async () => {
          if (!parsed.courseKey) return;
          try {
            const res = await axios.get(`${BASE_URL}/admin/events/clave/${parsed.courseKey}`);
            setCourseData(res.data);
            setCourseKey(res.data.courseKey || "");
            if (userId) {
              fetchCedula(userId, res.data._id);
              fetchSurvey(userId, res.data._id);
              fetchEficacia(userId, res.data._id);
              fetchEficaciaEstudiante(userId, res.data._id);
            }
          } catch (err) {
            console.warn("El curso guardado localmente ya no existe en la base de datos actual. Limpiando cache...", err);
            localStorage.removeItem("activeCourseData");
            setCourseData(null);
            setCourseKey("");
            setCedulaData(null);
            setSurveyData(null);
            setEficaciaData(null);
            setEficaciaEstudianteData(null);
          }
        };
        verifyCourse();
      } catch (e) {
        console.error(e);
        localStorage.removeItem("activeCourseData");
      }
    }
  }, []);

  // Efecto para inicializar la cámara cuando el scanner esté abierto con procesamiento jsQR real
  useEffect(() => {
    let streamObj = null;
    let animationFrameId = null;
    let isActive = true;

    if (showScanner) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          if (!isActive) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          streamObj = stream;
          const video = document.getElementById("scanner-video");
          if (video) {
            video.srcObject = stream;
            video.setAttribute("playsinline", "true");
            video.play();

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            const scanFrame = () => {
              if (!isActive) return;
              if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "dontInvert",
                });

                if (code) {
                  // Se detectó código QR
                  try {
                    const token = code.data.split("/asistencia/").pop();
                    if (token) {
                      isActive = false;
                      if (streamObj) {
                        streamObj.getTracks().forEach(track => track.stop());
                      }
                      handleScanQRSuccess(token);
                      return;
                    }
                  } catch (e) {
                    console.error("Error al procesar token del QR:", e);
                  }
                }
              }
              animationFrameId = requestAnimationFrame(scanFrame);
            };

            animationFrameId = requestAnimationFrame(scanFrame);
          }
        })
        .catch(err => {
          console.warn("Cámara no disponible o permisos denegados:", err);
          setScanningError("No se pudo acceder a la cámara. Asegúrate de otorgar los permisos necesarios en tu navegador.");
        });
    }
    return () => {
      isActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (streamObj) {
        streamObj.getTracks().forEach(track => track.stop());
      }
    };
  }, [showScanner]);

  const fetchCedula = async (userId, eventId) => {
    try {
      const res = await axios.get(`${BASE_URL}/cedulas/user/${userId}/event/${eventId}`);
      if (res.data) {
        setCedulaData(res.data);
      } else {
        setCedulaData(null);
      }
    } catch (error) {
      setCedulaData(null);
    }
  };

  const fetchSurvey = async (userId, eventId) => {
    try {
      const res = await axios.get(`${BASE_URL}/surveys/user/${userId}/event/${eventId}/type/opinion`);
      if (res.data) {
        setSurveyData(res.data);
      } else {
        setSurveyData(null);
      }
    } catch (error) {
      setSurveyData(null);
    }
  };

  const fetchEficacia = async (userId, eventId) => {
    try {
      const res = await axios.get(`${BASE_URL}/surveys/user/${userId}/event/${eventId}/type/eficacia_profesor`);
      if (res.data) {
        setEficaciaData(res.data);
      } else {
        setEficaciaData(null);
      }
    } catch (error) {
      setEficaciaData(null);
    }
  };

  const fetchEficaciaEstudiante = async (userId, eventId) => {
    try {
      const res = await axios.get(`${BASE_URL}/surveys/user/${userId}/event/${eventId}/type/eficacia_estudiante`);
      if (res.data) {
        setEficaciaEstudianteData(res.data);
      } else {
        setEficaciaEstudianteData(null);
      }
    } catch (error) {
      setEficaciaEstudianteData(null);
    }
  };

  const handleLookupCourse = async () => {
    if (!courseKey) return alert("Ingresa una clave de curso");
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/events/clave/${courseKey}`);
      setCourseData(res.data);
      localStorage.setItem("activeCourseData", JSON.stringify(res.data));
      const userId = localStorage.getItem("usuarioId");
      if (userId) {
        await fetchCedula(userId, res.data._id);
        await fetchSurvey(userId, res.data._id);
        await fetchEficacia(userId, res.data._id);
        await fetchEficaciaEstudiante(userId, res.data._id);
      }
    } catch (error) {
      alert("Curso no encontrado. Verifica la clave.");
      setCourseData(null);
      localStorage.removeItem("activeCourseData");
      setCedulaData(null);
      setSurveyData(null);
      setEficaciaData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCedulaData = async (cedulaPayload) => {
    const userId = localStorage.getItem("usuarioId");
    const eventId = courseData?._id;
    if (!userId || !eventId) {
      alert("Falta el identificador de usuario o de curso.");
      return false;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/cedulas`, {
        userId,
        eventId,
        ...cedulaPayload
      });
      if (res.data) {
        setCedulaData(res.data.cedula);
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      alert("Error al guardar datos de la cédula");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudentEvidence = async (fileUrl, fileName) => {
    const userId = localStorage.getItem("usuarioId");
    const eventId = courseData?._id;
    if (!userId || !eventId) {
      alert("Falta el identificador de usuario o de curso.");
      return false;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/cedulas`, {
        userId,
        eventId,
        personalData: cedulaData?.personalData,
        laborData: cedulaData?.laborData,
        signature: cedulaData?.signature,
        evidenceUrl: fileUrl,
        evidenceName: fileName
      });
      if (res.data) {
        setCedulaData(res.data.cedula);
        alert("Evidencia vinculada exitosamente.");
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      alert("Error al guardar datos de la evidencia");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudentEvidence = async () => {
    if (!window.confirm("¿Estás seguro de eliminar tu archivo de evidencia?")) return;
    const userId = localStorage.getItem("usuarioId");
    const eventId = courseData?._id;
    if (!userId || !eventId) {
      alert("Falta el identificador de usuario o de curso.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/cedulas`, {
        userId,
        eventId,
        personalData: cedulaData?.personalData,
        laborData: cedulaData?.laborData,
        signature: cedulaData?.signature,
        evidenceUrl: "",
        evidenceName: ""
      });
      if (res.data) {
        setCedulaData(res.data.cedula);
        alert("Evidencia eliminada exitosamente.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la evidencia.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSurveyData = async (surveyPayload) => {
    const userId = localStorage.getItem("usuarioId");
    const eventId = courseData?._id;
    if (!userId || !eventId) {
      alert("Falta el identificador de usuario o de curso.");
      return false;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/surveys`, {
        userId,
        eventId,
        ...surveyPayload
      });
      if (res.data) {
        setSurveyData(res.data.survey);
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      alert("Error al guardar datos de la encuesta de opinión.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEficaciaData = async (payload) => {
    const userId = localStorage.getItem("usuarioId");
    const eventId = courseData?._id;
    if (!userId || !eventId) {
      alert("Falta el identificador de usuario o de curso.");
      return false;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/surveys`, {
        userId,
        eventId,
        ...payload
      });
      if (res.data) {
        setEficaciaData(res.data.survey);
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      alert("Error al guardar datos de la encuesta de eficacia.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEficaciaEstudianteData = async (payload) => {
    const userId = localStorage.getItem("usuarioId");
    const eventId = courseData?._id;
    if (!userId || !eventId) {
      alert("Falta el identificador de usuario o de curso.");
      return false;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/surveys`, {
        userId,
        eventId,
        ...payload
      });
      if (res.data) {
        setEficaciaEstudianteData(res.data.survey);
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      alert("Error al guardar datos de la encuesta de eficacia (Estudiante).");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    if (!courseData?._id) return;
    try {
      const res = await axios.get(`${BASE_URL}/attendance/report/${courseData._id}`);
      setAttendanceReport(res.data);

      const recordsRes = await axios.get(`${BASE_URL}/attendance/my-records/${courseData._id}`);
      setMyDetailedRecords(recordsRes.data || []);
    } catch (error) {
      console.error("Error al cargar reporte:", error);
    }
  };

  const handleScanQRSuccess = async (scannedToken) => {
    try {
      setScanningError("");
      
      const userAgent = navigator.userAgent || "Navegador Web";
      let device = "Dispositivo Web";
      if (/Android/i.test(userAgent)) device = "Android Mobile";
      else if (/iPhone|iPad|iPod/i.test(userAgent)) device = "iOS Mobile";
      else if (/Windows/i.test(userAgent)) device = "PC Windows";
      else if (/Macintosh/i.test(userAgent)) device = "Mac OS";

      const res = await axios.post(`${BASE_URL}/attendance/asistencia/registrar`, {
        token: scannedToken,
        deviceInfo: `${device} (Escáner Cámara)`
      });
      
      if (res.data) {
        setScanSuccess(true);
        setShowScanner(false);
        await fetchReport();
      }
    } catch (error) {
      console.error("Error registrando asistencia por QR real:", error);
      setScanningError(error.response?.data?.error || error.response?.data?.message || "Código QR inválido o expirado. Intenta de nuevo.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="profesor-dashboard">
      {/* Barra superior (Navbar) móvil */}
      <div className="mobile-top-bar no-print">
        <button type="button" className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="mobile-brand">
          <img src={logoITGAM} alt="Logo ITGAM" />
          <span>ITGAM Docente</span>
        </div>
      </div>

      {/* Backdrop / Overlay para cerrar el cajón flotante en móviles */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop no-print" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`prof-sidebar no-print ${isSidebarOpen ? "open" : ""}`}>
        <div className="prof-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative' }}>
          {/* Botón de cierre para móviles */}
          <button type="button" className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={logoITGAM} alt="Logo ITGAM" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'contain', border: '2px solid #ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', backgroundColor: '#ffffff' }} />
          <h1 style={{ fontSize: '18px', color: '#ffffff', margin: 0, fontWeight: 'bold' }}>ITGAM Docente</h1>
        </div>
        <nav className="prof-nav">
          {courseData ? (
            isInstructor ? (
              <>
                <button className={activeTab === "evidencias_participantes" ? "active" : ""} onClick={() => { setActiveTab("evidencias_participantes"); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">upload_file</span> Evidencias de Participantes
                </button>
                <button className={activeTab === "asistencia" ? "active" : ""} onClick={() => { setActiveTab("asistencia"); fetchReport(); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">event_note</span> Reporte de Asistencia
                </button>
              </>
            ) : (
              <>
                <button className={activeTab === "cedula" ? "active" : ""} onClick={() => { setActiveTab("cedula"); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">assignment</span> Cédula de inscripción
                </button>
                <button className={activeTab === "formatos" ? "active" : ""} onClick={() => { setActiveTab("formatos"); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">rate_review</span> Encuesta de opinión
                </button>
                <button className={activeTab === "eficacia" ? "active" : ""} onClick={() => { setActiveTab("eficacia"); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">analytics</span> Encuesta de eficacia
                </button>
                <button className={activeTab === "eficacia_estudiante" ? "active" : ""} onClick={() => { setActiveTab("eficacia_estudiante"); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">assessment</span> Encuesta de eficacia (Estudiante)
                </button>
                <button className={activeTab === "subir_evidencia" ? "active" : ""} onClick={() => { setActiveTab("subir_evidencia"); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">cloud_upload</span> Subir mi evidencia
                </button>
                <button className={activeTab === "asistencia" ? "active" : ""} onClick={() => { setActiveTab("asistencia"); fetchReport(); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">qr_code_2</span> Lista de asistencia (con QR)
                </button>
              </>
            )
          ) : (
            <>
              <button className={activeTab === "cedula" ? "active" : ""} onClick={() => { setActiveTab("cedula"); setIsSidebarOpen(false); }}>
                <span className="material-symbols-outlined">assignment</span> Cédula de inscripción
              </button>
              {instructorCourses.length > 0 && (
                <button className={activeTab === "evidencias_participantes" ? "active" : ""} onClick={() => { setActiveTab("evidencias_participantes"); setIsSidebarOpen(false); }}>
                  <span className="material-symbols-outlined">upload_file</span> Evidencias de Participantes
                </button>
              )}
            </>
          )}
        </nav>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
          <span className="material-symbols-outlined">logout</span> Cerrar Sesión
        </button>
      </aside>

      <main className="prof-content">
        <header className="prof-header no-print">
          <h2>Panel de Gestión Docente</h2>
          <div className="user-pill">
            <span>{personalData.nombres}</span>
            <div className="avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </div>
        </header>

        <div className="tab-container">
          {activeTab === "cedula" && (
            <section className="animate-fade-in">
              <div className="dashboard-form-container">
                <div className="card-glass no-print">
                <h3>Vincular Curso</h3>
                <p>Ingresa la clave proporcionada por la administración para cargar los datos del evento y rellenar tu Cédula de Inscripción.</p>
                <div className="search-box">
                  {availableCourses && availableCourses.length > 0 && (
                    <select
                      value={courseKey}
                      onChange={(e) => setCourseKey(e.target.value)}
                      className="course-select-input"
                    >
                      <option value="">-- Selecciona un curso --</option>
                      {availableCourses.map((c) => (
                        <option key={c._id} value={c.courseKey}>
                          {c.courseKey} - {c.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <input 
                    type="text" 
                    placeholder="Clave del curso (Ej: CURSO-101)" 
                    value={courseKey}
                    onChange={(e) => setCourseKey(e.target.value)}
                  />
                  <button onClick={handleLookupCourse} disabled={loading}>
                    {loading ? "Buscando..." : "Cargar Datos"}
                  </button>
                </div>
              </div>

              {courseData ? (
                <div className="animate-slide-up" style={{ marginTop: '20px' }}>
                  <button 
                    onClick={() => { 
                      setCourseData(null); 
                      setCourseKey(""); 
                      setCedulaData(null); 
                      setSurveyData(null); 
                      localStorage.removeItem("activeCourseData");
                    }} 
                    className="btn-secondary no-print"
                    style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    ← Vincular otro curso
                  </button>
                  <div className="cedula-scroll-wrapper" style={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <CedulaInscripcion 
                      courseData={courseData}
                      userData={userData}
                      cedulaData={cedulaData}
                      onSave={handleSaveCedulaData}
                      onPrint={handlePrint}
                    />
                  </div>
                </div>
              ) : (
                <div className="no-print" style={{ marginTop: '20px' }}>
                  <div className="empty-state">
                    <span className="material-symbols-outlined">assignment</span>
                    <p>Por favor, ingresa una clave de curso o selecciona uno de la lista inferior para habilitar y rellenar tu Cédula de Inscripción.</p>
                  </div>

                  {availableCourses.length > 0 && (
                    <div className="card-glass" style={{ marginTop: '25px', padding: '20px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#001e3c', fontWeight: 'bold' }}>Cursos Disponibles en el Sistema</h4>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Clave</th>
                              <th>Nombre del Curso</th>
                              <th>Instructor</th>
                              <th>Horario / Duración</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableCourses.map((c) => (
                              <tr key={c._id}>
                                <td style={{ fontWeight: 'bold', color: '#001e3c' }}>{c.courseKey}</td>
                                <td>{c.title}</td>
                                <td>{c.instructorName}</td>
                                <td>{c.schedule} ({c.duration})</td>
                                <td>
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'inline-block' }}
                                    onClick={async () => {
                                      setCourseKey(c.courseKey);
                                      setCourseData(c);
                                      localStorage.setItem("activeCourseData", JSON.stringify(c));
                                      const userId = localStorage.getItem("usuarioId");
                                      if (userId) {
                                        await fetchCedula(userId, c._id);
                                        await fetchSurvey(userId, c._id);
                                      }
                                    }}
                                  >
                                    Vincular
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            </section>
          )}

          {activeTab === "asistencia" && (
            <section className="attendance-view animate-fade-in">
              {!courseData ? (
                <div className="empty-state no-print">
                  <span className="material-symbols-outlined">warning</span>
                  <p>Primero debes cargar un curso en la sección "Cédula de inscripción".</p>
                </div>
              ) : (
                <>
                  <div className="card-glass attendance-intro no-print" style={{ padding: "24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "#001e3c" }}>Lista de Asistencia (ITGAM-AC-005-08)</h3>
                      <p style={{ margin: "8px 0 0", color: "#555" }}>Escanea el código QR diario para registrar tu asistencia en el curso activo.</p>
                      <div className="course-badge" style={{ marginTop: "12px", display: "inline-block", backgroundColor: "#001e3c", color: "#fff", padding: "6px 12px", borderRadius: "20px", fontSize: "12px" }}>
                        {courseData.title}
                      </div>
                    </div>
                    <button className="btn-primary" style={{ padding: "12px 24px", borderRadius: "30px", fontWeight: "bold" }} onClick={() => { setShowScanner(true); setScanningError(""); }}>
                      <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: "8px" }}>qr_code_scanner</span>
                      Registrar mi Asistencia
                    </button>
                  </div>

                  <div className="card-glass my-attendance-grid printable">
                    <h3 style={{ color: "#001e3c", marginBottom: "20px", borderBottom: "2px solid #eaeaea", paddingBottom: "10px" }}>Mi Registro Semanal de Asistencia</h3>
                    
                    {attendanceReport ? (() => {
                      const myRecord = attendanceReport.users?.find(u => u.userId === localStorage.getItem("usuarioId"));
                      const weekdaysNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
                      
                      return (
                        <div>
                          <div className="attendance-days-row" style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "space-between" }}>
                            {attendanceReport.weekdays?.map((dStr, idx) => {
                              const isPresent = myRecord?.days?.[idx] === "Presente";
                              
                              // Formatear fecha
                              const dateObj = new Date(dStr + "T00:00:00");
                              const formattedDate = dateObj.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
                              
                              return (
                                <div key={idx} className="attendance-day-card" style={{
                                  flex: "1 1 120px",
                                  backgroundColor: isPresent ? "#e8f5e9" : "#fafafa",
                                  border: isPresent ? "1px dashed #2e7d32" : "1px solid #e0e0e0",
                                  borderRadius: "12px",
                                  padding: "15px",
                                  textAlign: "center"
                                }}>
                                  <span style={{ fontWeight: "bold", display: "block", color: "#001e3c", fontSize: "14px" }}>
                                    {weekdaysNames[idx] || ""}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "#777", display: "block", marginBottom: "10px" }}>
                                    {formattedDate}
                                  </span>
                                  <div style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px",
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    backgroundColor: isPresent ? "#2e7d32" : "#757575",
                                    color: "#fff"
                                  }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                      {isPresent ? "check_circle" : "cancel"}
                                    </span>
                                    {isPresent ? "Presente" : "Falta"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ marginTop: "25px", padding: "15px", borderRadius: "8px", backgroundColor: "#f9f9f9", borderLeft: "4px solid #001e3c" }}>
                             <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                               * La asistencia se valida diariamente mediante el escaneo del código QR vigente proyectado por el administrador.
                             </p>
                           </div>

                           {/* Historial Detallado de Check-Ins QR en Tiempo Real */}
                           <div style={{ marginTop: "35px" }}>
                             <h4 style={{ color: "#001e3c", marginBottom: "15px", fontWeight: "bold", borderBottom: "1px solid #eaeaea", paddingBottom: "10px", fontSize: "14px" }}>
                               Historial Detallado de Mis Asistencias QR
                             </h4>
                             
                             {myDetailedRecords.length === 0 ? (
                               <p style={{ color: "#777", fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                                 Aún no has registrado pases de lista QR para este curso.
                               </p>
                             ) : (
                               <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto" }}>
                                 <table className="custom-table" style={{ width: "100%", fontSize: "11px" }}>
                                   <thead>
                                     <tr>
                                       <th>Fecha</th>
                                       <th>Hora Registro</th>
                                       <th>Curso</th>
                                       <th>Estatus</th>
                                       <th>IP</th>
                                       <th>Dispositivo</th>
                                     </tr>
                                   </thead>
                                   <tbody>
                                     {myDetailedRecords.map(att => {
                                       // Estatus dinámico
                                       let statusBadge = (
                                         <span style={{ 
                                           backgroundColor: "#e2e8f0", 
                                           color: "#475569", 
                                           padding: "2px 8px", 
                                           borderRadius: "4px", 
                                           fontWeight: "bold", 
                                           fontSize: "10px"
                                         }}>
                                           Registrado
                                         </span>
                                       );
                                       
                                       if (att.attendanceTime && att.sessionId?.startTime) {
                                         try {
                                           const [attHH, attMM] = att.attendanceTime.split(':').map(Number);
                                           const [startHH, startMM] = att.sessionId.startTime.split(':').map(Number);
                                           const attTotalMinutes = attHH * 60 + attMM;
                                           const startTotalMinutes = startHH * 60 + startMM;
                                           
                                           if (attTotalMinutes <= startTotalMinutes + 10) {
                                             statusBadge = (
                                               <span style={{ 
                                                 backgroundColor: "#c6f6d5", 
                                                 color: "#22543d", 
                                                 padding: "2px 8px", 
                                                 borderRadius: "4px", 
                                                 fontWeight: "bold", 
                                                 fontSize: "10px"
                                               }}>
                                                 A tiempo
                                               </span>
                                             );
                                           } else {
                                             statusBadge = (
                                               <span style={{ 
                                                 backgroundColor: "#feebc8", 
                                                 color: "#744210", 
                                                 padding: "2px 8px", 
                                                 borderRadius: "4px", 
                                                 fontWeight: "bold", 
                                                 fontSize: "10px"
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
                                           <td style={{ fontWeight: "bold" }}>{att.attendanceDate}</td>
                                           <td style={{ fontFamily: "monospace" }}>{att.attendanceTime}</td>
                                           <td>{att.courseId?.title || "Curso de Capacitación"}</td>
                                           <td>{statusBadge}</td>
                                           <td style={{ color: "#777" }}><code>{att.ipAddress || "Desconocida"}</code></td>
                                           <td style={{ color: "#777" }}>{att.deviceInfo || "Desconocido"}</td>
                                         </tr>
                                       );
                                     })}
                                   </tbody>
                                 </table>
                               </div>
                             )}
                           </div>
                         </div>
                       );
                    })() : (
                      <p>Cargando información de asistencia...</p>
                    )}
                  </div>

                  {/* MODAL DEL ESCÁNER QR */}
                  {showScanner && (
                    <div className="custom-modal-overlay no-print" style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      zIndex: 2000,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center"
                    }}>
                      <div className="card-glass" style={{
                        maxWidth: "450px",
                        width: "90%",
                        padding: "25px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <h3 style={{ margin: 0, color: "#001e3c" }}>Escáner de Asistencia</h3>
                          <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setShowScanner(false)}>
                            <span className="material-symbols-outlined" style={{ color: "#777" }}>close</span>
                          </button>
                        </div>

                        <div className="scanner-container" style={{ position: "relative", width: "100%", height: "240px", backgroundColor: "#000", borderRadius: "12px", overflow: "hidden", marginBottom: "15px" }}>
                          <video id="scanner-video" autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }}></video>
                          
                          {/* Laser effect */}
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "4px",
                            background: "linear-gradient(to right, transparent, #ef4444, transparent)",
                            boxShadow: "0 0 8px #ef4444",
                            animation: "scan-laser 2s linear infinite"
                          }}></div>

                          {/* Target frame */}
                          <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "160px",
                            height: "160px",
                            border: "2px dashed #ffffff",
                            borderRadius: "16px",
                            opacity: 0.8
                          }}></div>
                        </div>

                        {scanningError && (
                          <div style={{ padding: "10px 15px", backgroundColor: "#ffebee", borderLeft: "4px solid #c62828", borderRadius: "4px", color: "#c62828", fontSize: "13px", marginBottom: "15px" }}>
                            {scanningError}
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#4b5563", textAlign: "center", lineHeight: "1.5" }}>
                            <strong>Instrucciones:</strong> Apunta la cámara de tu dispositivo hacia el código QR proyectado por el administrador para escanear y registrar tu asistencia de forma automática.
                          </p>
                          <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowScanner(false)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODAL DE ÉXITO PREMIUM */}
                  {scanSuccess && (
                    <div className="custom-modal-overlay no-print" style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(4px)",
                      zIndex: 2000,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center"
                    }}>
                      <div className="card-glass animate-scale-up" style={{
                        maxWidth: "400px",
                        width: "90%",
                        padding: "35px 40px",
                        backgroundColor: "#ffffff",
                        textAlign: "center",
                        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                        borderRadius: "16px",
                        border: "3px solid #10b981",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                        {/* Logo de Agua Centrado en el Fondo */}
                        <img 
                          src={logoITGAM} 
                          alt="Watermark ITGAM" 
                          style={{ 
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '240px', 
                            height: '240px', 
                            objectFit: 'contain',
                            opacity: 0.08,
                            pointerEvents: 'none',
                            zIndex: 0
                          }} 
                        />

                        {/* Contenido en Primer Plano */}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          {/* Palomita Verde de Éxito */}
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{
                              width: '72px',
                              height: '72px',
                              borderRadius: '50%',
                              backgroundColor: '#e8f5e9',
                              border: '3px solid #10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                            }}>
                              <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '42px', fontWeight: 'bold' }}>check</span>
                            </div>
                          </div>

                          <h3 style={{ color: '#064e3b', fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>
                            Asistencia Registrada
                          </h3>
                          <p style={{ color: '#047857', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                            Tu asistencia para el día de hoy ha sido guardada exitosamente en el sistema de control escolar de ITGAM.
                          </p>
                          <button
                            onClick={() => setScanSuccess(false)}
                            style={{
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              padding: '10px 32px',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                          >
                            Entendido
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeTab === "formatos" && (
            <section className="formatos-view animate-fade-in text-left">
              <div className="dashboard-form-container">
                {!courseData ? (
                <div className="no-print">
                  <div className="card-glass">
                    <h3>Selecciona un Curso para la Encuesta de Opinión</h3>
                    <p>Por favor, ingresa la clave de tu curso o selecciónalo de la lista para poder contestar el Formato ITGAM-AC-005-09.</p>
                     <div className="search-box" style={{ marginTop: '15px' }}>
                      {availableCourses && availableCourses.length > 0 && (
                        <select
                          value={courseKey}
                          onChange={(e) => setCourseKey(e.target.value)}
                          className="course-select-input"
                        >
                          <option value="">-- Selecciona un curso --</option>
                          {availableCourses.map((c) => (
                            <option key={c._id} value={c.courseKey}>
                              {c.courseKey} - {c.title}
                            </option>
                          ))}
                        </select>
                      )}
                      <input 
                        type="text" 
                        placeholder="Clave del curso (Ej: CURSO-101)" 
                        value={courseKey}
                        onChange={(e) => setCourseKey(e.target.value)}
                      />
                      <button onClick={handleLookupCourse} disabled={loading}>
                        {loading ? "Buscando..." : "Cargar Datos"}
                      </button>
                    </div>
                  </div>

                  {availableCourses.length > 0 && (
                    <div className="card-glass" style={{ marginTop: '25px', padding: '20px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#001e3c', fontWeight: 'bold' }}>Cursos Disponibles en el Sistema</h4>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Clave</th>
                              <th>Nombre del Curso</th>
                              <th>Instructor</th>
                              <th>Horario / Duración</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableCourses.map((c) => (
                              <tr key={c._id}>
                                <td style={{ fontWeight: 'bold', color: '#001e3c' }}>{c.courseKey}</td>
                                <td>{c.title}</td>
                                <td>{c.instructorName}</td>
                                <td>{c.schedule} ({c.duration})</td>
                                <td>
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'inline-block' }}
                                    onClick={async () => {
                                      setCourseKey(c.courseKey);
                                      setCourseData(c);
                                      localStorage.setItem("activeCourseData", JSON.stringify(c));
                                      const userId = localStorage.getItem("usuarioId");
                                      if (userId) {
                                        await fetchCedula(userId, c._id);
                                        await fetchSurvey(userId, c._id);
                                        await fetchEficacia(userId, c._id);
                                        await fetchEficaciaEstudiante(userId, c._id);
                                      }
                                    }}
                                  >
                                    Seleccionar Curso
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="format-selection-header no-print" style={{ marginBottom: '20px' }}>
                    <div className="card-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3>Encuesta de Opinión (Formato ITGAM-AC-005-09)</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>Curso: <strong>{courseData.title}</strong> | Facilitador: <strong>{courseData.instructorName}</strong></p>
                      </div>
                      <button 
                        onClick={() => { 
                          setCourseData(null); 
                          setCourseKey(""); 
                          setCedulaData(null); 
                          setSurveyData(null); 
                          setEficaciaData(null);
                          setEficaciaEstudianteData(null);
                          localStorage.removeItem("activeCourseData");
                        }} 
                        className="btn-secondary no-print"
                        style={{ border: '1px solid #ccc', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ← Cambiar curso
                      </button>
                    </div>
                  </div>
                  
                  <div className="printable-form-wrapper">
                    <OpinionSurvey 
                      courseData={courseData}
                      userData={userData}
                      surveyData={surveyData}
                      onSave={handleSaveSurveyData}
                      readOnly={false}
                    />
                  </div>
                </>
              )}
              </div>
            </section>
          )}

          {activeTab === "eficacia" && (
            <section className="formatos-view animate-fade-in text-left">
              <div className="dashboard-form-container">
                {!courseData ? (
                <div className="no-print">
                  <div className="card-glass">
                    <h3>Selecciona un Curso para la Encuesta de Eficacia</h3>
                    <p>Por favor, ingresa la clave de tu curso o selecciónalo de la lista para poder contestar el Formato ITGAM-AC-005-04.</p>
                    <div className="search-box" style={{ marginTop: '15px' }}>
                      {availableCourses && availableCourses.length > 0 && (
                        <select
                          value={courseKey}
                          onChange={(e) => setCourseKey(e.target.value)}
                          className="course-select-input"
                        >
                          <option value="">-- Selecciona un curso --</option>
                          {availableCourses.map((c) => (
                            <option key={c._id} value={c.courseKey}>
                              {c.courseKey} - {c.title}
                            </option>
                          ))}
                        </select>
                      )}
                      <input 
                        type="text" 
                        placeholder="Clave del curso (Ej: CURSO-101)" 
                        value={courseKey}
                        onChange={(e) => setCourseKey(e.target.value)}
                      />
                      <button onClick={handleLookupCourse} disabled={loading}>
                        {loading ? "Buscando..." : "Cargar Datos"}
                      </button>
                    </div>
                  </div>

                  {availableCourses.length > 0 && (
                    <div className="card-glass" style={{ marginTop: '25px', padding: '20px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#001e3c', fontWeight: 'bold' }}>Cursos Disponibles en el Sistema</h4>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Clave</th>
                              <th>Nombre del Curso</th>
                              <th>Instructor</th>
                              <th>Horario / Duración</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableCourses.map((c) => (
                              <tr key={c._id}>
                                <td style={{ fontWeight: 'bold', color: '#001e3c' }}>{c.courseKey}</td>
                                <td>{c.title}</td>
                                <td>{c.instructorName}</td>
                                <td>{c.schedule} ({c.duration})</td>
                                <td>
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'inline-block' }}
                                    onClick={async () => {
                                      setCourseKey(c.courseKey);
                                      setCourseData(c);
                                      localStorage.setItem("activeCourseData", JSON.stringify(c));
                                      const userId = localStorage.getItem("usuarioId");
                                      if (userId) {
                                        await fetchCedula(userId, c._id);
                                        await fetchSurvey(userId, c._id);
                                        await fetchEficacia(userId, c._id);
                                        await fetchEficaciaEstudiante(userId, c._id);
                                      }
                                    }}
                                  >
                                    Seleccionar Curso
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="format-selection-header no-print" style={{ marginBottom: '20px' }}>
                    <div className="card-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3>Encuesta de Eficacia (Formato ITGAM-AC-005-04)</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>Curso: <strong>{courseData.title}</strong> | Facilitador: <strong>{courseData.instructorName}</strong></p>
                      </div>
                      <button 
                        onClick={() => { 
                          setCourseData(null); 
                          setCourseKey(""); 
                          setCedulaData(null); 
                          setSurveyData(null); 
                          setEficaciaData(null);
                          setEficaciaEstudianteData(null);
                          localStorage.removeItem("activeCourseData");
                        }} 
                        className="btn-secondary no-print"
                        style={{ border: '1px solid #ccc', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ← Cambiar curso
                      </button>
                    </div>
                  </div>
                  
                  <div className="printable-form-wrapper">
                    <EficaciaSurvey 
                      courseData={courseData}
                      userData={userData}
                      surveyData={eficaciaData}
                      onSave={handleSaveEficaciaData}
                      readOnly={false}
                    />
                  </div>
                </>
              )}
              </div>
            </section>
          )}

          {activeTab === "eficacia_estudiante" && (
            <section className="formatos-view animate-fade-in text-left">
              <div className="dashboard-form-container">
                {!courseData ? (
                <div className="no-print">
                  <div className="card-glass">
                    <h3>Selecciona un Curso para la Encuesta de Eficacia (Estudiante)</h3>
                    <p>Por favor, ingresa la clave de tu curso o selecciónalo de la lista para poder contestar el Formato ITGAM-AC-005-03.</p>
                    <div className="search-box" style={{ marginTop: '15px' }}>
                      {availableCourses && availableCourses.length > 0 && (
                        <select
                          value={courseKey}
                          onChange={(e) => setCourseKey(e.target.value)}
                          className="course-select-input"
                        >
                          <option value="">-- Selecciona un curso --</option>
                          {availableCourses.map((c) => (
                            <option key={c._id} value={c.courseKey}>
                              {c.courseKey} - {c.title}
                            </option>
                          ))}
                        </select>
                      )}
                      <input 
                        type="text" 
                        placeholder="Clave del curso (Ej: CURSO-101)" 
                        value={courseKey}
                        onChange={(e) => setCourseKey(e.target.value)}
                      />
                      <button onClick={handleLookupCourse} disabled={loading}>
                        {loading ? "Buscando..." : "Cargar Datos"}
                      </button>
                    </div>
                  </div>

                  {availableCourses.length > 0 && (
                    <div className="card-glass" style={{ marginTop: '25px', padding: '20px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#001e3c', fontWeight: 'bold' }}>Cursos Disponibles en el Sistema</h4>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Clave</th>
                              <th>Nombre del Curso</th>
                              <th>Instructor</th>
                              <th>Horario / Duración</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableCourses.map((c) => (
                              <tr key={c._id}>
                                <td style={{ fontWeight: 'bold', color: '#001e3c' }}>{c.courseKey}</td>
                                <td>{c.title}</td>
                                <td>{c.instructorName}</td>
                                <td>{c.schedule} ({c.duration})</td>
                                <td>
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'inline-block' }}
                                    onClick={async () => {
                                      setCourseKey(c.courseKey);
                                      setCourseData(c);
                                      localStorage.setItem("activeCourseData", JSON.stringify(c));
                                      const userId = localStorage.getItem("usuarioId");
                                      if (userId) {
                                        await fetchCedula(userId, c._id);
                                        await fetchSurvey(userId, c._id);
                                        await fetchEficacia(userId, c._id);
                                        await fetchEficaciaEstudiante(userId, c._id);
                                      }
                                    }}
                                  >
                                    Seleccionar Curso
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="format-selection-header no-print" style={{ marginBottom: '20px' }}>
                    <div className="card-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3>Encuesta de Eficacia (Estudiante) (Formato ITGAM-AC-005-03)</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>Curso: <strong>{courseData.title}</strong> | Facilitador: <strong>{courseData.instructorName}</strong></p>
                      </div>
                      <button 
                        onClick={() => { 
                          setCourseData(null); 
                          setCourseKey(""); 
                          setCedulaData(null); 
                          setSurveyData(null); 
                          setEficaciaData(null);
                          setEficaciaEstudianteData(null);
                          localStorage.removeItem("activeCourseData");
                        }} 
                        className="btn-secondary no-print"
                        style={{ border: '1px solid #ccc', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ← Cambiar curso
                      </button>
                    </div>
                  </div>
                  
                  <div className="printable-form-wrapper">
                    <EficaciaEstudianteSurvey 
                      courseData={courseData}
                      userData={userData}
                      surveyData={eficaciaEstudianteData}
                      onSave={handleSaveEficaciaEstudianteData}
                      readOnly={false}
                    />
                  </div>
                </>
              )}
              </div>
            </section>
          )}

          {activeTab === "subir_evidencia" && (
            <section className="animate-fade-in text-left">
              <div className="dashboard-form-container">
                {!courseData ? (
                <div className="empty-state no-print">
                  <span className="material-symbols-outlined">warning</span>
                  <p>Primero debes cargar un curso en la sección "Cédula de inscripción".</p>
                </div>
              ) : (
                <div className="card-glass" style={{ padding: "30px", background: "white" }}>
                  <h3 style={{ color: "#001e3c", marginBottom: "10px", fontWeight: "bold" }}>Subir Mi Evidencia del Curso</h3>
                  <p style={{ color: "#555", marginBottom: "20px" }}>
                    Sube tu constancia o documento de evidencia (PDF, JPG, PNG) para acreditar tu participación y aprobación en el curso: <strong>{courseData.title}</strong>.
                  </p>
                  
                  <div style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "30px",
                    textAlign: "center",
                    backgroundColor: "#f8fafc",
                    marginBottom: "20px"
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#64748b", marginBottom: "15px" }}>cloud_upload</span>
                    
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <input 
                        type="file" 
                        id="student-evidence-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          
                          const formData = new FormData();
                          formData.append("archivo", file);
                          
                          setLoading(true);
                          try {
                            const uploadRes = await axios.post(`${BASE_URL}/cedulas/upload`, formData, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });
                            await handleSaveStudentEvidence(uploadRes.data.filePath, uploadRes.data.fileName);
                          } catch (err) {
                            console.error(err);
                            alert("Error al subir archivo de evidencia.");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        style={{ display: "none" }}
                      />
                      <label 
                        htmlFor="student-evidence-upload" 
                        className="btn-primary" 
                        style={{ padding: "10px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                      >
                        Seleccionar Archivo de Evidencia
                      </label>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Formatos permitidos: PDF, JPG, PNG (Máx 5MB)</span>
                    </div>
                  </div>

                  {cedulaData?.evidenceName && (
                    <div style={{ 
                      padding: "16px 20px", 
                      backgroundColor: "#e8f5e9", 
                      border: "1px solid #c8e6c9", 
                      borderRadius: "10px",
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      flexWrap: "wrap",
                      gap: "10px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#2e7d32" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>check_circle</span>
                        <div>
                          <span style={{ fontSize: "14px", fontWeight: "bold", display: "block" }}>Evidencia Cargada</span>
                          <span style={{ fontSize: "13px", wordBreak: "break-all" }}>{cedulaData.evidenceName}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {cedulaData.evidenceUrl && (
                          <a 
                            href={`${FILE_SERVER_URL}/${cedulaData.evidenceUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none", fontSize: "13px", padding: "8px 16px" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span> Ver Archivo
                          </a>
                        )}
                        <button 
                          type="button" 
                          onClick={handleRemoveStudentEvidence}
                          className="btn-secondary"
                          style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", padding: "8px 16px", color: "#c62828", borderColor: "#ffcdd2" }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span> Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            </section>
          )}

          {activeTab === "evidencias_participantes" && (
            <section className="animate-fade-in text-left">
              <div className="card-glass">
                <h3 style={{ color: '#003366', marginBottom: '15px', fontWeight: 'bold' }}>Subir Evidencias de Participantes</h3>
                <p style={{ color: '#555', marginBottom: '20px' }}>
                  Como instructor asignado de este curso, puedes subir las evidencias correspondientes (constancias o documentos aprobatorios) en nombre de los demás profesores inscritos.
                </p>

                <div className="form-group" style={{ maxWidth: '400px', marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#4a5568' }}>Selecciona el Curso Impartido:</label>
                  <select
                    value={selectedInstructorCourseId}
                    onChange={(e) => setSelectedInstructorCourseId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '15px', marginTop: '5px' }}
                  >
                    {instructorCourses.map(c => (
                      <option key={c._id} value={c._id}>
                        [{c.courseKey}] - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="card-glass" style={{ padding: '25px' }}>
                <h4 style={{ color: '#003366', fontWeight: 'bold', marginBottom: '15px' }}>Profesores Inscritos y Evidencias</h4>
                {participants.length > 0 ? (
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Nombre del Participante</th>
                          <th>Número de Control</th>
                          <th>Correo Institucional</th>
                          <th>Estado de Evidencia</th>
                          <th>Acciones / Subir Archivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p) => {
                          const pUser = p.userId || {};
                          const course = instructorCourses.find(c => c._id === selectedInstructorCourseId);
                          const evidence = courseEvidences.find(ev => 
                            ev.alumno?._id === pUser._id
                          );
                          const fileSelected = selectedFiles[pUser._id];

                          return (
                            <tr key={p._id}>
                              <td style={{ fontWeight: '600' }}>
                                {pUser.nombres} {pUser.apPaterno} {pUser.apMaterno}
                              </td>
                              <td><code>{pUser.numeroControl || 'N/A'}</code></td>
                              <td>{pUser.correoInstitucional || 'N/A'}</td>
                              <td>
                                {evidence ? (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: 
                                      evidence.estado === 'Aprobada' ? '#d1fae5' :
                                      evidence.estado === 'Rechazada' ? '#fee2e2' : '#fef3c7',
                                    color: 
                                      evidence.estado === 'Aprobada' ? '#065f46' :
                                      evidence.estado === 'Rechazada' ? '#991b1b' : '#92400e'
                                  }}>
                                    {evidence.estado}
                                  </span>
                                ) : (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#f3f4f6',
                                    color: '#4b5563'
                                  }}>
                                    No subida
                                  </span>
                                )}
                              </td>
                              <td>
                                {evidence ? (
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <a
                                      href={`${FILE_SERVER_URL}/${evidence.archivoUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', margin: 0 }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                                      Ver
                                    </a>
                                    <button
                                      onClick={() => handleDeleteEvidence(evidence._id)}
                                      className="btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '4px', margin: 0 }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                      Eliminar
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                      type="file"
                                      id={`file-${pUser._id}`}
                                      accept=".pdf,image/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          setSelectedFiles(prev => ({ ...prev, [pUser._id]: e.target.files[0] }));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`file-${pUser._id}`}
                                      className="btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>attach_file</span>
                                      {fileSelected ? 'Cambiar' : 'Seleccionar'}
                                    </label>
                                    {fileSelected && (
                                      <span style={{ fontSize: '11px', color: '#4b5563', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {fileSelected.name}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleUploadEvidenceForParticipant(pUser._id)}
                                      className="btn-primary"
                                      disabled={!fileSelected || loading}
                                      style={{ padding: '6px 12px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cloud_upload</span>
                                      Subir
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e0', marginBottom: '10px' }}>people_mute</span>
                    <p>No hay participantes inscritos en este curso actualmente.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}


