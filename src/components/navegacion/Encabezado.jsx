import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Nav, Navbar, Offcanvas, Modal, Button } from "react-bootstrap";
import Logo from "../../assets/Logo.png";
import { supabase } from "../database/supabaseconfig.js";
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';

const Encabezado = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarAcercaDe, setMostrarAcercaDe] = useState(false);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
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
      navigate("/");
    } catch (err) {
      console.error("Error cerrando sesión:", err.message);
    }
  };

  const manejarAgendarCita = () => {
    const usuarioActivo = localStorage.getItem("usuario-supabase");
    if (!usuarioActivo) {
      setToast({
        mostrar: true,
        mensaje: "Para agendar una cita, por favor inicia sesión en la aplicación.",
        tipo: "advertencia",
      });
      return;
    }
    manejarNavegacion("/agendar-cita");
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
          className="text-white nav-link-animated"
          style={mostrarMenu ? { color: '#A4841C' } : {}}
        >
          <i className="bi-person-fill-lock me-2"></i>
          Iniciar sesión
        </Nav.Link>
      </Nav>
    );
  } else {
    const rol = localStorage.getItem("rol-supabase")?.toLowerCase();
    const usuarioActivo = localStorage.getItem("usuario-supabase");

    contenidoMenu = (
      <>
        <Nav className="ms-auto pe-2 align-items-center">
          <Nav.Link
            onClick={() => manejarNavegacion("/")}
            className="text-white nav-link-animated"
            style={mostrarMenu ? { color: '#A4841C' } : {}}
          >
            {mostrarMenu ? <i className="bi-house-fill me-2"></i> : null}
            <strong>Inicio</strong>
          </Nav.Link>

          {rol === 'cliente' && (
            <>
              <Nav.Link
                onClick={() => manejarNavegacion("/historial-citas")}
                className="text-white nav-link-animated"
              >
                {mostrarMenu ? <i className="bi-clock-history me-2"></i> : null}
                <strong>Historial</strong>
              </Nav.Link>
              <Nav.Link
                onClick={() => manejarNavegacion("/perfil-cliente")}
                className="text-white nav-link-animated"
              >
                {mostrarMenu ? <i className="bi-person-circle me-2"></i> : null}
                <strong>Mi Perfil</strong>
              </Nav.Link>
              <Nav.Link
                onClick={manejarAgendarCita}
                className="text-white nav-link-animated"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-calendar-check-fill me-2"></i> : null}
                <strong>Agendar Cita</strong>
              </Nav.Link>
            </>
          )}

          {!usuarioActivo && (
            <Nav.Link
              onClick={() => setMostrarAcercaDe(true)}
              className="text-white nav-link-animated"
            >
              {mostrarMenu ? <i className="bi-info-circle-fill me-2"></i> : null}
              <strong>Acerca de Nosotros</strong>
            </Nav.Link>
          )}

          {!usuarioActivo && (
            <Nav.Link
              onClick={() => manejarNavegacion("/login")}
              className="text-white nav-link-animated"
              style={mostrarMenu ? { color: '#A4841C' } : {}}
            >
              {mostrarMenu ? <i className="bi-person-fill-lock me-2"></i> : null}
              <strong>Iniciar sesión</strong>
            </Nav.Link>
          )}

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

          {/* Ícono cerrar sesión en barra superior (desktop) */}
          {usuarioActivo && !mostrarMenu && (
            <Nav.Link
              onClick={cerrarSesion}
              className="text-white nav-link-animated"
              title="Cerrar Sesión"
            >
              <i className="bi-box-arrow-right me-2"></i>
            </Nav.Link>
          )}

          <hr />
        </Nav>

        {/* Información de usuario y botón cerrar sesión */}
        {mostrarMenu && usuarioActivo && (
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
    <>
      <style>
        {`
          .nav-link-animated {
            color: #e0e0e0 !important;
            transition: all 0.3s ease;
            display: inline-block;
          }
          .nav-link-animated:hover {
            color: #A4841C !important;
            transform: translateY(-2px) scale(1.05);
          }
        `}
      </style>
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

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ mostrar: false, mensaje: "", tipo: "" })}
      />

      {/* Modal Acerca de Nosotros (Global) */}
      <Modal show={mostrarAcercaDe} onHide={() => setMostrarAcercaDe(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title style={{ color: '#A4841C' }}>Sobre Ouroboros Car</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-4">
            <i className="bi bi-shield-check display-1" style={{ color: '#A4841C' }}></i>
          </div>
          <h4>Nuestra Historia</h4>
          <p className="text-white">
            Fundada con la pasión por la excelencia automotriz, Ouroboros Car ha sido el referente en vehículos de alta calidad y confianza. Nuestro nombre simboliza el ciclo de renovación y la durabilidad de nuestras máquinas.
          </p>
          <hr className="border-secondary" />
          <h5>Nuestra Misión</h5>
          <p className="small">
            Brindar soluciones de movilidad con transparencia, ofreciendo un inventario rigurosamente seleccionado para garantizar que cada cliente encuentre no solo un transporte, sino un compañero de camino.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="outline-warning" onClick={() => setMostrarAcercaDe(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Encabezado;
