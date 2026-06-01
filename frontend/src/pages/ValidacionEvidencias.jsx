import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import '../styles/ValidacionEvidencias.css';

const ValidacionEvidencias = () => {
    const [evidencias, setEvidencias] = useState([]);
    const [selected, setSelected] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [obs, setObs] = useState('');

    // 1. Un solo efecto que maneja la carga de datos
    useEffect(() => {
        let isMounted = true; // Para evitar actualizar estado si el componente se desmonta

        const loadData = async () => {
            try {
                const response = await api.get('/admin/evidencias', {
                    params: { estado: statusFilter }
                });
                
                if (isMounted) {
                    setEvidencias(response.data);
                }
            } catch (err) {
                console.error("Error al obtener evidencias:", err);
            }
        };

        loadData();

        return () => { isMounted = false; }; // Función de limpieza
    }, [statusFilter]); // Solo se vuelve a ejecutar si el filtro cambia

    // 2. Manejador de acciones (Aprobar/Rechazar)
    const handleAction = async (nuevoEstado) => {
        if (!selected) return;
        try {
            await api.patch(`/admin/evidencias/${selected._id}`, {
                estado: nuevoEstado,
                observaciones: obs
            });
            
            setObs('');
            alert(`Registro ${nuevoEstado} con éxito`);
            setSelected(null);
            
            // Recarga manual después de una acción
            const response = await api.get('/admin/evidencias', {
                params: { estado: statusFilter }
            });
            setEvidencias(response.data);
            
        } catch (err) {
            console.error("Error al actualizar:", err);
            alert("No se pudo procesar la acción.");
        }
    };

    return (
        <div className="val-container">
            <header className="val-header">
                <div>
                    <h2>Scholar Tech Ledger</h2>
                    <p style={{color: '#64748b'}}>ITGAM - Validación de Evidencias</p>
                </div>
            </header>

            <div className="val-filters">
                <div className="val-filter-group">
                    <label>Estado</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="Todos">Todos</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Aprobada">Aprobada</option>
                        <option value="Rechazada">Rechazada</option>
                    </select>
                </div>
            </div>

            <div className="val-grid">
                <div className="val-table-card">
                    <table className="val-table">
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Evidencia</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evidencias.map((ev) => (
                                <tr 
                                    key={ev._id} 
                                    onClick={() => setSelected(ev)}
                                    style={{ 
                                        cursor: 'pointer',
                                        backgroundColor: selected?._id === ev._id ? '#f1f5f9' : 'transparent'
                                    }}
                                >
                                    <td>
                                        <div style={{fontWeight: '700'}}>{`${ev.alumno?.nombres} ${ev.alumno?.apPaterno}`}</div>
                                        <div style={{fontSize: '0.7rem', color: '#64748b'}}>{ev.alumno?.numeroControl}</div>
                                    </td>
                                    <td>{ev.tipoEvidencia}</td>
                                    <td>
                                        <span className={`status-badge status-${ev.estado.toLowerCase()}`}>
                                            {ev.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selected ? (
                    <aside className="review-sidebar">
                        <h3>Revisión</h3>
                        <div className="doc-preview" onClick={() => window.open(selected.archivoUrl, '_blank')}>
                            <span className="material-symbols-outlined">description</span>
                            <p>{selected.archivoNombre || 'Ver Documento'}</p>
                        </div>
                        <textarea 
                            value={obs}
                            onChange={(e) => setObs(e.target.value)}
                            placeholder="Notas de validación..."
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                        />
                        <div className="sidebar-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="btn-reject" onClick={() => handleAction('Rechazada')}>Rechazar</button>
                            <button className="btn-approve" onClick={() => handleAction('Aprobada')}>Aprobar</button>
                        </div>
                    </aside>
                ) : (
                    <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
                        Selecciona una fila para validar
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValidacionEvidencias;