import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home"; 
import Login from "./pages/Login";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardAlumno from "./pages/DashboardAlumno";
import DashboardProfesor from "./pages/DashboardProfesor";
import DashboardAdmin from "./pages/AdminDashboard";
import DashboardPsicologa from "./pages/DashboardPsicologa";
import ProtectedRoute from "./components/ProtectedRoute"; 
import AsistenciaLanding from "./pages/AsistenciaLanding"; 


function App() {
  return (
    <Router>
      <Routes>
        {/* Página pública principal */}
        <Route path="/" element={<Home />} />

        {/* Autenticación */}
        <Route path="/activar" element={<ActivateAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Ruta para el registro rápido de asistencia con QR */}
        <Route
          path="/asistencia/:token"
          element={
            <ProtectedRoute role="profesor">
              <AsistenciaLanding />
            </ProtectedRoute>
          }
        />

        {/* Dashboards protegidos */}
        <Route
          path="/dashboard/alumno"
          element={
            <ProtectedRoute role="alumno">
              <DashboardAlumno />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profesor"
          element={
            <ProtectedRoute role="profesor">
              <DashboardProfesor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute role="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/psicologa"
          element={
            <ProtectedRoute role="psicologa">
              <DashboardPsicologa />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}



export default App;
