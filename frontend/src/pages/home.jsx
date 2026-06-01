// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import "../styles/home.css";
import { Link } from "react-router-dom";

// IMPORTACIÓN DEL COMPONENTE DINÁMICO
import Chatbot from "../components/Chatbot"; 

import defaultHeroImage from '../assets/campus_night.png';
import logoInstitucional from "../assets/logo1.jpg";

const getDynamicHost = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? `http://${window.location.hostname}:5000`
    : window.location.origin;
};
const BASE_URL = getDynamicHost();

const project1 = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
const collaboration = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
const labWork = "https://images.unsplash.com/photo-1581093450021-4a7360e9a6f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
const success = "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

function Home() {
  // Estados para los datos dinámicos de la Base de Datos
  const [videos, setVideos] = useState([]);
  const [slides, setSlides] = useState([]);
  const [events, setEvents] = useState([]); // Nuevo estado para eventos
  const [activeVideo, setActiveVideo] = useState(null); 
  const [customHeroImage, setCustomHeroImage] = useState(null); // Imagen de fondo dinámica

  // Carrusel estado (Fallback de imágenes estáticas)
  const carouselImages = [project1, collaboration, labWork, success];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Obtener la longitud actual del carrusel (dinámico o estático)
  const currentCarouselData = slides.length > 0 ? slides : carouselImages;

  // Cargar datos del backend al montar el componente
  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Cargar imagen dinámica del héroe (Publicidad)
        const heroRes = await fetch(`${BASE_URL}/api/public/publicidad/hero`);
        if (heroRes.ok) {
          const heroData = await heroRes.json();
          if (heroData && !heroData.useDefault && heroData.imagenUrl) {
            setCustomHeroImage(`${BASE_URL}${heroData.imagenUrl}`);
          }
        }

        // Rutas del backend para videos
        const videoRes = await fetch(`${BASE_URL}/api/admin/content/`);
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          setVideos(videoData);
          if (videoData.length > 0) setActiveVideo(videoData[0]);
        }

        // Rutas del backend para carrusel
        const carouselRes = await fetch(`${BASE_URL}/api/admin/content/carousel`);
        if (carouselRes.ok) {
          const carouselData = await carouselRes.json();
          setSlides(carouselData);
        }

        // NUEVA: Ruta del backend para eventos escolares públicos
        const eventsRes = await fetch(`${BASE_URL}/api/admin/events?type=event`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        }
      } catch (error) {
        console.error("Error cargando contenido:", error);
      }
    };

    fetchContent();
  }, []);

  // Temporizador del carrusel
  useEffect(() => {
    if (currentCarouselData.length === 0) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % currentCarouselData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentCarouselData.length]);

  return (
    <div className="home-container">
      
      {/* Header */}
      <header className="header-sticky">
        <div className="header-inner max-w-7xl mx-auto">
          <div className="logo-container-flex">
            <div className="logo-icon-box">
              <img src={logoInstitucional} alt="Logo ITGAM" />
            </div>
            <div className="logo-text-stack">
              <h1>ITGAM</h1>
              <span>GUSTAVO A. MADERO</span>
            </div>
          </div>

          <nav className="main-nav">
            <Link to="/" className="nav-link">Inicio</Link>
            <Link to="/contacto" className="nav-link">Contacto</Link>
            <Link to="/activar" className="nav-btn-outline">Activar Cuenta</Link>
            <Link to="/login" className="nav-btn-solid">Iniciar Sesión</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        
        <section className="hero-section">
          <div className="hero-bg">
            <div className="hero-overlay"></div>
            <img src={customHeroImage || defaultHeroImage} alt="ITGAM Campus" className="hero-image" />
          </div>
          <div className="hero-content max-w-7xl mx-auto px-6">
            <div className="hero-text-container">
              <span className="badge">Excelencia Académica</span>
              <h1>¡Forjando el futuro en el ITGAM!</h1>
              <p>
                Transformamos el talento en innovación. Únete a la comunidad de los Halcones y lidera el cambio tecnológico en la Ciudad de México.
              </p>
            </div>
          </div>
        </section>

        {/* Eventos Institucionales (MODIFICADO PARA USAR EVENTOS DE MONGO) */}
        <section className="section-pad max-w-7xl mx-auto px-6">
          <div className="section-header">
            <div>
              <h2>Eventos Institucionales</h2>
              <div className="blue-line"></div>
              <p>Participa en las actividades y eventos que enriquecen nuestra vida académica y tecnológica.</p>
            </div>
          </div>

          <div className="grid-3">
            {events.length > 0 ? (
              events.map((event, i) => (
                <div className="card-group" key={event._id || i}>
                  <div className="card-top-bar"></div>
                  <div className="card-content">
                    <div className="event-badge">
                      <span className="material-symbols-outlined">event</span> {event.date}
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <button className="card-btn">
                      Más información <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Fallback estático solo si no hay eventos en la BD
              [
                { date: "15 OCT 2024", title: "Congreso Nacional de IA", desc: "Expertos nacionales discuten el impacto de la IA en la ingeniería moderna." },
                { date: "22 OCT 2024", title: "Hackathon Halcón 2024", desc: "48 horas de innovación para resolver problemas urbanos en la CDMX." },
                { date: "05 NOV 2024", title: "Feria de Emprendimiento", desc: "Estudiantes presentan proyectos y startups ante inversionistas reales." }
              ].map((fallback, i) => (
                <div className="card-group" key={i}>
                  <div className="card-top-bar"></div>
                  <div className="card-content">
                    <div className="event-badge">
                      <span className="material-symbols-outlined">event</span> {fallback.date}
                    </div>
                    <h3>{fallback.title}</h3>
                    <p>{fallback.desc}</p>
                    <button className="card-btn">
                      Más información <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Vida en el Campus (Videos Dinámicos) */}
        <section className="vida-campus-section max-w-7xl mx-auto">
          <div className="section-header-campus">
            <h2>Vida en el Campus</h2>
            <p>Descubre la energía y el dinamismo de nuestra comunidad.</p>
          </div>

          <div className="vida-campus-grid">
            {/* REPRODUCTOR PRINCIPAL */}
            <div className="video-principal-card">
              {activeVideo ? (
                <div className="video-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video 
                    key={activeVideo.url} 
                    src={`${BASE_URL}${activeVideo.url}`}
                    controls
                    poster={activeVideo.thumbnailUrl ? `${BASE_URL}${activeVideo.thumbnailUrl}` : ""}
                    className="video-cover-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                  />
                  <div className="video-overlay-content" style={{ pointerEvents: 'none', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                    <div className="badge-video-container"><span className="badge-yellow">Reproduciendo</span></div>
                    <h3>{activeVideo.title}</h3>
                    <p>{activeVideo.description}</p>
                  </div>
                </div>
              ) : (
                <div className="video-placeholder">
                  <img 
                    src={success} 
                    alt="Placeholder" 
                    className="video-cover-img" 
                  />
                  <div className="video-overlay-content">
                    <h3>No hay videos disponibles</h3>
                  </div>
                </div>
              )}
            </div>

            {/* LISTA DE REPRODUCCIÓN (PLAYLIST) */}
            <div className="playlist-container">
              <div className="playlist-header">
                <h4>Playlist</h4>
                <span>{videos.length} VIDEOS</span>
              </div>
              <div className="playlist-items" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {videos.length > 0 ? videos.map((video, idx) => (
                  <div 
                    className={`playlist-item ${activeVideo?._id === video._id ? 'active-video' : ''}`} 
                    key={video._id || idx}
                    onClick={() => {
                      setActiveVideo(video);
                      const element = document.querySelector('.video-principal-card');
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      borderLeft: activeVideo?._id === video._id ? '4px solid #f39c12' : '4px solid transparent',
                      backgroundColor: activeVideo?._id === video._id ? '#f8f9fa' : 'transparent'
                    }}
                  >
                    <div className="thumb-box">
                      <img 
                        src={video.thumbnailUrl ? `${BASE_URL}${video.thumbnailUrl}` : success} 
                        alt={video.title} 
                        onError={(e) => e.target.src = success}
                      />
                      <span className="thumb-badge academic">{video.category?.toUpperCase() || 'VIDA ITGAM'}</span>
                    </div>
                    <div className="thumb-text">
                      <h5 style={{ color: activeVideo?._id === video._id ? '#003366' : 'inherit' }}>{video.title}</h5>
                      <p>{video.category || 'CONTENIDO INSTITUCIONAL'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="playlist-item">
                    <p style={{padding: '10px', color: '#666'}}>Próximamente más contenido...</p>
                  </div>
                )}
              </div>
              <button className="btn-canal">VER TODO EL CANAL</button>
            </div>
          </div>
        </section>

        {/* Orgullo Halcón (Carrusel Dinámico) */}
        <section className="section-primary">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex-orgullo">
              <div className="carousel-container">
                {currentCarouselData.map((item, idx) => (
                  <img 
                    key={item._id || idx} 
                    src={item.imageUrl ? `${BASE_URL}${item.imageUrl}` : item} 
                    alt={item.title || "Orgullo ITGAM"} 
                    className={`carousel-img ${idx === currentImageIndex ? 'active' : ''}`}
                    onError={(e) => { e.target.src = success; }}
                  />
                ))}
                <div className="carousel-controls">
                  <button className="control-btn" onClick={() => setCurrentImageIndex((prev) => (prev - 1 + currentCarouselData.length) % currentCarouselData.length)}>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="control-btn" onClick={() => setCurrentImageIndex((prev) => (prev + 1) % currentCarouselData.length)}>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
                <div className="carousel-dots">
                  {currentCarouselData.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`dot ${idx === currentImageIndex ? 'active' : ''}`}></button>
                  ))}
                </div>
              </div>

              <div className="texto-orgullo">
                <h2>{slides.length > 0 ? slides[currentImageIndex]?.title : "Orgullo Halcón"}</h2>
                <div className="white-line"></div>
                <p>{slides.length > 0 ? slides[currentImageIndex]?.description : "Lideramos proyectos en las empresas más importantes del país y formamos ingenieros de excelencia."}</p>
                <div className="stats-grid">
                  <div><p className="stat-number">15k+</p><p className="stat-label">Egresados</p></div>
                  <div><p className="stat-number">15+</p><p className="stat-label">Años</p></div>
                  <div><p className="stat-number">8</p><p className="stat-label">Ingenierías</p></div>
                  <div><p className="stat-number">100%</p><p className="stat-label">Éxito</p></div>
                </div>
                <button className="btn-outline-white">Conoce nuestra historia</button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="footer-inst-clean">
        <div className="max-w-7xl mx-auto px-6">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo-box"><span className="material-symbols-outlined">school</span><h2>ITGAM</h2></div>
              <p className="footer-desc">Excelencia académica para el desarrollo tecnológico de México.</p>
            </div>
            <div className="footer-col">
              <h4>Contacto</h4>
              <ul className="footer-contact">
                <li><span className="material-symbols-outlined icon-yellow">location_on</span><span>Calle 604 s/n, Cuchilla la Joya, CDMX.</span></li>
                <li><span className="material-symbols-outlined icon-yellow">call</span><span>+52 (55) 5767 1234</span></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Instituto Tecnológico de Gustavo A. Madero. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* COMPONENTE CHATBOT */}
      <Chatbot />

    </div>
  );
}

export default Home;