import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Nav, Navbar, Offcanvas } from "react-bootstrap";
import Logo from "../../assets/Logo.png";
import { supabase } from "../database/supabaseconfig.js";

const Encabezado = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Para detectar la ruta actual

  const manejarToggle = () => setMostrarMenu(!mostrarMenu);

  const manejarNavegacion = (ruta) => {
    navigate(ruta);
    setMostrarMenu(false);
  };

  const cerrarSesion = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.removeItem("usuario-supabase");
      localStorage.removeItem("rol-supabase");
      setMostrarMenu(false);
      navigate("/login");
    } catch (err) {
      console.error("Error cerrando sesión:", err.message);
    }
  };

  // Detectar rutas especiales
  const esLogin = location.pathname === "/login";

  // Contenido del menú
  let contenidoMenu;

  if (esLogin) {
    contenidoMenu = (
      <Nav className="ms-auto pe-2">
        <Nav.Link
          onClick={() => manejarNavegacion("/login")}
          className="text-white"
          style={mostrarMenu ? { color: '#A4841C' } : {}}
        >
          <i className="bi-person-fill-lock me-2"></i>
          Iniciar sesión
        </Nav.Link>
      </Nav>
    );
  } else {
    const rol = localStorage.getItem("rol-supabase")?.toLowerCase();

    contenidoMenu = (
      <>
        <Nav className="ms-auto pe-2">
          <Nav.Link
            onClick={() => manejarNavegacion("/")}
            className="text-white"
            style={mostrarMenu ? { color: '#A4841C' } : {}}
          >
            {mostrarMenu ? <i className="bi-house-fill me-2"></i> : null}
            <strong>Inicio</strong>
          </Nav.Link>

          {rol === 'admin' && (
            <>
              <Nav.Link
                onClick={() => manejarNavegacion("/vehiculos")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-car-front-fill me-2"></i> : null}
                <strong>Vehículos</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/repuestos")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-tools me-2"></i> : null}
                <strong>Repuestos</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/mecanicos")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-person-workspace me-2"></i> : null}
                <strong>Mecánicos</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/registro")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-journal-plus me-2"></i> : null}
                <strong>Registro</strong>
              </Nav.Link>
            </>
          )}

          {/* Ícono cerrar sesión en barra superior */}
          {mostrarMenu ? null : (
            <Nav.Link
              onClick={cerrarSesion}
              className="text-white"
              style={mostrarMenu ? { color: '#A4841C' } : {}}
            >
              <i className="bi-box-arrow-right me-2"></i>
            </Nav.Link>
          )}

          <hr />
        </Nav>

        {/* Información de usuario y botón cerrar sesión */}
        {mostrarMenu && (
          <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#1a1a1a', border: '1px solid #A4841C', color: '#e0e0e0' }}>
            <p className="mb-2">
              <i className="bi-envelope-fill me-2"></i>
              {localStorage.getItem("usuario-supabase")?.toLowerCase() ||
                "Usuario"}
            </p>

            <button
              className="btn btn-outline-danger mt-3 w-100"
              onClick={cerrarSesion}
            >
              <i className="bi-box-arrow-right me-2"></i>
              Cerrar sesión
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <Navbar
      expand="md"
      fixed="top"
      className="shadow-lg"
      variant="dark"
      style={{ backgroundColor: '#1a1a1a', borderBottom: '2px solid #A4841C' }}
    >
      <Container>
        <Navbar.Brand
          onClick={() => manejarNavegacion("/")}
          className="text-white fw-bold d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          <img
            alt=""
            src={Logo}
            className="d-inline-block me-2"
            style={{ height: "110px", width: "auto", marginTop: "-15px", marginBottom: "-15px" }}
          />
        </Navbar.Brand>

        {/* Botón del menú */}
        {!esLogin && (
          <Navbar.Toggle
            aria-controls="menu-offcanvas"
            onClick={manejarToggle}
          />
        )}

        {/* Menú lateral */}
        <Navbar.Offcanvas
          id="menu-offcanvas"
          placement="end"
          show={mostrarMenu}
          onHide={() => setMostrarMenu(false)}
          style={{ backgroundColor: '#121212', color: '#e0e0e0' }}
        >
          <Offcanvas.Header closeButton className="border-bottom border-secondary">
            <Offcanvas.Title style={{ color: '#A4841C' }}>Menú Ouroboros</Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>{contenidoMenu}</Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default Encabezado;
