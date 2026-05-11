import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Encabezado from "./components/navegacion/Encabezado";

import Inicio from "./components/views/Inicio";
import Vehiculos from "./components/views/Vehiculos";
import Repuestos from "./components/views/Repuestos";
import Mecanicos from "./components/views/Mecanicos";
import RegistroGeneral from "./components/views/RegistroGeneral";
import Login from "./components/views/Login";
import RutaProtegida from "./components/rutas/RutaProtegida";
import Pagina404 from "./components/views/Pagina404";
import NoAutorizado from "./components/views/NoAutorizado";

import "./App.css";

const App = () => {
  return (
    <Router>
      <Encabezado />

      <main className="margen-superior-main">
        <Routes>
          <Route path="/login" element={<Login />} />
        <Route path="/no-autorizado" element={<NoAutorizado />} />

          <Route path="/" element={<RutaProtegida allowedRoles={['admin','cliente','mecanico']}><Inicio /></RutaProtegida>} />
          <Route path="/vehiculos" element={<RutaProtegida allowedRoles={['admin']}><Vehiculos /></RutaProtegida>} />
          <Route
            path="/categorias-vehiculo"
            element={<RutaProtegida allowedRoles={['admin']}><Navigate to="/vehiculos" replace /></RutaProtegida>}
          />
          <Route path="/repuestos" element={<RutaProtegida allowedRoles={['admin']}><Repuestos /></RutaProtegida>} />
          <Route path="/mecanicos" element={<RutaProtegida allowedRoles={['admin']}><Mecanicos /></RutaProtegida>} />
          <Route path="/registro" element={<RutaProtegida allowedRoles={['admin']}><RegistroGeneral /></RutaProtegida>} />
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;