import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Encabezado from "./components/navegacion/Encabezado";

import Inicio from "./components/views/Inicio";
import Vehiculos from "./components/views/Vehiculos";
import CategoriasVehiculo from "./components/views/Categoria";
import CategoriasRepuestos from "./components/views/CategoriaRespuestos";
import Repuestos from "./components/views/Repuestos";
import Mecanicos from "./components/views/Mecanicos";
import RegistroGeneral from "./components/views/RegistroGeneral";
import Login from "./components/views/Login";
import RutaProtegida from "./components/rutas/RutaProtegida";
import Pagina404 from "./components/views/Pagina404";

import "./App.css";

const App = () => {
  return (
    <Router>
      <Encabezado />

      <main className="margen-superior-main">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<RutaProtegida><Inicio /></RutaProtegida>} />
          <Route path="/vehiculos" element={<RutaProtegida><Vehiculos /></RutaProtegida>} />
          <Route path="/categorias-vehiculo" element={<RutaProtegida><CategoriasVehiculo /></RutaProtegida>} />
          <Route path="/categorias-repuestos" element={<RutaProtegida><CategoriasRepuestos /></RutaProtegida>} />
          <Route path="/repuestos" element={<RutaProtegida><Repuestos /></RutaProtegida>} />
          <Route path="/mecanicos" element={<RutaProtegida><Mecanicos /></RutaProtegida>} />
          <Route path="/registro" element={<RutaProtegida><RegistroGeneral /></RutaProtegida>} />
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;