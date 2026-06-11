import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Encabezado from "./components/navegacion/Encabezado";

import Inicio from "./components/views/Inicio";
import Vehiculos from "./components/views/Vehiculos";
import ClientesAdmin from "./components/views/ClientesAdmin";
import Repuestos from "./components/views/Repuestos";
import CatalogoPublico from "./components/views/CatalogoPublico";
import Mecanicos from "./components/views/Mecanicos";
import RegistroGeneral from "./components/views/RegistroGeneral";
import Login from "./components/views/Login";
import VistaCliente from "./components/clientes/VistaCliente";
import AgendarCita from "./components/views/AgendarCita";
import HistorialCitas from "./components/views/HistorialCitas";
import RutaProtegida from "./components/rutas/RutaProtegida";
import Pagina404 from "./components/views/Pagina404";
import NoAutorizado from "./components/views/NoAutorizado";
import InicioAdmin from "./components/views/InicioAdmin";
import ServiciosMantenimientoAdmin from './components/views/ServiciosMantenimientoAdmin';


import "./App.css";

const App = () => {
  return (
    <Router>
      <style>
        {`
          body, h1, h2, h3, h4, h5, h6, p, span, div, button, input, select, textarea, .nav-link, .modal-title, .card-title, strong {
            font-family: 'Times New Roman', Times, serif !important;
          }
        `}
      </style>
      <Encabezado />

      <main className="margen-superior-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/no-autorizado" element={<NoAutorizado />} />

          {/* Vista Pública: Catálogo */}
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<CatalogoPublico />} />

          {/* Rutas Privadas del Cliente */}
          <Route path="/perfil-cliente" element={<RutaProtegida allowedRoles={['cliente']}><VistaCliente /></RutaProtegida>} />
          <Route path="/agendar-cita" element={<RutaProtegida allowedRoles={['cliente']}><AgendarCita /></RutaProtegida>} />
          <Route path="/historial-citas" element={<RutaProtegida allowedRoles={['cliente']}><HistorialCitas /></RutaProtegida>} />

          {/* Rutas Administrativas y Técnicas */}
          <Route path="/vehiculos" element={<RutaProtegida allowedRoles={['admin']}><Vehiculos /></RutaProtegida>} />
          <Route path="/inicio-admin" element={<InicioAdmin />} />
          <Route path="/servicios-mantenimiento" element={<RutaProtegida allowedRoles={['admin']}><ServiciosMantenimientoAdmin /></RutaProtegida>} />

          <Route path="/clientes" element={<RutaProtegida allowedRoles={['admin']}><ClientesAdmin /></RutaProtegida>} />
          <Route
            path="/categorias-vehiculo"
            element={<RutaProtegida allowedRoles={['admin']}><Navigate to="/vehiculos" replace /></RutaProtegida>}
          />
          <Route path="/repuestos" element={<RutaProtegida allowedRoles={['admin', 'mecanico']}><Repuestos /></RutaProtegida>} />
          <Route path="/mecanicos" element={<RutaProtegida allowedRoles={['admin', 'mecanico']}><Mecanicos /></RutaProtegida>} />
          <Route path="/registro" element={<RutaProtegida allowedRoles={['admin']}><RegistroGeneral /></RutaProtegida>} />
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;