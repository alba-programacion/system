import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logoITGAM from '../assets/logo1.jpg';
import '../styles/OpinionSurvey.css';

const questions = [
  // INSTRUCTOR (0 to 6 -> Q1 to Q7)
  { id: 1, text: "Expuso el objetivo y temario del curso.", category: "INSTRUCTOR" },
  { id: 2, text: "Mostró dominio del contenido abordado.", category: "INSTRUCTOR" },
  { id: 3, text: "Fomentó la participación del grupo.", category: "INSTRUCTOR" },
  { id: 4, text: "Aclaró las dudas que se presentaron.", category: "INSTRUCTOR" },
  { id: 5, text: "Dio retroalimentación a los ejercicios realizados.", category: "INSTRUCTOR" },
  { id: 6, text: "Aplicó una evaluación final relacionada con los contenidos del curso.", category: "INSTRUCTOR" },
  { id: 7, text: "Inició y concluyó puntualmente las sesiones.", category: "INSTRUCTOR" },
  // MATERIAL DIDÁCTICO (7 to 9 -> Q8 to Q10)
  { id: 8, text: "El material didáctico fue útil a lo largo del curso.", category: "MATERIAL DIDÁCTICO" },
  { id: 9, text: "La impresión del material didáctico fue legible.", category: "MATERIAL DIDÁCTICO" },
  { id: 10, text: "La variedad del material didáctico fue suficiente para apoyar su aprendizaje.", category: "MATERIAL DIDÁCTICO" },
  // CURSO (10 to 13 -> Q11 to Q14)
  { id: 11, text: "La distribución del tiempo fue adecuada para cubrir el contenido.", category: "CURSO" },
  { id: 12, text: "Los temas fueron suficientes para alcanzar el objetivo del curso.", category: "CURSO" },
  { id: 13, text: "El curso comprendió ejercicios de práctica relacionados con el contenido.", category: "CURSO" },
  { id: 14, text: "El curso cubrió sus expectativas.", category: "CURSO" },
  // INFRAESTRUCTURA (14 to 19 -> Q15 to Q20)
  { id: 15, text: "La iluminación del aula fue adecuada.", category: "INFRAESTRUCTURA" },
  { id: 16, text: "La ventilación del aula fue adecuada.", category: "INFRAESTRUCTURA" },
  { id: 17, text: "El aseo del aula fue adecuada.", category: "INFRAESTRUCTURA" },
  { id: 18, text: "El servicio de los sanitarios fue adecuado (limpieza, abasto de papel, toallas, jabón, etc.).", category: "INFRAESTRUCTURA" },
  { id: 19, text: "El servicio de café fue adecuado.", category: "INFRAESTRUCTURA" },
  { id: 20, text: "Recibió apoyo del personal que coordinó el curso.", category: "INFRAESTRUCTURA" }
];

