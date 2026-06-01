import React, { useState, useEffect } from 'react';
import logoITGAM from '../assets/logo1.jpg';
import '../styles/EficaciaEstudianteSurvey.css';

const questions = [
  { id: 1, text: "Permitió que los conocimientos adquiridos tengan aplicación en su ámbito laboral a corto y mediano plazo." },
  { id: 2, text: "Ayudo a mejorar el desempeño de sus funciones." },
  { id: 3, text: "Ayudo a considerar nuevas formas de trabajo." },
  { id: 4, text: "Produjo un incremento en su motivación." },
  { id: 5, text: "Ha servido para su desarrollo personal." },
  { id: 6, text: "Sirvió para integrarse mejor con sus compañeros (as) de trabajo." },
  { id: 7, text: "Produjo una mayor comprensión del servicio que presta el TecNM." },
  { id: 8, text: "Facilito una mejoría en su actitud hacia la Institución o sus compañeros (as) de trabajo." },
  { id: 9, text: "Permitió desarrollar algunas habilidades adicionales." },
  { id: 10, text: "Genero una mejor comprensión de los conceptos generales del curso aplicables en su campo laboral." },
  { id: 11, text: "Relacionaron los conocimientos impartidos del curso con la docencia" },
  { id: 12, text: "Ofrecieron un sentido ético y moral para mejorar sus aspectos laborales" },
  { id: 13, text: "Ofrecieron valores compatibles con los suyos." }
];

