import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardAlumno from "./pages/DashboardAlumno";
import DashboardProfesor from "./pages/DashboardProfesor";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardPsicologa from "./pages/DashboardPsicologa";
import ProtectedRoute from "./components/ProtectedRoute"; 

function App() {
  return (
    <Router>
      <Routes>
       
        <Route path="/" element={<Navigate to="/activar" replace />} />

       
        <Route path="/activar" element={<ActivateAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        
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
