import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Nav, Navbar, Offcanvas, Modal, Button } from "react-bootstrap";
import Logo from "../../assets/Logo.png";
import { supabase } from "../database/supabaseconfig.js";
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';

const normalizarEstadoCita = (estado) => {
  const valor = String(estado || "").toLowerCase().trim();

  if (valor.includes("proceso") || valor.includes("curso") || valor.includes("repar")) {
    return "En Proceso";
  }

  if (valor.includes("complet") || valor.includes("finaliz") || valor.includes("entreg")) {
    return "Completada";
  }

  return "Pendiente";
};

const obtenerClaveNotificacionesCliente = (idCliente) => `notificaciones-citas-cliente-${idCliente}`;

const leerCitasNotificadas = (idCliente) => {
  try {
    const guardadas = localStorage.getItem(obtenerClaveNotificacionesCliente(idCliente));
    return new Set(JSON.parse(guardadas || "[]"));
  } catch {
    return new Set();
  }
};

const guardarCitasNotificadas = (idCliente, citas) => {
  localStorage.setItem(
    obtenerClaveNotificacionesCliente(idCliente),
    JSON.stringify(Array.from(citas))
  );
};

const Encabezado = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarAcercaDe, setMostrarAcercaDe] = useState(false);
  const [mostrarModalCerrarSesion, setMostrarModalCerrarSesion] = useState(false);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const navigate = useNavigate();
  const location = useLocation(); // Para detectar la ruta actual
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const estadosCitasRef = useRef(new Map());

  useEffect(() => {
    let active = true;

    const cargarFoto = async () => {
      const usuarioActivo = localStorage.getItem("usuario-supabase");
      const rol = localStorage.getItem("rol-supabase")?.toLowerCase();

      if (usuarioActivo && rol === 'cliente') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && active) {
            const { data, error } = await supabase
              .from('clientes')
              .select('foto_cliente')
              .eq('profile_id', user.id)
              .maybeSingle();

            if (active) {
              if (data && !error) {
                setFotoPerfil(data.foto_cliente);
              } else {
                setFotoPerfil(null);
              }
            }
          }
        } catch (err) {
          console.error("Error al cargar foto de perfil en cabecera:", err);
          if (active) setFotoPerfil(null);
        }
      } else {
        if (active) setFotoPerfil(null);
      }
    };

    cargarFoto();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        cargarFoto();
      } else if (event === 'SIGNED_OUT') {
        setFotoPerfil(null);
      }
    });

    const manejarActualizacionFoto = (e) => {
      if (active) setFotoPerfil(e.detail?.foto_cliente || null);
    };

    window.addEventListener("actualizacion-foto-perfil", manejarActualizacionFoto);

    return () => {
      active = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
      window.removeEventListener("actualizacion-foto-perfil", manejarActualizacionFoto);
    };
  }, [location.pathname]);

  useEffect(() => {
    let activo = true;
    let canalRealtime = null;

    const suscribirNotificacionesCliente = async () => {
      const rolActual = localStorage.getItem("rol-supabase")?.toLowerCase();
      const usuarioActivo = localStorage.getItem("usuario-supabase");

      if (!usuarioActivo || rolActual !== "cliente") {
        estadosCitasRef.current = new Map();
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !activo) return;

        const { data: cliente, error: errorCliente } = await supabase
          .from("clientes")
          .select("id_cliente")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (errorCliente || !cliente || !activo) return;

        const idCliente = cliente.id_cliente;
        const citasNotificadas = leerCitasNotificadas(idCliente);

        const { data: citasIniciales, error: errorCitas } = await supabase
          .from("cita")
          .select("id_cita, estado")
          .eq("id_cliente", idCliente);

        if (errorCitas || !activo) return;

        const mapaEstados = new Map();
        (citasIniciales || []).forEach((cita) => {
          const estadoNormalizado = normalizarEstadoCita(cita.estado);
          mapaEstados.set(cita.id_cita, estadoNormalizado);

          if (estadoNormalizado === "Completada") {
            citasNotificadas.add(cita.id_cita);
          }
        });

        estadosCitasRef.current = mapaEstados;
        guardarCitasNotificadas(idCliente, citasNotificadas);

        canalRealtime = supabase
          .channel(`cliente-citas-${idCliente}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "cita",
              filter: `id_cliente=eq.${idCliente}`
            },
            (payload) => {
              const idCita = payload.new?.id_cita;
              if (!idCita) return;

              const estadoAnterior = estadosCitasRef.current.get(idCita);
              const estadoNuevo = normalizarEstadoCita(payload.new?.estado);

              estadosCitasRef.current.set(idCita, estadoNuevo);

              if (estadoAnterior !== "Completada" && estadoNuevo === "Completada") {
                const notificadasActuales = leerCitasNotificadas(idCliente);

                if (!notificadasActuales.has(idCita)) {
                  notificadasActuales.add(idCita);
                  guardarCitasNotificadas(idCliente, notificadasActuales);

                  setToast({
                    mostrar: true,
                    mensaje: `Tu cita #${idCita} ya fue completada. Puedes revisar el detalle en Mis Citas.`,
                    tipo: "exito",
                  });
                }
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error("Error al suscribir notificaciones de citas:", error);
      }
    };

    suscribirNotificacionesCliente();

    return () => {
      activo = false;
      if (canalRealtime) {
        supabase.removeChannel(canalRealtime);
      }
    };
  }, [location.pathname]);

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
      setMostrarModalCerrarSesion(false);
      setToast({ mostrar: false, mensaje: "", tipo: "" });
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
  const rol = localStorage.getItem("rol-supabase")?.toLowerCase();
  const usuarioActivo = localStorage.getItem("usuario-supabase");

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
    contenidoMenu = (
      <>
        <Nav className="ms-auto pe-2 align-items-center">
          <Nav.Link
            onClick={() => manejarNavegacion(rol === 'admin' ? "/inicio-admin" : "/")}
            className="text-white nav-link-animated"
            style={mostrarMenu ? { color: '#A4841C' } : {}}
          >
            {mostrarMenu ? <i className="bi-house-fill me-2"></i> : null}
            <strong>{rol === 'admin' ? 'Panel de Control' : 'Inicio'}</strong>
          </Nav.Link>

          {rol === 'cliente' && (
            <>
              <Nav.Link
                onClick={() => manejarNavegacion("/mis-vehiculos")}
                className="text-white nav-link-animated"
              >
                {mostrarMenu ? <i className="bi-car-front me-2"></i> : null}
                <strong>Mis Vehículos</strong>
              </Nav.Link>
              <Nav.Link
                onClick={() => manejarNavegacion("/historial-citas")}
                className="text-white nav-link-animated"
              >
                {mostrarMenu ? <i className="bi-clock-history me-2"></i> : null}
                <strong>Mis Citas</strong>
              </Nav.Link>
              <Nav.Link
                onClick={manejarAgendarCita}
                className="text-white nav-link-animated"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-calendar-check-fill me-2"></i> : null}
                <strong>Agendar Cita</strong>
              </Nav.Link>
              <Nav.Link
                onClick={() => manejarNavegacion("/perfil-cliente")}
                className="text-white nav-link-animated d-flex align-items-center"
                style={{ padding: mostrarMenu ? '8px 16px' : '0 10px' }}
                title="Mi Perfil"
              >
                {mostrarMenu ? (
                  <div className="d-flex align-items-center gap-2">
                    {fotoPerfil ? (
                      <img
                        src={fotoPerfil}
                        alt="Perfil"
                        className="rounded-circle border border-warning avatar-hover"
                        style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi-person-circle me-1" style={{ fontSize: '20px' }}></i>
                    )}
                    <strong>Mi Perfil</strong>
                  </div>
                ) : (
                  <div className="position-relative">
                    {fotoPerfil ? (
                      <img
                        src={fotoPerfil}
                        alt="Perfil"
                        className="rounded-circle border border-warning avatar-hover"
                        style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle border border-warning bg-secondary text-white avatar-hover"
                        style={{ width: '38px', height: '38px' }}
                      >
                        <i className="bi bi-person-fill" style={{ fontSize: '18px' }}></i>
                      </div>
                    )}
                  </div>
                )}
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
                <strong>Inventario</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/clientes")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-people-fill me-2"></i> : null}
                <strong>Clientes</strong>
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

              <Nav.Link
                onClick={() => manejarNavegacion("/servicios-mantenimiento")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-gear-fill me-2"></i> : null}
                <strong>Servicios</strong>
              </Nav.Link>
            </>
          )}

          {rol === 'mecanico' && (
            <>
              <Nav.Link
                onClick={() => manejarNavegacion("/citas-mecanico")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-calendar-check-fill me-2"></i> : null}
                <strong>Mis Citas</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/retiro-repuestos")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-box-seam me-2"></i> : null}
                <strong>Retirar Repuestos</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/repuestos")}
                className="text-white"
                style={mostrarMenu ? { color: '#A4841C' } : {}}
              >
                {mostrarMenu ? <i className="bi-tools me-2"></i> : null}
                <strong>Repuestos</strong>
              </Nav.Link>
            </>
          )}

          {/* Ícono cerrar sesión en barra superior (desktop) */}
          {usuarioActivo && !mostrarMenu && (
            <Nav.Link
              onClick={() => setMostrarModalCerrarSesion(true)}
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
            <div className="d-flex align-items-center gap-3 mb-2">
              {rol === 'cliente' && (
                fotoPerfil ? (
                  <img
                    src={fotoPerfil}
                    alt="Perfil"
                    className="rounded-circle border border-warning"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle border border-warning bg-secondary text-white"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <i className="bi bi-person-fill" style={{ fontSize: '20px' }}></i>
                  </div>
                )
              )}
              <div className="text-truncate">
                <p className="mb-0 fw-bold" style={{ color: '#A4841C' }}>
                  {rol === 'cliente' ? 'Cliente' : rol === 'admin' ? 'Administrador' : 'Mecánico'}
                </p>
                <p className="mb-0 small text-muted text-truncate">
                  {localStorage.getItem("usuario-supabase")?.toLowerCase() || "Usuario"}
                </p>
              </div>
            </div>

            <button
              className="btn btn-outline-danger mt-3 w-100"
              onClick={() => setMostrarModalCerrarSesion(true)}
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
          .avatar-hover {
            transition: all 0.3s ease;
          }
          .avatar-hover:hover {
            transform: scale(1.1);
            box-shadow: 0 0 10px rgba(164, 132, 28, 0.8) !important;
            border-color: #ffffff !important;
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
          onClick={() => manejarNavegacion(rol === 'admin' ? "/inicio-admin" : "/")}
          className="text-white fw-bold d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          <img
            alt=""
            src={Logo}
            className="d-inline-block me-2"
            style={{ height: "70px", width: "auto", marginTop: "-5px", marginBottom: "-5px" }}
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
      {/* Modal Confirmación Cerrar Sesión */}
      <Modal
        show={mostrarModalCerrarSesion}
        onHide={() => setMostrarModalCerrarSesion(false)}
        centered
        contentClassName="border-0"
      >
        <Modal.Header
          closeButton
          className="border-0"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)', borderBottom: '1px solid rgba(164,132,28,0.3) !important' }}
        >
          <Modal.Title className="d-flex align-items-center gap-2" style={{ color: '#A4841C' }}>
            <i className="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="text-center py-4"
          style={{ background: '#141414', color: '#e0e0e0' }}
        >
          <div className="mb-3">
            <i
              className="bi bi-exclamation-circle"
              style={{ fontSize: '3.5rem', color: '#A4841C' }}
            ></i>
          </div>
          <h5 className="fw-bold mb-2" style={{ color: '#ffffff' }}>¿Deseas cerrar sesión?</h5>
          <p className="mb-0" style={{ color: '#b0b0b0', fontSize: '0.95rem' }}>
            Se cerrará tu sesión actual en Ouroboros Car.<br />Tendrás que iniciar sesión nuevamente para acceder.
          </p>
        </Modal.Body>
        <Modal.Footer
          className="border-0 d-flex gap-2 justify-content-center pb-4"
          style={{ background: '#141414' }}
        >
          <Button
            variant="secondary"
            className="px-4 py-2"
            style={{ minWidth: '120px', borderRadius: '8px' }}
            onClick={() => setMostrarModalCerrarSesion(false)}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="px-4 py-2"
            style={{ minWidth: '120px', borderRadius: '8px' }}
            onClick={cerrarSesion}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Sí, cerrar sesión
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Encabezado;