const EficaciaEstudianteSurvey = ({ courseData, userData, surveyData, onSave, readOnly = false }) => {
  const [departamento, setDepartamento] = useState("");
  const [curso, setCurso] = useState("");
  const [respuestas, setRespuestas] = useState(Array(13).fill(0));
  const [sugerencias, setSugerencias] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cargar datos existentes si los hay
  useEffect(() => {
    if (surveyData) {
      setDepartamento(surveyData.departamento || "");
      setCurso(surveyData.curso || "");
      
      let loadedRespuestas = Array(13).fill(0);
      if (Array.isArray(surveyData.respuestas)) {
        if (surveyData.respuestas.length === 14) {
          loadedRespuestas = surveyData.respuestas.slice(1, 14);
        } else if (surveyData.respuestas.length === 13) {
          loadedRespuestas = [...surveyData.respuestas];
        } else {
          for (let i = 0; i < 13; i++) {
            loadedRespuestas[i] = surveyData.respuestas[i] || 0;
          }
        }
      } else if (surveyData.respuestas && typeof surveyData.respuestas === 'object') {
        for (let i = 1; i <= 13; i++) {
          loadedRespuestas[i - 1] = surveyData.respuestas[i] || 0;
        }
      }
      setRespuestas(loadedRespuestas);
      setSugerencias(surveyData.sugerencias || "");
    } else {
      setDepartamento("");
      setCurso(courseData?.title || "");
      setRespuestas(Array(13).fill(0));
      setSugerencias("");
    }
  }, [surveyData, courseData]);

  const handleSelectOption = (questionId, value) => {
    if (readOnly) return;
    const newRatings = [...respuestas];
    newRatings[questionId - 1] = value;
    setRespuestas(newRatings);
  };

  const handleSave = async () => {
    if (!departamento.trim()) {
      alert("Por favor, ingresa el Departamento.");
      return;
    }
    if (!curso.trim()) {
      alert("Por favor, ingresa el Curso.");
      return;
    }

    // Validar que se hayan respondido todas las preguntas
    const unanswered = [];
    for (let i = 0; i < 13; i++) {
      if (respuestas[i] === 0) {
        unanswered.push(i + 1);
      }
    }
    if (unanswered.length > 0) {
      alert(`Por favor, contesta todas las preguntas. Falta responder la(s) pregunta(s): ${unanswered.join(", ")}`);
      return;
    }

    const payload = {
      tipo: "eficacia_estudiante",
      departamento,
      curso,
      respuestas,
      sugerencias
    };

    const success = await onSave(payload);
    if (success) {
      setShowSuccessModal(true);
    }
  };

  const getTodayDateStr = () => {
    return new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="estudiante-wrapper">
      {/* Modal de Éxito Premium */}
      {showSuccessModal && (
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
        }} className="no-print">
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '3px solid #10b981',
            padding: '35px 40px',
            width: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            animation: 'scaleUp 0.3s ease-out',
            position: 'relative',
            overflow: 'hidden'
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
                ¡Registro Exitoso!
              </h3>
              <p style={{ color: '#047857', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                Los datos de la encuesta de eficacia (Estudiante) han sido guardados correctamente en el sistema.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
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
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="estudiante-document">
        {/* Cabecera Oficial */}
        <table className="estudiante-header-table">
          <tbody>
            <tr>
              <td className="estudiante-header-left">
                <div>Revisión 00</div>
                <div>ITGAM-AC-005-03</div>
                <div>Página 1 de 1</div>
              </td>
              <td className="estudiante-header-center">
                <h3>FORMATO</h3>
                <h2>ENCUESTA DE LA EFICACIA DE LA CAPACITACIÓN (ESTUDIANTE)</h2>
              </td>
              <td className="estudiante-header-right">
                <img src={logoITGAM} alt="Logo GAM" className="estudiante-logo-img" />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Títulos centrales */}
        <div className="estudiante-subheading">
          <h4>INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO</h4>
          <h3>SUBDIRECCIÓN ACADÉMICA</h3>
        </div>

        {/* Datos generales */}
        <div className="estudiante-meta-grid">
          <div className="estudiante-meta-row">
            <label>DEPARTAMENTO:</label>
            {readOnly ? (
              <div className="estudiante-meta-text">{departamento}</div>
            ) : (
              <input
                type="text"
                className="estudiante-meta-input"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Escribe el nombre de tu departamento"
              />
            )}
          </div>
          <div className="estudiante-meta-row">
            <label>CURSO:</label>
            {readOnly ? (
              <div className="estudiante-meta-text">{curso}</div>
            ) : (
              <input
                type="text"
                className="estudiante-meta-input"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                placeholder="Nombre del curso"
              />
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <p className="estudiante-instructions">
          Considerando la necesidad de evaluar los cursos a los cuales Usted asistió, se le solicita conteste las siguientes preguntas, marcando con una X la respuesta que a su juicio corresponda a la afirmación realizada, partiendo de la siguiente escala.
        </p>

        <div className="estudiante-participant-title">PARTICIPANTE</div>

        {/* Tabla de escala */}
        <table className="estudiante-scale-table">
          <tbody>
            <tr>
              <td>
                <span className="estudiante-scale-num">1</span>
                Totalmente en desacuerdo
              </td>
              <td>
                <span className="estudiante-scale-num">2</span>
                Parcialmente en desacuerdo
              </td>
              <td>
                <span className="estudiante-scale-num">3</span>
                Indiferente
              </td>
              <td>
                <span className="estudiante-scale-num">4</span>
                Parcialmente de acuerdo
              </td>
              <td>
                <span className="estudiante-scale-num">5</span>
                Totalmente de acuerdo
              </td>
            </tr>
          </tbody>
        </table>

        <div className="estudiante-intro-phrase">El curso en el que participó Usted le:</div>

        {/* Tabla evaluativa */}
        <table className="estudiante-table">
          <thead>
            <tr>
              <th className="estudiante-th-num">#</th>
              <th className="estudiante-th-desc">Afirmación</th>
              <th className="estudiante-th-scale">1</th>
              <th className="estudiante-th-scale">2</th>
              <th className="estudiante-th-scale">3</th>
              <th className="estudiante-th-scale">4</th>
              <th className="estudiante-th-scale">5</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td className="estudiante-cell-num">{q.id}</td>
                <td className="estudiante-cell-desc">{q.text}</td>
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = respuestas[q.id - 1] === val;
                  return (
                    <td
                      key={val}
                      className="estudiante-cell-scale"
                      onClick={() => handleSelectOption(q.id, val)}
                    >
                      <div className={`estudiante-option-box ${isSelected ? 'selected' : ''}`}>
                        {isSelected ? 'X' : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sugerencias */}
        <div className="estudiante-suggestions">
          <p>
            Tiene Usted sugerencias para mejorar los cursos ofrecidos por el Instituto tecnológico. Por favor utilice el reverso de la encuesta si el espacio no le es suficiente.
          </p>
          {readOnly ? (
            <div style={{ minHeight: '60px', border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              {sugerencias || 'Sin sugerencias registradas.'}
            </div>
          ) : (
            <textarea
              className="estudiante-textarea"
              rows={3}
              value={sugerencias}
              onChange={(e) => setSugerencias(e.target.value)}
              placeholder="Escribe tus sugerencias aquí..."
            />
          )}

          {/* Líneas impresas si está vacío en impresión */}
          {readOnly && (
            <div className="estudiante-suggestions-print visible-print-only" style={{ display: 'none' }}>
              <div className="estudiante-print-line"></div>
              <div className="estudiante-print-line"></div>
              <div className="estudiante-print-line"></div>
            </div>
          )}
        </div>

        {/* Botón de guardar */}
        {!readOnly && (
          <div className="estudiante-actions no-print">
            <button className="btn-estudiante-save" onClick={handleSave}>
              Guardar Datos de Encuesta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EficaciaEstudianteSurvey;
