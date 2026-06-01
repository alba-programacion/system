import React, { useState, useEffect } from 'react';
import logoITGAM from '../assets/logo1.jpg';
import '../styles/EficaciaSurvey.css';

const questions = [
  { id: 1, text: "Los conocimientos que adquirió su colaborador (a) en el curso tiene aplicación en el ámbito laboral a corto y mediano plazo." },
  { id: 2, text: "El curso ayudó a su colaborador (a) a mejorar el desempeño de sus funciones." },
  { id: 3, text: "El curso ayudó a su colaborador (a) a considerar nuevas formas de trabajo." },
  { id: 4, text: "Produjo un incremento en su motivación." },
  { id: 5, text: "Ha servido para su desarrollo personal." },
  { id: 6, text: "Sirvió para integrarse mejor con sus compañeros (as) de trabajo." },
  { id: 7, text: "Produjo una mayor comprensión del servicio que presta el SNEST." },
  { id: 8, text: "Facilitó una mejoría en su actitud hacia la Institución o sus compañeros (as) de trabajo." },
  { id: 9, text: "Permitió desarrollar algunas habilidades adicionales." },
  { id: 10, text: "Generó una mejor comprensión de los conceptos generales del curso aplicables en su campo laboral." },
  { id: 11, text: "Relacionaron los conocimientos impartidos del curso con la docencia." },
  { id: 12, text: "Ofrecieron un sentido ético y moral para mejorar sus aspectos laborales." },
  { id: 13, text: "Ofrecieron valores compatibles con los suyos." }
];

