import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import '../styles/GestionContenido.css';

const getDynamicHost = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? `http://${window.location.hostname}:5000`
    : window.location.origin;
};
const BASE_URL = getDynamicHost();

const GestionContenido = () => {
    const [slides, setSlides] = useState([]);
    const [videos, setVideos] = useState([]);
    const [events, setEvents] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [selectedSlide, setSelectedSlide] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null); 
    const [customHero, setCustomHero] = useState(null); // Estado para fondo del héroe personalizado

    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [editMode, setEditMode] = useState({ id: null, type: null }); 

    const slideInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const heroInputRef = useRef(null); // Ref para subir fondo del héroe
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resSlides, resVideos, resEvents, resHero] = await Promise.all([
                api.get('/admin/content/carousel'),
                api.get('/admin/content/'),
                api.get('/admin/events?type=event'),
                api.get('/public/publicidad/hero')
            ]);
            setSlides(resSlides.data);
            setVideos(resVideos.data);
            setEvents(resEvents.data);
            
            if (resHero.data && !resHero.data.useDefault && resHero.data.imagenUrl) {
                setCustomHero(resHero.data);
            } else {
                setCustomHero(null);
            }
            
            if (resSlides.data.length > 0) setSelectedSlide(resSlides.data[0]);
            if (resVideos.data.length > 0) setSelectedVideo(resVideos.data[0]);
        } catch (err) { 
            console.error("Error al cargar datos:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleHeroUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            setLoading(true);
            await api.post('/public/publicidad/hero', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchData();
            alert("Imagen de fondo del Héroe actualizada con éxito");
        } catch (err) {
            console.error(err);
            alert("Error al subir la imagen del Héroe");
        } finally {
            setLoading(false);
        }
    };

    const handleHeroReset = async () => {
        if (!window.confirm("¿Restablecer el fondo del banner principal a la imagen nocturna por defecto?")) return;
        try {
            setLoading(true);
            await api.delete('/public/publicidad/hero');
            await fetchData();
            alert("Imagen de fondo restablecida a la predeterminada");
        } catch (err) {
            console.error(err);
            alert("Error al restablecer la imagen");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (item, type) => {
        setEditMode({ id: item._id, type: type });
        setNewTitle(item.title);
        setNewDescription(item.description || '');
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const cancelEdit = () => {
        setEditMode({ id: null, type: null });
        setNewTitle('');
        setNewDescription('');
        setEventTitle('');
        setEventDescription('');
        setEventDate('');
    };

    const handleUpdate = async () => {
        if (!editMode.id) return;
        try {
            setLoading(true);
            const endpoint = editMode.type === 'slide' 
                ? `/admin/content/carousel/${editMode.id}`
                : `/admin/content/${editMode.id}`;

            await api.put(endpoint, {
                title: newTitle,
                description: newDescription
            });

            alert("Actualizado correctamente");
            cancelEdit();
            fetchData();
        } catch (err) {
            console.error("Error al actualizar:", err);
            alert("Error al guardar cambios");
        } finally {
            setLoading(false);
        }
    };

    const handleSlideUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('title', newTitle || 'Nuevo Slide');
        formData.append('description', newDescription || '');
        try {
            setLoading(true);
            await api.post('/admin/content/carousel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            cancelEdit();
            fetchData();
            alert("Imagen subida con éxito");
        } catch (err) { 
            console.error(err); 
            alert("Error al subir imagen");
        } finally { 
            setLoading(false); 
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("video", file); 
        formData.append("title", newTitle || "Video ITGAM");
        formData.append("description", newDescription || "Sin descripción");
        try {
            setLoading(true);
            await api.post("/admin/content/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            cancelEdit();
            await fetchData(); 
            alert("Video subido con éxito");
        } catch (err) { 
            console.error(err); 
            alert("Error al subir video");
        } finally { 
            setLoading(false); 
        }
    };

    const handleCreateEvent = async () => {
        if (!eventTitle || !eventDate) {
            return alert("Por favor, ingresa al menos el título y la fecha del evento.");
        }
        try {
            setLoading(true);
            await api.post('/admin/events', {
                title: eventTitle,
                description: eventDescription || 'Sin descripción',
                date: eventDate,
                type: 'event'
            });
            alert("Evento creado con éxito");
            setEventTitle('');
            setEventDescription('');
            setEventDate('');
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al crear el evento");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm("¿Eliminar este elemento?")) return;
        try {
            let endpoint;
            if (type === 'slide') endpoint = `/admin/content/carousel/${id}`;
            else if (type === 'video') endpoint = `/admin/content/${id}`;
            else if (type === 'event') endpoint = `/admin/events/${id}`;

            await api.delete(endpoint);
            fetchData();
        } catch (error) { 
            console.error(error); 
            alert("Error al eliminar el elemento");
        }
    };

    if (loading) return <div className="loading-container"><p>Procesando datos...</p></div>;

    return (
        <div className="vida-campus-container">
            {/* Inputs ocultos */}
            <input type="file" accept="video/*" ref={videoInputRef} className="hidden-input" onChange={handleVideoUpload} />
            <input type="file" accept="image/*" ref={slideInputRef} className="hidden-input" onChange={handleSlideUpload} />
            <input type="file" accept="image/*" ref={heroInputRef} className="hidden-input" onChange={handleHeroUpload} />

            <header className="view-header">
                <h1>Vida en el Campus</h1>
                <p>{editMode.id ? `Modo Edición: ${editMode.type}` : 'Gestión de contenido multimedia'}</p>
            </header>

            {/* Sección de Publicidad / Fondo Héroe */}
            <section className="admin-section" style={{ maxHeight: 'none', height: 'auto', marginBottom: '25px' }}>
                <h2 className="section-title">
                    <span className="material-symbols-outlined">image</span> Publicidad y Banner Principal (Sección Héroe)
                </h2>
                <div className="hero-banner-editor-card" style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    textAlign: 'left'
                }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Desde aquí puedes cambiar fácilmente el fondo de publicidad del banner principal (Hero Section) que ven los usuarios al entrar al sitio. Al subir una nueva imagen, se aplicará el filtro azul oscuro del ITGAM de manera automática sobre ella.
                    </p>
                    
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <div style={{
                            position: 'relative',
                            height: '240px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                            background: '#001f3f'
                        }}>
                            {/* Overlay de simulación */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(135deg, rgba(0, 31, 63, 0.65) 0%, rgba(0, 51, 102, 0.45) 50%, rgba(0, 0, 0, 0.15) 100%)',
                                zIndex: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '30px',
                                color: 'white'
                            }}>
                                <span style={{
                                    alignSelf: 'flex-start',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '10px'
                                }}>
                                    {customHero ? 'Fondo Personalizado Activo' : 'Fondo por Defecto'}
                                </span>
                                <h3 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '0 0 8px 0', color: 'white' }}>¡Forjando el futuro en el ITGAM!</h3>
                                <p style={{ fontSize: '0.95rem', opacity: '0.95', margin: 0, maxWidth: '500px', color: 'rgba(255,255,255,0.9)' }}>Vista previa con superposición azul oscuro integrada.</p>
                            </div>
                            <img 
                                src={customHero ? `${BASE_URL}${customHero.imagenUrl}` : `${BASE_URL}/src/assets/campus_night.png`} 
                                alt="Vista Previa Héroe" 
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; }}
                            />
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <button 
                                type="button" 
                                className="btn-primary" 
                                onClick={() => heroInputRef.current.click()}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: 'none'
                                }}
                            >
                                <span className="material-symbols-outlined">cloud_upload</span>
                                Subir Nuevo Fondo
                            </button>
                            
                            {customHero && (
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    onClick={handleHeroReset}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        fontWeight: 'bold',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                >
                                    <span className="material-symbols-outlined">restart_alt</span>
                                    Restablecer por Defecto
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="admin-section">
                <div className={`quick-upload-bar ${editMode.id ? 'edit-mode-active' : ''}`}>
                    <div className="input-row">
                        <input 
                            type="text" 
                            placeholder="Título del contenido..." 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="input-title"
                        />
                        <input 
                            type="text" 
                            placeholder="Descripción..." 
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="input-desc"
                        />
                    </div>
                    <div className="button-row">
                        {editMode.id ? (
                            <>
                                <button className="btn-secondary" onClick={cancelEdit}>Cancelar</button>
                                <button className="btn-edit-save" onClick={handleUpdate}>Guardar Cambios</button>
                            </>
                        ) : (
                            <>
                                <button className="btn-primary" onClick={() => slideInputRef.current.click()}>+ Subir Imagen</button>
                                <button className="btn-dark" onClick={() => videoInputRef.current.click()}>+ Subir Video</button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="admin-section">
                <h2 className="section-title">Carrusel de Imágenes</h2>
                <div className="carousel-editor-grid">
                    <div className="slides-list">
                        {slides.map(slide => (
                            <div 
                                key={slide._id} 
                                onClick={() => setSelectedSlide(slide)} 
                                className={`slide-item ${selectedSlide?._id === slide._id ? 'active' : ''}`}
                            >
                                <img src={`${BASE_URL}${slide.imageUrl}`} alt="" className="slide-thumb" />
                                <div className="slide-actions">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(slide, 'slide'); }} className="text-btn-edit">Editar</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(slide._id, 'slide'); }} className="text-btn-delete">Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="preview-main">
                        {selectedSlide ? (
                            <div className="main-slide-card">
                                <img src={`${BASE_URL}${selectedSlide.imageUrl}`} alt="" className="main-slide-img" />
                                <div className="slide-caption">
                                    <h3>{selectedSlide.title}</h3>
                                    <p>{selectedSlide.description}</p>
                                </div>
                            </div>
                        ) : <p className="empty-msg">Selecciona una imagen</p>}
                    </div>
                </div>
            </section>

            <section className="admin-section">
                <h2 className="section-title">Gestión de Videos</h2>
                <div className="video-manager-grid">
                    <div className="video-preview-column">
                        <div className="video-player-wrapper">
                            {selectedVideo ? (
                                <video 
                                    key={selectedVideo._id}
                                    src={`${BASE_URL}${selectedVideo.url}`} 
                                    controls 
                                    className="video-element"
                                />
                            ) : <p className="video-placeholder-text">Selecciona un video para reproducir</p>}
                        </div>
                        {selectedVideo && (
                            <div className="video-info">
                                <h3>{selectedVideo.title}</h3>
                                <p>{selectedVideo.description}</p>
                            </div>
                        )}
                    </div>

                    <div className="video-sidebar">
                        {videos.map(v => (
                            <div 
                                key={v._id} 
                                onClick={() => setSelectedVideo(v)} 
                                className={`video-sidebar-item ${selectedVideo?._id === v._id ? 'active' : ''}`}
                            >
                                <p className="video-item-title">{v.title}</p>
                                <div className="video-item-btns">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(v, 'video'); }} className="small-edit-btn">Editar</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(v._id, 'video'); }} className="small-delete-btn">Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gestión de Eventos Institucionales */}
            <section className="admin-section" style={{ maxHeight: 'none', height: 'auto', marginTop: '25px' }}>
                <h2 className="section-title">
                    <span className="material-symbols-outlined">event</span> Registrar Nuevo Evento Público (Inicio)
                </h2>
                
                <form onSubmit={(e) => { e.preventDefault(); handleCreateEvent(); }} className="event-form-card" style={{ padding: '0px' }}>
                    <div className="event-inputs-grid">
                        <div className="form-group">
                            <label>Título del Evento (Requerido)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Inovatec ITGAM 2026" 
                                value={eventTitle} 
                                onChange={(e) => setEventTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha / Mes (Requerido)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: 15 OCT o Noviembre" 
                                value={eventDate} 
                                onChange={(e) => setEventDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descripción del Evento (Opcional)</label>
                        <textarea 
                            placeholder="Agregar descripción corta del evento..." 
                            value={eventDescription} 
                            onChange={(e) => setEventDescription(e.target.value)}
                        />
                    </div>

                    <div className="event-submit-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                        <button type="submit" className="btn-primary">
                            Crear Evento Público
                        </button>
                    </div>
                </form>
            </section>

            <section className="admin-section" style={{ maxHeight: 'none', height: 'auto', marginTop: '25px' }}>
                <h2 className="section-title">Eventos Públicos Activos</h2>
                <div className="events-admin-list">
                    {events.length > 0 ? events.map(event => (
                        <div key={event._id} className="event-admin-row">
                            <div className="event-row-text">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                        {event.date}
                                    </span>
                                    <strong>{event.title}</strong>
                                </div>
                                <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                                    <span>{event.description}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(event._id, 'event')}
                                className="btn-event-delete"
                            >
                                Eliminar
                            </button>
                        </div>
                    )) : <p className="no-data-text">No hay eventos públicos registrados en el sistema actualmente.</p>}
                </div>
            </section>
        </div>
    );
};

export default GestionContenido;