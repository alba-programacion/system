import React from 'react';
import '../styles/SurveyForm.css';

const questions = [
  "Permitió que los conocimientos adquiridos tengan aplicación en su ámbito laboral a corto y mediano plazo.",
  "Ayudó a mejorar el desempeño de sus funciones.",
  "Ayudó a considerar nuevas formas de trabajo.",
  "Produjo un incremento en su motivación.",
  "Ha servido para su desarrollo personal.",
  "Sirvió para integrarse mejor con sus compañeros (as) de trabajo.",
  "Produjo una mayor comprensión del servicio que presta el TecNM.",
  "Facilito una mejoría en su actitud hacia la Institución o sus compañeros (as) de trabajo.",
  "Permitió desarrollar algunas habilidades adicionales.",
  "Genero una mejor comprensión de los conceptos generales del curso aplicables en su campo laboral.",
  "Relacionaron los conocimientos impartidos del curso con la docencia.",
  "Ofrecieron un sentido ético y moral para mejorar sus aspectos laborales.",
  "Ofrecieron valores compatibles con los suyos."
];

export default function SurveyForm({ courseName, department }) {
  return (
    <div className="survey-printable-container">
      <div className="survey-header">
        <div className="header-box top-left">
          <p>Revisión 00</p>
          <p>ITGAM-AC-005-03</p>
          <p>Página 1 de 1</p>
        </div>
        <div className="header-box top-center">
          <h3>FORMATO</h3>
          <h2>ENCUESTA DE LA EFICACIA DE LA CAPACITACIÓN (ESTUDIANTE)</h2>
        </div>
        <div className="header-box top-right">
          <div className="itgam-logo-placeholder">G M</div>
          <p className="itgam-logo-text">ITGAM</p>
        </div>
      </div>

      <div className="institution-title">
        <h2>INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO</h2>
        <h3>SUBDIRECCIÓN ACADÉMICA</h3>
      </div>

      <div className="form-fields">
        <div className="field-row">
          <label>DEPARTAMENTO:</label>
          <span className="field-line">{department || "__________________________________________________________"}</span>
        </div>
        <div className="field-row">
          <label>CURSO:</label>
          <span className="field-line">{courseName || "__________________________________________________________"}</span>
        </div>
      </div>

      <div className="survey-instructions">
        <p>Considerando la necesidad de evaluar los cursos a los cuales Usted asistió, se le solicita conteste las siguientes preguntas, marcando con una X la respuesta que a su juicio corresponda a la afirmación realizada, partiendo de la siguiente escala.</p>
        <p className="participant-label">PARTICIPANTE</p>
      </div>

      <div className="scale-legend">
        <div className="scale-item">
          <div className="scale-num">1</div>
          <div className="scale-text">Totalmente en desacuerdo</div>
        </div>
        <div className="scale-item">
          <div className="scale-num">2</div>
          <div className="scale-text">Parcialmente en desacuerdo</div>
        </div>
        <div className="scale-item">
          <div className="scale-num">3</div>
          <div className="scale-text">Indiferente</div>
        </div>
        <div className="scale-item">
          <div className="scale-num">4</div>
          <div className="scale-text">Parcialmente de acuerdo</div>
        </div>
        <div className="scale-item">
          <div className="scale-num">5</div>
          <div className="scale-text">Totalmente de acuerdo</div>
        </div>
      </div>

      <table className="survey-table">
        <thead>
          <tr>
            <th className="question-col">El curso en el que participó Usted le:</th>
            <th className="num-col">1</th>
            <th className="num-col">2</th>
            <th className="num-col">3</th>
            <th className="num-col">4</th>
            <th className="num-col">5</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => (
            <tr key={i}>
              <td className="question-text">{q}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="suggestions-section">
        <p>Tiene Usted sugerencias para mejorar los cursos ofrecidos por el Instituto tecnológico. Por favor utilice el reverso de la encuesta si el espacio no le es suficiente.</p>
        <div className="suggestion-lines">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
      </div>
    </div>
  );
}
