import React from 'react';
import logoITGAM from '../assets/logo1.jpg';
import '../styles/Sidebar.css';

const Sidebar = ({ activePage, onPageChange }) => {
  return (
    <aside className="admin-sidebar">

      {/* Logo e Identidad */}
      <div className="sidebar-header">
        <img src={logoITGAM} alt="Logo ITGAM" />
        <h1 className="sidebar-logo">ITGAM Admin</h1>
        <p className="sidebar-tagline">Scholar Tech Ledger</p>
      </div>

      {/* Navegación Principal */}
      <nav className="sidebar-nav">
        <button
          type="button"
          onClick={() => onPageChange('dashboard')}
          className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="nav-label">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange('usuarios')}
          className={`nav-item ${activePage === 'usuarios' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">admin_panel_settings</span>
          <span className="nav-label">Usuarios y Permisos</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange('evidence')}
          className={`nav-item ${activePage === 'evidence' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">fact_check</span>
          <span className="nav-label">Validación</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange('videos')}
          className={`nav-item ${activePage === 'videos' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">perm_media</span>
          <span className="nav-label">Contenido Público</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange('formatos')}
          className={`nav-item ${activePage === 'formatos' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">description</span>
          <span className="nav-label">Formatos</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange('reports')}
          className={`nav-item ${activePage === 'reports' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="nav-label">Reportes</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange('config')}
          className={`nav-item ${activePage === 'config' ? 'active' : ''}`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="nav-label">Configuración</span>
        </button>

        <button
          type="button"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="nav-item logout-btn"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="nav-label">Cerrar Sesión</span>
        </button>
      </nav>

      {/* Footer del Perfil */}
      <div className="sidebar-footer">
        <div className="admin-avatar">
          <span className="material-symbols-outlined">shield_person</span>
        </div>
        <div className="admin-details">
          <p className="admin-name">Aaron Guzmán</p>
          <p className="admin-email">itgam.edu.mx</p>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;