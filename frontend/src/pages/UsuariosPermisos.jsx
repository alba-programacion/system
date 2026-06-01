import React, { useState, useEffect } from 'react';
import api from '../api/axios'; 
import '../styles/UsuariosPermisos.css';

const UsuariosPermisos = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('Todos');
    const [status, setStatus] = useState('Todos');
    
    // Estados para el Modal de creación
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({
        nombres: '',
        apPaterno: '',
        apMaterno: '',
        correoInstitucional: '',
        numeroControl: '',
        roles: ['alumno'],
        password: ''
    });

    // Carga de datos inicial y por filtros
    const loadData = async () => {
        try {
            const res = await api.get('/admin/users', {
                params: { search, role, status }
            });
            setUsers(res.data);
        } catch (error) {
            console.error("Error al cargar usuarios", error);
        }
    };

    // Carga de datos inicial y por filtros
    useEffect(() => {
        // Definimos la función dentro para que el linter sepa que 
        // solo se usa aquí y no cause cascadas de renderizado.
        const loadData = async () => {
            try {
                const res = await api.get('/admin/users', {
                    params: { search, role, status }
                });
                setUsers(res.data);
            } catch (error) {
                console.error("Error al cargar usuarios", error);
            }
        };

        loadData();
    }, [search, role, status]); // Se ejecuta cuando cambian los filtros

    // Cambiar estado de cuenta (Bloquear/Desbloquear)
    const handleStatus = async (id) => {
        try {
            await api.patch(`/admin/users/${id}/status`);
            loadData(); // Refrescar lista
        } catch (error) {
            console.error("Error al actualizar estado", error);
            alert("No se pudo cambiar el estado del usuario");
        }
    };

    // Crear nuevo usuario
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            setShowModal(false); // Cerrar modal
            // Limpiar formulario
            setNewUser({
                nombres: '', apPaterno: '', apMaterno: '',
                correoInstitucional: '', numeroControl: '',
                roles: ['alumno'], password: ''
            });
            loadData(); // Recargar la tabla
            alert("Usuario creado exitosamente");
        } catch (error) {
            console.error("Error al crear usuario", error);
            alert(error.response?.data?.message || "Error al crear usuario. Verifica que el número de control no esté duplicado.");
        }
    };

    return (
        <div className="up-container">
            <header className="up-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h2>Usuarios y Permisos</h2>
                        <p>Panel de control de acceso institucional del ITGAM</p>
                    </div>
                    <button className="btn-add-user" onClick={() => setShowModal(true)}>
                        <span className="material-symbols-outlined">person_add</span>
                        Nuevo Usuario
                    </button>
                </div>
            </header>

            <section className="up-filters">
                <div className="filter-group">
                    <label>Búsqueda rápida</label>
                    <input 
                        type="text" 
                        placeholder="Nombre, correo o control..." 
                        className="up-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>Filtrar Rol</label>
                    <select className="up-select" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="Todos">Todos los roles</option>
                        <option value="admin">Administrador</option>
                        <option value="profesor">Docente</option>
                        <option value="alumno">Alumno</option>
                        <option value="jefe departamento">Jefe de Depto.</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Estado de Cuenta</label>
                    <select className="up-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="Todos">Cualquiera</option>
                        <option value="activa">Activa</option>
                        <option value="bloqueada">Bloqueada</option>
                    </select>
                </div>
            </section>

            <div className="up-table-wrapper">
                <table className="up-table">
                    <thead>
                        <tr>
                            <th>Identidad</th>
                            <th>N° Control</th>
                            <th>Roles Asignados</th>
                            <th>Estado</th>
                            <th style={{textAlign: 'right'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">{u.nombres ? u.nombres[0] : 'U'}</div>
                                            <div className="user-meta">
                                                <h4>{u.nombres} {u.apPaterno}</h4>
                                                <p>{u.correoInstitucional}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{u.numeroControl}</td>
                                    <td>
                                        <div className="roles-wrapper">
                                            {u.roles && u.roles.map(r => (
                                                <span key={r} className={`badge badge-${r.replace(/\s+/g, '-')}`}>{r}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`status status-${u.cuenta}`}>
                                            <span className="status-dot"></span>
                                            {u.cuenta}
                                        </div>
                                    </td>
                                    <td style={{textAlign: 'right'}}>
                                        <button 
                                            className={`action-btn ${u.cuenta === 'activa' ? 'btn-lock' : ''}`}
                                            onClick={() => handleStatus(u._id)}
                                            title={u.cuenta === 'activa' ? 'Bloquear usuario' : 'Desbloquear usuario'}
                                        >
                                            <span className="material-symbols-outlined">
                                                {u.cuenta === 'bloqueada' ? 'lock_open' : 'lock'}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No se encontraron usuarios</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE REGISTRO DE USUARIO */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Registrar Nuevo Usuario</h3>
                            <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Nombre(s)</label>
                                <input type="text" required value={newUser.nombres} onChange={e => setNewUser({...newUser, nombres: e.target.value})} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Apellido Paterno</label>
                                    <input type="text" required value={newUser.apPaterno} onChange={e => setNewUser({...newUser, apPaterno: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Apellido Materno</label>
                                    <input type="text" value={newUser.apMaterno} onChange={e => setNewUser({...newUser, apMaterno: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Correo Institucional</label>
                                <input type="email" required value={newUser.correoInstitucional} onChange={e => setNewUser({...newUser, correoInstitucional: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Número de Control</label>
                                <input type="text" required value={newUser.numeroControl} onChange={e => setNewUser({...newUser, numeroControl: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Asignar Rol</label>
                                <select value={newUser.roles[0]} onChange={e => setNewUser({...newUser, roles: [e.target.value]})}>
                                    <option value="alumno">Alumno</option>
                                    <option value="profesor">Docente</option>
                                    <option value="admin">Administrador</option>
                                    <option value="jefe departamento">Jefe de Depto.</option>
                                    <option value="psicologa">Psicóloga</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosPermisos;