import React, { useState, useEffect, useRef } from 'react';
import '../styles/chatbot.css';
import halconMascota from '../assets/halcon.jpeg'; 

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [messages, setMessages] = useState([
    { role: 'bot', text: '¡Hola! Soy tu asistente del ITGAM. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    if (!mensaje.trim()) return;

    const userMsg = { role: 'user', text: mensaje };
    setMessages(prev => [...prev, userMsg]);
    setMensaje("");

    // Respuesta simulada
    setTimeout(() => {
      let botResponse = "Lo siento, aún estoy aprendiendo sobre los procesos del ITGAM. ¿Podrías ser más específico?";
      
      const msgLower = mensaje.toLowerCase();
      if (msgLower.includes("hola")) botResponse = "¡Hola! ¿Cómo puedo apoyarte hoy?";
      else if (msgLower.includes("curso")) botResponse = "Puedes ver tus cursos en la sección 'Datos del Evento' en tu dashboard.";
      else if (msgLower.includes("asistencia")) botResponse = "Para registrar asistencia, los alumnos deben escanear el código QR que generas en tu panel.";
      else if (msgLower.includes("encuesta") || msgLower.includes("formato")) botResponse = "Los formatos de encuesta ahora están disponibles en la nueva pestaña 'Formatos' de tu dashboard.";

      const botMsg = { role: 'bot', text: botResponse };
      setMessages(prev => [...prev, botMsg]);
      
      if (isSpeaking) {
        speak(botResponse);
      }
    }, 600);
  };

  // --- Web Speech API: Text-to-Speech ---
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // --- Web Speech API: Speech-to-Text ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMensaje(transcript);
    };

    recognition.start();
  };

  return (
    <div className="fab-container">
      {/* 1. Ventana de Chat */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <img src={halconMascota} alt="Halcon" style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px', border: '2px solid white' }} />
              <span>Asistente Halcón</span>
            </div>
            <div className="header-actions">
              <button 
                className={`voice-toggle ${isSpeaking ? 'active' : ''}`} 
                onClick={() => {
                  if (isSpeaking) window.speechSynthesis.cancel();
                  setIsSpeaking(!isSpeaking);
                }}
                title={isSpeaking ? "Desactivar voz" : "Activar voz"}
              >
                <span className="material-symbols-outlined">
                  {isSpeaking ? 'volume_up' : 'volume_off'}
                </span>
              </button>
              <button className="close-btn" onClick={toggleChat}>×</button>
            </div>
          </div>
          
          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`msg-wrapper ${msg.role}`}>
                <div className={`${msg.role}-msg animate-pop`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            <button 
              className={`mic-btn ${isListening ? 'listening' : ''}`} 
              onClick={startListening}
              title="Hablar"
            >
              <span className="material-symbols-outlined">mic</span>
            </button>
            <input 
              type="text" 
              placeholder="Escribe tu duda..." 
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="send-btn" onClick={handleSend}>
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Burbuja de texto (Solo si está cerrado) */}
      {!isOpen && (
        <div className="chat-bubble">
          ¿En qué puedo ayudarte, Halcón?
        </div>
      )}

      {/* 3. Botón Flotante (FAB) */}
      <button className={`fab ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
        {isOpen ? (
          <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>close</span>
        ) : (
          <img 
            src={halconMascota} 
            alt="Mascota ITGAM" 
            className="halcon-img-icon" 
          />
        )}
      </button>
    </div>
  );
}