export default function EficaciaSurvey({ courseData, userData, surveyData, onSave, readOnly }) {
  const [departamento, setDepartamento] = useState('');
  const [curso, setCurso] = useState('');
  const [docente, setDocente] = useState('');
  const [respuestas, setRespuestas] = useState(Array(13).fill(0));
  const [sugerencias, setSugerencias] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Initialize values
  useEffect(() => {
    if (surveyData) {
      setDepartamento(surveyData.departamento || '');
      setCurso(surveyData.curso || '');
      setDocente(surveyData.docente || '');
      setRespuestas(surveyData.respuestas || Array(13).fill(0));
      setSugerencias(surveyData.sugerencias || '');
    } else {
      setDepartamento('');
      setCurso(courseData?.title || '');
      setDocente(courseData?.instructorName || '');
      setRespuestas(Array(13).fill(0));
      setSugerencias('');
    }
  }, [courseData, surveyData]);

  const handleRatingSelect = (index, val) => {
    if (readOnly) return;
    const newRatings = [...respuestas];
    newRatings[index] = val;
    setRespuestas(newRatings);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    // Validate fields
    if (!departamento.trim()) {
      alert("Por favor, ingresa el departamento.");
      return;
    }
    if (!curso.trim()) {
      alert("Por favor, ingresa el nombre del curso.");
      return;
    }
    if (!docente.trim()) {
      alert("Por favor, ingresa el nombre del docente.");
      return;
    }

    // Validate all questions are answered
    const unanswered = respuestas.findIndex(r => r === 0);
    if (unanswered !== -1) {
      alert(`Por favor responde la afirmación número ${unanswered + 1} antes de guardar.`);
      return;
    }

    const payload = {
      tipo: 'eficacia_profesor',
      departamento,
      curso,
      docente,
      respuestas,
      sugerencias
    };

    const success = await onSave(payload);
    if (success) {
      setShowSavedModal(true);
      setTimeout(() => setShowSavedModal(false), 3000);
    }
  };

  return (
    <div className={`eficacia-wrapper ${readOnly ? 'read-only' : ''}`}>
      {/* Modal de guardado exitoso */}
      {showSavedModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '35px 40px',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            maxWidth: '450px',
            width: '90%',
            animation: 'scaleIn 0.3s ease-out',
            border: '3px solid #10b981',
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

              <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#064e3b', margin: '0 0 12px 0' }}>¡Guardado Exitoso!</h3>
              <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 24px 0', lineHeight: '1.5' }}>La encuesta de eficacia de capacitación docente ha sido registrada correctamente en el sistema.</p>
              <button
                onClick={() => setShowSavedModal(false)}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 32px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="eficacia-document">
        
        {/* Tabla de Encabezado Oficial */}
        <table className="eficacia-header-table">
          <tbody>
            <tr>
              <td className="eficacia-meta-cell" style={{ width: '20%' }}>
                <div>Revisión 00</div>
                <div>ITGAM-AC-005-04</div>
                <div>Página 1 de 1</div>
              </td>
              <td className="eficacia-title-cell" style={{ width: '60%' }}>
                <h2>FORMATO</h2>
                <h1>ENCUESTA DE LA EFICACIA DE LA CAPACITACIÓN DOCENTE</h1>
              </td>
              <td className="eficacia-logo-cell" style={{ width: '20%' }}>
                <img src={logoITGAM} alt="Logo ITGAM" className="eficacia-logo-img" />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Sub-Encabezado */}
        <div className="eficacia-sub-header">
          <h2>INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO</h2>
          <h3>SUBDIRECCIÓN ACADÉMICA</h3>
        </div>

        {/* Metadatos */}
        <div className="eficacia-meta-fields">
          <div className="eficacia-meta-row">
            <div className="eficacia-meta-group">
              <label>DEPARTAMENTO:</label>
              {readOnly ? (
                <div className="eficacia-meta-line">{departamento}</div>
              ) : (
                <input 
                  type="text" 
                  className="eficacia-meta-input uppercase" 
                  value={departamento} 
                  onChange={(e) => setDepartamento(e.target.value)} 
                  required
                />
              )}
            </div>
          </div>
          <div className="eficacia-meta-row">
            <div className="eficacia-meta-group">
              <label>CURSO:</label>
              {readOnly ? (
                <div className="eficacia-meta-line">{curso}</div>
              ) : (
                <input 
                  type="text" 
                  className="eficacia-meta-input uppercase" 
                  value={curso} 
                  onChange={(e) => setCurso(e.target.value)} 
                  required
                />
              )}
            </div>
            <div className="eficacia-meta-group">
              <label>DOCENTE:</label>
              {readOnly ? (
                <div className="eficacia-meta-line">{docente}</div>
              ) : (
                <input 
                  type="text" 
                  className="eficacia-meta-input uppercase" 
                  value={docente} 
                  onChange={(e) => setDocente(e.target.value)} 
                  required
                />
              )}
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="eficacia-instruction-text">
          <p>
            Considerando la necesidad de evaluar los cursos a los que sus colaboradores (as) asistieron, se le solicita conteste las siguientes preguntas, marcando con una X la respuesta que a su juicio corresponda a la afirmación realizada, partiendo de la siguiente escala.
          </p>
        </div>

        {/* Escala */}
        <div className="eficacia-scale-section">
          <div className="eficacia-scale-title">JEFE (A) INMEDIATO</div>
          <div className="eficacia-scale-grid">
            <div className="eficacia-scale-box"><strong>1</strong>Totalmente en desacuerdo</div>
            <div className="eficacia-scale-box"><strong>2</strong>Parcialmente en desacuerdo</div>
            <div className="eficacia-scale-box"><strong>3</strong>Indiferente</div>
            <div className="eficacia-scale-box"><strong>4</strong>Parcialmente de acuerdo</div>
            <div className="eficacia-scale-box"><strong>5</strong>Totalmente de acuerdo</div>
          </div>
        </div>

        {/* Tabla de preguntas */}
        <div className="eficacia-table-container">
          <div className="eficacia-table-header">
            <div className="eficacia-th-num">No.</div>
            <div className="eficacia-th-text">Aspecto a evaluar</div>
            <div className="eficacia-th-options">
              <div className="eficacia-th-opt-num">1</div>
              <div className="eficacia-th-opt-num">2</div>
              <div className="eficacia-th-opt-num">3</div>
              <div className="eficacia-th-opt-num">4</div>
              <div className="eficacia-th-opt-num">5</div>
            </div>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} className="eficacia-row">
              <div className="eficacia-cell-num">{q.id}</div>
              <div className="eficacia-cell-text">{q.text}</div>
              <div className="eficacia-cell-options">
                {[1, 2, 3, 4, 5].map((val) => (
                  <div
                    key={val}
                    className={`eficacia-cell-opt-box ${respuestas[idx] === val ? 'selected' : ''} ${readOnly ? 'read-only' : ''}`}
                    onClick={() => handleRatingSelect(idx, val)}
                  >
                    {respuestas[idx] === val ? 'X' : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sugerencias */}
        <div className="eficacia-suggestions-block">
          <div className="eficacia-suggestions-title">
            Tiene Usted sugerencias para mejorar los cursos ofrecidos por el Instituto tecnológico. Por favor utilice el reverso de la encuesta si el espacio no le es suficiente.
          </div>
          {readOnly ? (
            <div className="eficacia-suggestions-lines">
              {sugerencias ? (
                <div style={{ fontSize: '11px', color: '#000', minHeight: '40px', fontWeight: 'bold' }}>{sugerencias}</div>
              ) : (
                <>
                  <div className="eficacia-suggestions-line"></div>
                  <div className="eficacia-suggestions-line"></div>
                </>
              )}
            </div>
          ) : (
            <textarea
              className="eficacia-suggestions-textarea"
              value={sugerencias}
              onChange={(e) => setSugerencias(e.target.value)}
              placeholder="Escribe aquí tus sugerencias..."
            />
          )}
        </div>

        {/* Botón de envío */}
        {!readOnly && (
          <div className="eficacia-actions-panel no-print">
            <button type="submit" className="eficacia-save-btn">
              Guardar Datos
            </button>
          </div>
        )}

      </form>
    </div>
  );
}
