import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import logoITGAM from '../assets/logo1.jpg';
import '../styles/CedulaInscripcion.css';

const CedulaInscripcion = ({ courseData, userData, cedulaData, onSave, onPrint, readOnly }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureImg, setSignatureImg] = useState('');


  const [personalData, setPersonalData] = useState({
    genero: 'Masculino',
    rfc: '',
    curp: '',
    gradoEstudios: '',
    nombreCarrera: '',
    nombres: '',
    apPaterno: '',
    apMaterno: ''
  });

  const [laborData, setLaborData] = useState({
    puesto: '',
    departamento: '',
    institucion: 'INSTITUTO TECNOLÓGICO DE GUSTAVO A. MADERO',
    clavePresupuestal: '',
    jefeInmediato: '',
    telefonoOficial: '',
    telefonoExt: '',
    horarioLaboral: ''
  });

  const [fechaHoy, setFechaHoy] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Bloquear el scroll del cuerpo de la página cuando el modal de firma está abierto
  useEffect(() => {
    if (showSignatureModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSignatureModal]);

  // Cargar fecha de hoy al iniciar
  useEffect(() => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setFechaHoy(today.toLocaleDateString('es-MX', options));
  }, []);

  // Cargar datos de la cédula si ya existe una guardada en BD
  useEffect(() => {
    if (cedulaData) {
      if (cedulaData.personalData) {
        setPersonalData(cedulaData.personalData);
      }
      if (cedulaData.laborData) {
        setLaborData(cedulaData.laborData);
      }
      if (cedulaData.signature) {
        setSignatureImg(cedulaData.signature);
      }
    }
  }, [cedulaData]);

  // FUNCIONES DE DIBUJO PARA LA FIRMA (TOUCH / MOUSE)
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      // Prevenir el scroll en pantallas táctiles mientras se dibuja
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        setSignatureImg(canvas.toDataURL());
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureImg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios de Datos Personales
    const personalLabels = {
      nombres: "Nombre(s)",
      apPaterno: "Apellido Paterno",
      apMaterno: "Apellido Materno",
      rfc: "R.F.C.",
      curp: "CURP",
      gradoEstudios: "Grado Máximo de Estudios",
      nombreCarrera: "Nombre de la Carrera"
    };

    // Validar campos obligatorios de Datos Laborales (Teléfono Extensión es opcional)
    const laborLabels = {
      institucion: "Instituto Tecnológico o Centro",
      departamento: "Área de Adscripción",
      puesto: "Puesto que Desempeña",
      clavePresupuestal: "Clave Presupuestal",
      jefeInmediato: "Nombre del Jefe Inmediato",
      telefonoOficial: "Teléfono Oficial",
      horarioLaboral: "Horario"
    };

    for (const key in personalLabels) {
      if (!personalData[key] || !personalData[key].trim()) {
        alert(`Por favor, rellena el campo obligatorio: ${personalLabels[key]}`);
        return;
      }
    }

    for (const key in laborLabels) {
      if (!laborData[key] || !laborData[key].trim()) {
        alert(`Por favor, rellena el campo obligatorio: ${laborLabels[key]}`);
        return;
      }
    }

    // Validar firma registrada
    if (!signatureImg) {
      alert("Por favor, ingresa tu firma digital para poder guardar.");
      return;
    }

    const success = await onSave({
      personalData,
      laborData,
      signature: signatureImg,
      evidenceUrl: cedulaData?.evidenceUrl || '',
      evidenceName: cedulaData?.evidenceName || ''
    });
    if (success) {
      setShowSuccessModal(true);
    }
  };

  return (
    <div className="cedula-wrapper">

      {/* Formato Físico */}
      <div className="cedula-document" id="printable-cedula">
        <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0, color: 'inherit' }}>
          {/* Encabezado oficial */}
          <header className="cedula-header">
            <div className="header-left">
              <div className="border-box">Revisión 0</div>
              <div className="border-box">ITGAM-AC-005-07</div>
              <div className="border-box">Página 1 de 1</div>
            </div>
            <div className="header-center">
              <h1 style={{ marginTop: '15px' }}>CÉDULA DE INSCRIPCIÓN</h1>
            </div>
            <div className="header-right">
              <img src={logoITGAM} alt="Logo ITGAM" className="logo-img" />
            </div>
          </header>

        {/* Fecha */}
        <div className="cedula-date-row">
          <div className="field-group inline">
            <label className="bold-label">FECHA</label>
            <span className="fill-line">{fechaHoy}</span>
          </div>
        </div>

        {/* DATOS DEL EVENTO */}
        <fieldset className="cedula-fieldset">
          <legend className="fieldset-legend">DATOS DEL EVENTO</legend>
          
          <div className="form-row">
            <div className="field-group col-4">
              <label>CLAVE DEL CURSO:</label>
              <span className="fill-line text-data uppercase">{courseData?.courseKey || ''}</span>
            </div>
            <div className="field-group col-8">
              <label>NOMBRE DEL CURSO:</label>
              <span className="fill-line text-data uppercase">{courseData?.title || ''}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>NOMBRE DEL INSTRUCTOR(ES):</label>
              <span className="fill-line text-data uppercase">{courseData?.instructorName || ''}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>PERIODO DE REALIZACIÓN:</label>
              <span className="fill-line text-data uppercase">{courseData?.period || ''}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-8">
              <label>HORARIO:</label>
              <span className="fill-line text-data uppercase">{courseData?.schedule || ''}</span>
            </div>
            <div className="field-group col-4">
              <label>DURACIÓN:</label>
              <span className="fill-line text-data uppercase">{courseData?.duration || ''}</span>
            </div>
          </div>
        </fieldset>

        {/* DATOS PERSONALES */}
        <fieldset className="cedula-fieldset">
          <legend className="fieldset-legend">DATOS PERSONALES</legend>

          <div className="form-row gender-row">
            <div className="gender-choices">
              <span className="gender-title">GÉNERO:</span>
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="genero" 
                  value="Masculino" 
                  checked={personalData.genero === 'Masculino'}
                  onChange={(e) => setPersonalData({...personalData, genero: e.target.value})}
                />
                <span>HOMBRE</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="genero" 
                  value="Femenino" 
                  checked={personalData.genero === 'Femenino'}
                  onChange={(e) => setPersonalData({...personalData, genero: e.target.value})}
                />
                <span>MUJER</span>
              </label>
            </div>
          </div>

          <div className="form-row name-fields-row">
            <div className="field-group col-4">
              <input 
                type="text" 
                className="fill-input uppercase text-center" 
                value={personalData.apPaterno} 
                onChange={(e) => setPersonalData({...personalData, apPaterno: e.target.value})}
                placeholder="Ej. Pérez"
              />
              <span className="sub-label">APELLIDO PATERNO</span>
            </div>
            <div className="field-group col-4">
              <input 
                type="text" 
                className="fill-input uppercase text-center" 
                value={personalData.apMaterno} 
                onChange={(e) => setPersonalData({...personalData, apMaterno: e.target.value})}
                placeholder="Ej. Gómez"
              />
              <span className="sub-label">APELLIDO MATERNO</span>
            </div>
            <div className="field-group col-4">
              <input 
                type="text" 
                className="fill-input uppercase text-center" 
                value={personalData.nombres} 
                onChange={(e) => setPersonalData({...personalData, nombres: e.target.value})}
                placeholder="Ej. Juan"
              />
              <span className="sub-label">NOMBRE(S)</span>
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-6">
              <label>R.F.C.:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={personalData.rfc} 
                onChange={(e) => setPersonalData({...personalData, rfc: e.target.value})}
                placeholder="PEGR800101XXX"
                maxLength={13}
              />
            </div>
            <div className="field-group col-6">
              <label>CURP:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={personalData.curp} 
                onChange={(e) => setPersonalData({...personalData, curp: e.target.value})}
                placeholder="PEGR800101HDFXX01"
                maxLength={18}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>CORREO ELECTRÓNICO:</label>
              <input 
                type="email" 
                className="fill-input" 
                value={userData?.correoInstitucional || ''} 
                disabled
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>GRADO MÁXIMO DE ESTUDIOS:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={personalData.gradoEstudios} 
                onChange={(e) => setPersonalData({...personalData, gradoEstudios: e.target.value})}
                placeholder="Ej. MAESTRÍA EN CIENCIAS"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>NOMBRE DE LA CARRERA:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={personalData.nombreCarrera} 
                onChange={(e) => setPersonalData({...personalData, nombreCarrera: e.target.value})}
                placeholder="Ej. INGENIERÍA EN SISTEMAS COMPUTACIONALES"
              />
            </div>
          </div>
        </fieldset>

        {/* DATOS LABORALES */}
        <fieldset className="cedula-fieldset">
          <legend className="fieldset-legend">DATOS LABORALES</legend>

          <div className="form-row">
            <div className="field-group col-12">
              <label>INSTITUTO TECNOLÓGICO O CENTRO:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={laborData.institucion} 
                onChange={(e) => setLaborData({...laborData, institucion: e.target.value})}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>ÁREA DE ADSCRIPCIÓN:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={laborData.departamento} 
                onChange={(e) => setLaborData({...laborData, departamento: e.target.value})}
                placeholder="Ej. DEPARTAMENTO DE SISTEMAS Y COMPUTACIÓN"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>PUESTO QUE DESEMPEÑA:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={laborData.puesto} 
                onChange={(e) => setLaborData({...laborData, puesto: e.target.value})}
                placeholder="Ej. DOCENTE DE TIEMPO COMPLETO"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>CLAVE PRESUPUESTAL:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={laborData.clavePresupuestal} 
                onChange={(e) => setLaborData({...laborData, clavePresupuestal: e.target.value})}
                placeholder="Ej. E102930219"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>NOMBRE DEL JEFE INMEDIATO:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={laborData.jefeInmediato} 
                onChange={(e) => setLaborData({...laborData, jefeInmediato: e.target.value})}
                placeholder="Ej. ING. AARON GUZMÁN"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-8">
              <label>TELÉFONO OFICIAL:</label>
              <input 
                type="text" 
                className="fill-input" 
                value={laborData.telefonoOficial} 
                onChange={(e) => setLaborData({...laborData, telefonoOficial: e.target.value})}
                placeholder="55-1234-5678"
              />
            </div>
            <div className="field-group col-4">
              <label>EXT.:</label>
              <input 
                type="text" 
                className="fill-input" 
                value={laborData.telefonoExt} 
                onChange={(e) => setLaborData({...laborData, telefonoExt: e.target.value})}
                placeholder="101"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group col-12">
              <label>HORARIO:</label>
              <input 
                type="text" 
                className="fill-input uppercase" 
                value={laborData.horarioLaboral} 
                onChange={(e) => setLaborData({...laborData, horarioLaboral: e.target.value})}
                placeholder="Ej. LUNES A VIERNES DE 07:00 A 15:00 HRS"
              />
            </div>
          </div>
        </fieldset>

        {/* Firma */}
        <div className="cedula-footer-row">
          <div className="signature-box" style={{ maxWidth: '340px', margin: '0 auto', textAlign: 'center' }}>
            
            {/* Panel de Firma con Touch/Mouse (Solo visible en pantalla) */}
            {!readOnly && (
              <div className="no-print" style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '11px', color: '#555', margin: 0, fontWeight: 'bold' }}>
                  Firma Digital (Táctil / Mouse):
                </p>
                <button 
                  type="button" 
                  onClick={() => setShowSignatureModal(true)} 
                  className="btn-primary" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '8px 16px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    backgroundColor: '#003366',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>draw</span>
                  {signatureImg ? "Cambiar Firma" : "Dibujar Firma"}
                </button>
              </div>
            )}
            
            {/* Firma renderizada para impresión */}
            <div className="signature-image-container" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {signatureImg ? (
                <img src={signatureImg} alt="Firma del Docente" style={{ maxHeight: '75px', width: 'auto', display: 'block' }} />
              ) : (
                <span className="no-print" style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>Sin firma registrada</span>
              )}
            </div>
            
            <div className="signature-line"></div>
            <span className="signature-label">FIRMA</span>
          </div>
        </div>
        </fieldset>
      </div>

      {/* Botones de acción (ocultos en impresión) - Colocados abajo */}
      {!readOnly && (
        <div className="cedula-actions no-print" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px', paddingBottom: '30px' }}>
          <button type="button" className="btn-save-cedula" onClick={handleSave}>
            <span className="material-symbols-outlined">save</span> Guardar Datos de Cédula
          </button>
          <button type="button" className="btn-print-cedula" onClick={onPrint || (() => window.print())}>
            <span className="material-symbols-outlined">print</span> Imprimir Cédula de Inscripción
          </button>
        </div>
      )}

      {/* Mensaje Modal de Éxito con Logo ITGAM en verde */}
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
                ¡Guardado Exitosamente!
              </h3>
              <p style={{ color: '#047857', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                Los datos de tu Cédula de Inscripción han sido guardados y enviados correctamente al perfil del administrador.
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

      {/* Modal de Firma Digital (Táctil / Mouse) Premium */}
      {showSignatureModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '15px',
          boxSizing: 'border-box'
        }} className="no-print animate-fade-in">
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px 20px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#003366', fontSize: '18px', fontWeight: 'bold' }}>Dibuja tu firma digital</h3>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                onClick={() => {
                  setShowSignatureModal(false);
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#666', fontSize: '24px' }}>close</span>
              </button>
            </div>
            
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>
              Realiza tu trazo con el dedo o el mouse en el recuadro. La pantalla permanecerá estática mientras firmas.
            </p>

            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '8px', backgroundColor: '#f8fafc' }}>
              <canvas
                ref={canvasRef}
                width={360}
                height={160}
                style={{ 
                  border: '1px solid #94a3b8', 
                  borderRadius: '8px', 
                  backgroundColor: '#ffffff', 
                  cursor: 'crosshair', 
                  display: 'block', 
                  margin: '0 auto',
                  touchAction: 'none'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '5px' }}>
              <button 
                type="button" 
                onClick={clearSignature} 
                className="btn-secondary" 
                style={{ flex: 1, padding: '12px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #ccc' }}
              >
                Limpiar
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    setSignatureImg(canvas.toDataURL());
                  }
                  setShowSignatureModal(false);
                }} 
                className="btn-primary" 
                style={{ flex: 1, padding: '12px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', backgroundColor: '#003366', color: '#ffffff', border: 'none' }}
              >
                Guardar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CedulaInscripcion;