export default function OpinionSurvey({ courseData, userData, surveyData, onSave, readOnly }) {
  const [curso, setCurso] = useState('');
  const [fechaRealizacion, setFechaRealizacion] = useState('');
  const [institucion, setInstitucion] = useState('INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO');
  const [facilitador, setFacilitador] = useState('');
  const [respuestas, setRespuestas] = useState(Array(20).fill(0));
  const [sugerencias, setSugerencias] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Initialize values
  useEffect(() => {
    if (surveyData) {
      setCurso(surveyData.curso || '');
      setFechaRealizacion(surveyData.fechaRealizacion || '');
      setInstitucion(surveyData.institucion || 'INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO');
      setFacilitador(surveyData.facilitador || '');
      setRespuestas(surveyData.respuestas || Array(20).fill(0));
      setSugerencias(surveyData.sugerencias || '');
    } else {
      setCurso(courseData?.title || '');
      setFechaRealizacion(courseData?.period || '');
      setInstitucion('INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO');
      setFacilitador(courseData?.instructorName || '');
      setRespuestas(Array(20).fill(0));
      setSugerencias('');
    }
  }, [courseData, surveyData]);

  const handleRatingChange = (index, rating) => {
    if (readOnly) return;
    const newRatings = [...respuestas];
    newRatings[index] = rating;
    setRespuestas(newRatings);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    // Validate metadata fields
    if (!curso || !curso.trim()) {
      alert("Por favor, rellena el campo obligatorio: Nombre del Curso.");
      return;
    }
    if (!fechaRealizacion || !fechaRealizacion.trim()) {
      alert("Por favor, rellena el campo obligatorio: Fecha de realización.");
      return;
    }
    if (!institucion || !institucion.trim()) {
      alert("Por favor, rellena el campo obligatorio: Nombre de la Institución.");
      return;
    }
    if (!facilitador || !facilitador.trim()) {
      alert("Por favor, rellena el campo obligatorio: Nombre del Facilitador.");
      return;
    }

    // Validate all questions answered
    const unanswered = respuestas.findIndex(r => r === 0);
    if (unanswered !== -1) {
      alert(`Por favor responde la pregunta ${unanswered + 1} antes de guardar.`);
      return;
    }

    const payload = {
      tipo: 'opinion',
      curso,
      fechaRealizacion,
      institucion,
      facilitador,
      respuestas,
      sugerencias
    };

    const success = await onSave(payload);
    if (success) {
      setShowSavedModal(true);
      setTimeout(() => setShowSavedModal(false), 3000);
    }
  };

  const leftQuestions = questions.filter(q => q.category === "INSTRUCTOR" || q.category === "MATERIAL DIDÁCTICO");
  const rightQuestions = questions.filter(q => q.category === "CURSO" || q.category === "INFRAESTRUCTURA");

  return (
    <div className={`survey-wrapper ${readOnly ? 'read-only' : ''}`}>
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
              <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 24px 0', lineHeight: '1.5' }}>La encuesta de opinión ha sido registrada correctamente en el sistema.</p>
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
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="survey-document" id="printable-survey">
        {/* Encabezado */}
        <header className="survey-header-block">
          <div className="header-left-col">
            <div className="header-border-box">Revisión: 0</div>
            <div className="header-border-box">ITGAM-AC-005-09</div>
            <div className="header-border-box">Página 1 de 1</div>
          </div>
          <div className="header-center-col">
            <h2>FORMATO</h2>
            <h1>ENCUESTA DE OPINIÓN</h1>
            <p className="presencial-subtitle">Cursos de Capacitación Presencial</p>
          </div>
          <div className="header-right-col">
            <img src={logoITGAM} alt="Logo" className="survey-logo-img" />
          </div>
        </header>

        {/* Datos Generales */}
        <div className="survey-meta-fields">
          <div className="meta-row">
            <div className="meta-group col-7">
              <label>Nombre del Curso:</label>
              {readOnly ? (
                <span className="meta-line text-data uppercase">{curso}</span>
              ) : (
                <input 
                  type="text" 
                  className="meta-input uppercase"
                  value={curso} 
                  onChange={(e) => setCurso(e.target.value)} 
                  required
                />
              )}
            </div>
            <div className="meta-group col-5">
              <label>Fecha de realización:</label>
              {readOnly ? (
                <span className="meta-line text-data uppercase">{fechaRealizacion}</span>
              ) : (
                <input 
                  type="text" 
                  className="meta-input uppercase"
                  value={fechaRealizacion} 
                  onChange={(e) => setFechaRealizacion(e.target.value)} 
                  required
                />
              )}
            </div>
          </div>
          
          <div className="meta-row">
            <div className="meta-group col-7">
              <label>Nombre de Institución:</label>
              {readOnly ? (
                <span className="meta-line text-data uppercase">{institucion}</span>
              ) : (
                <input 
                  type="text" 
                  className="meta-input uppercase"
                  value={institucion} 
                  onChange={(e) => setInstitucion(e.target.value)} 
                  required
                />
              )}
            </div>
            <div className="meta-group col-5">
              <label>Nombre del Facilitador:</label>
              {readOnly ? (
                <span className="meta-line text-data uppercase">{facilitador}</span>
              ) : (
                <input 
                  type="text" 
                  className="meta-input uppercase"
                  value={facilitador} 
                  onChange={(e) => setFacilitador(e.target.value)} 
                  required
                />
              )}
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="survey-instruction-text">
          <p>La presente encuesta tiene como finalidad conocer su opinión sobre el curso de capacitación en el que participó, las respuestas nos servirán para mejorarlo.</p>
          <p><strong>INSTRUCCIÓN:</strong> Solicitamos exprese su opinión sobre los siguientes aspectos escribiendo el número correspondiente en el recuadro de la derecha según la siguiente escala:</p>
        </div>

        {/* Escala */}
        <div className="survey-scale-bar">
          <div className="scale-box"><span className="scale-num">5</span> <span className="scale-lbl">Totalmente de acuerdo</span></div>
          <div className="scale-box"><span className="scale-num">4</span> <span className="scale-lbl">Parcialmente de acuerdo</span></div>
          <div className="scale-box"><span className="scale-num">3</span> <span className="scale-lbl">Indiferente</span></div>
          <div className="scale-box"><span className="scale-num">2</span> <span className="scale-lbl">Parcialmente en desacuerdo</span></div>
          <div className="scale-box"><span className="scale-num">1</span> <span className="scale-lbl">En desacuerdo</span></div>
        </div>

        {/* Preguntas Grid */}
        <div className="survey-questions-grid">
          {/* Columna Izquierda */}
          <div className="survey-questions-column">
            {/* Sección Instructor */}
            <div className="category-block">
              <h3 className="category-header">INSTRUCTOR</h3>
              {leftQuestions.filter(q => q.category === "INSTRUCTOR").map((q) => {
                const globalIdx = questions.findIndex(item => item.id === q.id);
                return (
                  <div key={q.id} className="question-row">
                    <span className="question-num">{q.id}</span>
                    <span className="question-text">{q.text}</span>
                    <div className="question-rating-box">
                      {readOnly ? (
                        <span className="rating-value">{respuestas[globalIdx] || '-'}</span>
                      ) : (
                        <select 
                          value={respuestas[globalIdx]} 
                          onChange={(e) => handleRatingChange(globalIdx, parseInt(e.target.value))}
                          className="rating-select"
                        >
                          <option value="0">-</option>
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sección Material Didáctico */}
            <div className="category-block">
              <h3 className="category-header">MATERIAL DIDÁCTICO</h3>
              {leftQuestions.filter(q => q.category === "MATERIAL DIDÁCTICO").map((q) => {
                const globalIdx = questions.findIndex(item => item.id === q.id);
                return (
                  <div key={q.id} className="question-row">
                    <span className="question-num">{q.id}</span>
                    <span className="question-text">{q.text}</span>
                    <div className="question-rating-box">
                      {readOnly ? (
                        <span className="rating-value">{respuestas[globalIdx] || '-'}</span>
                      ) : (
                        <select 
                          value={respuestas[globalIdx]} 
                          onChange={(e) => handleRatingChange(globalIdx, parseInt(e.target.value))}
                          className="rating-select"
                        >
                          <option value="0">-</option>
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="survey-questions-column">
            {/* Sección Curso */}
            <div className="category-block">
              <h3 className="category-header">CURSO</h3>
              {rightQuestions.filter(q => q.category === "CURSO").map((q) => {
                const globalIdx = questions.findIndex(item => item.id === q.id);
                return (
                  <div key={q.id} className="question-row">
                    <span className="question-num">{q.id}</span>
                    <span className="question-text">{q.text}</span>
                    <div className="question-rating-box">
                      {readOnly ? (
                        <span className="rating-value">{respuestas[globalIdx] || '-'}</span>
                      ) : (
                        <select 
                          value={respuestas[globalIdx]} 
                          onChange={(e) => handleRatingChange(globalIdx, parseInt(e.target.value))}
                          className="rating-select"
                        >
                          <option value="0">-</option>
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sección Infraestructura */}
            <div className="category-block">
              <h3 className="category-header">INFRAESTRUCTURA</h3>
              {rightQuestions.filter(q => q.category === "INFRAESTRUCTURA").map((q) => {
                const globalIdx = questions.findIndex(item => item.id === q.id);
                return (
                  <div key={q.id} className="question-row">
                    <span className="question-num">{q.id}</span>
                    <span className="question-text">{q.text}</span>
                    <div className="question-rating-box">
                      {readOnly ? (
                        <span className="rating-value">{respuestas[globalIdx] || '-'}</span>
                      ) : (
                        <select 
                          value={respuestas[globalIdx]} 
                          onChange={(e) => handleRatingChange(globalIdx, parseInt(e.target.value))}
                          className="rating-select"
                        >
                          <option value="0">-</option>
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comentarios */}
        <div className="survey-comments-section">
          <h3 className="comments-header">COMENTARIOS O SUGERENCIAS</h3>
          {readOnly ? (
            <div className="comments-box-read-only">{sugerencias || 'Sin comentarios o sugerencias.'}</div>
          ) : (
            <textarea 
              className="comments-textarea"
              placeholder="Escribe aquí tus comentarios, observaciones o propuestas..."
              value={sugerencias} 
              onChange={(e) => setSugerencias(e.target.value)}
            />
          )}
        </div>

        {/* Agradecimiento */}
        <div className="survey-thanks">
          <p>Gracias.</p>
        </div>

        {/* Botones de acción */}
        {!readOnly && (
          <div className="survey-actions-row no-print">
            <button type="submit" className="btn-save-survey">
              <span className="material-symbols-outlined">save</span> Guardar Datos de Encuesta
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
