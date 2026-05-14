import { useEffect, useState, useMemo, useRef } from "react";
import { Container, Row, Col, Button, Card, Carousel, Spinner, InputGroup, Form, Modal, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { supabase } from "../database/supabaseconfig.js";
import NotificacionOperacion from "../rutas/NotificacionOperacion.jsx";

const Inicio = () => {
  const navegar = useNavigate();
  const catalogoRef = useRef(null);

  // Estados para el catálogo integrado
  const [vehiculos, setVehiculos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const { data: catData } = await supabase.from("categoriavehiculos").select("*").order("nombrecat");
      setCategorias(catData || []);

      const { data: vehData } = await supabase.from("vehiculos").select("*").eq("en_catalogo", true).order("id_vehiculo", { ascending: false });
      setVehiculos(vehData || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    cargarDatos();
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const manejarClickAgendar = () => {
    const usuarioActivo = localStorage.getItem("usuario-supabase");
    if (!usuarioActivo) {
      setToast({
        mostrar: true,
        mensaje: "Para agendar una cita de mantenimiento, por favor inicia sesión en tu cuenta.",
        tipo: "advertencia",
      });
      return;
    }
    navegar("/agendar-cita");
  };

  const manejarVerDetalles = (item) => {
    const usuarioActivo = localStorage.getItem("usuario-supabase");
    if (!usuarioActivo) {
      setToast({
        mostrar: true,
        mensaje: "Para conocer las especificaciones completas de este vehículo, por favor inicia sesión.",
        tipo: "advertencia",
      });
      return;
    }
    setVehiculoSeleccionado(item);
    setMostrarDetalles(true);
  };

  const vehiculosFiltrados = useMemo(() => {
    let filtrados = vehiculos;
    if (categoriaActiva !== "Todos") {
      filtrados = filtrados.filter(v => v.id_categoria === parseInt(categoriaActiva));
    }
    if (searchTerm.trim()) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtrados = filtrados.filter(v => 
        v.marca.toLowerCase().includes(lowerCaseSearchTerm) || 
        v.modelo.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtrados;
  }, [vehiculos, searchTerm, categoriaActiva]);

  const irAlCatalogo = () => {
    catalogoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="inicio-container">
      <style>
        {`
          .hero-section {
            height: 90vh;
            position: relative;
            overflow: hidden;
          }
          .hero-carousel, .carousel-inner, .carousel-item {
            height: 90vh;
          }
          .hero-image {
            height: 90vh;
            width: 100%;
            object-fit: cover;
            filter: brightness(0.4);
          }
          .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
            z-index: 5;
            padding-top: 60px;
          }
          .hero-content {
            max-width: 800px;
            animation: fadeInUp 1s ease-out;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .text-gold {
            color: #A4841C;
          }
          .btn-gold {
            background-color: #A4841C;
            border-color: #A4841C;
            color: white;
            padding: 12px 35px;
            font-weight: bold;
            transition: all 0.3s;
          }
          .btn-gold:hover {
            background-color: #8c7018;
            transform: scale(1.05);
          }
          .card-hover-custom:hover .imagen-zoom {
            transform: scale(1.1);
          }
          .btn-categoria {
            transition: 0.3s;
            border-color: #A4841C;
            color: #A4841C;
          }
          .section-title {
            color: #A4841C;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .step-card {
            background-color: #1e1e1e;
            border: 1px solid #333;
            transition: 0.3s;
          }
          .step-card:hover {
            border-color: #A4841C;
          }
          .icon-box {
            font-size: 2.5rem;
            color: #A4841C;
            margin-bottom: 15px;
          }
          .service-card {
            background: linear-gradient(145deg, #1e1e1e, #121212);
            border: none;
            height: 100%;
          }
        `}
      </style>

      {/* SECCIÓN 1: PRESENTACIÓN (HERO) */}
      <section className="hero-section">
        <Carousel fade indicators={false} controls={false} interval={4000} pause={false} className="hero-carousel">
          <Carousel.Item>
            <img className="hero-image" src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920" alt="Lujo 1" />
          </Carousel.Item>
          <Carousel.Item>
            <img className="hero-image" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1920" alt="Lujo 2" />
          </Carousel.Item>
          <Carousel.Item>
            <img className="hero-image" src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1920" alt="Lujo 3" />
          </Carousel.Item>
        </Carousel>

        <div className="hero-overlay">
          <div className="hero-content px-4">
            <h1 className="display-2 fw-bold mb-3">OUROBOROS <span className="text-gold">CAR</span></h1>
            <p className="lead mb-5 fs-4">
              Tu compañero integral en la carretera. Venta, repuestos y mantenimiento de alto nivel.
            </p>
            <Button className="btn-gold shadow-lg" onClick={irAlCatalogo}>
              EXPLORAR CATÁLOGO <i className="bi bi-chevron-right ms-2"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: SERVICIOS DISPONIBLES */}
      <Container className="py-5">
        <h2 className="text-center section-title mb-5">Nuestros Servicios</h2>
        <Row className="g-4 text-center">
          <Col md={4}>
            <Card className="service-card p-4 text-white">
              <div className="icon-box"><i className="bi bi-wrench-adjustable"></i></div>
              <h4>Mantenimiento</h4>
              <p className="text-white">Servicio técnico especializado para mantener tu motor en óptimas condiciones con tecnología de punta.</p>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="service-card p-4 text-white">
              <div className="icon-box"><i className="bi bi-gear-wide-connected"></i></div>
              <h4>Repuestos</h4>
              <p className="text-white">Catálogo completo de piezas originales y certificadas para garantizar la seguridad de tu vehículo.</p>
            </Card>
          </Col>
          <Col md={4}>
            <Card 
              className="service-card p-4 text-white" 
              style={{ cursor: 'pointer' }}
              onClick={manejarClickAgendar}
            >
              <div className="icon-box"><i className="bi bi-calendar-check"></i></div>
              <h4>Citas Online</h4>
              <p className="text-white">Programa tus revisiones desde cualquier lugar. Ahorra tiempo y organiza tu agenda con nosotros.</p>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* SECCIÓN 3: GUÍA DE CITA */}
      <div style={{ backgroundColor: '#1a1a1a' }} className="py-5">
        <Container>
          <h2 className="text-center section-title mb-5">Cómo agendar tu mantenimiento</h2>
          <Row className="g-4">
            <Col md={4}>
              <div className="step-card p-4 rounded text-center h-100 text-white">
                <div className="h2 text-gold fw-bold mb-3">01</div>
                <h5>Cuenta Personal</h5>
                <p className="small text-white">Inicia sesión en la plataforma para acceder a tus datos y el historial de tu auto.</p>
                <Button variant="outline-warning" size="sm" onClick={() => navegar("/login")}>Entrar ahora</Button>
              </div>
            </Col>
            <Col md={4}>
              <div 
                className="step-card p-4 rounded text-center h-100 text-white"
                style={{ cursor: 'pointer' }}
                onClick={manejarClickAgendar}
              >
                <div className="h2 text-gold fw-bold mb-3">02</div>
                <h5>Selecciona el Servicio</h5>
                <p className="small text-white">Escoge el tipo de mantenimiento que requieres y la fecha que mejor te convenga.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="step-card p-4 rounded text-center h-100 text-white">
                <div className="h2 text-gold fw-bold mb-3">03</div>
                <h5>Seguimiento en Vivo</h5>
                <p className="small text-white">Nuestro mecánico notificará cada etapa del proceso en tiempo real a través de la app.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* SECCIÓN 4: CATÁLOGO INTEGRADO (Segunda Vista) */}
      <Container ref={catalogoRef} className="py-5">
        <h2 className="text-center section-title mb-5">Vehículos Disponibles</h2>
        
        <Row className="mb-4 justify-content-center">
          <Col md={10}>
            <InputGroup className="shadow-lg mb-4">
              <InputGroup.Text style={{ backgroundColor: '#2b2b2b', color: '#A4841C', borderColor: '#A4841C' }}>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="¿Qué vehículo buscas hoy?"
                style={{ backgroundColor: '#2b2b2b', borderColor: '#A4841C', color: 'white' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={10} className="text-center mb-5">
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Button 
                variant={categoriaActiva === "Todos" ? "warning" : "outline-warning"}
                className="rounded-pill px-4"
                onClick={() => setCategoriaActiva("Todos")}
              >Todos</Button>
              {categorias.map(cat => (
                <Button 
                  key={cat.id_categoria}
                  variant={categoriaActiva === cat.id_categoria.toString() ? "warning" : "outline-warning"}
                  className="rounded-pill px-4"
                  onClick={() => setCategoriaActiva(cat.id_categoria.toString())}
                >{cat.nombrecat}</Button>
              ))}
            </div>
          </Col>
        </Row>

        {cargando ? (
          <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>
        ) : (
          <Row>
            {vehiculosFiltrados.map((item) => (
              <Col key={item.id_vehiculo} xs={12} sm={6} lg={4} className="mb-4">
                <Card className="h-100 shadow-sm border-0 text-white card-hover-custom" style={{ backgroundColor: '#1e1e1e' }}>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <Card.Img variant="top" src={item.url_imagen} className="imagen-zoom" style={{ height: "220px", objectFit: "cover", transition: '0.4s' }} />
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="fw-bold">{item.marca} {item.modelo}</Card.Title>
                    <p className="text-white small mb-3">{item.anio} | {item.color}</p>
                    <div className="d-flex justify-content-between align-items-center mt-auto border-top pt-3">
                      <span className="h4 mb-0 fw-bold" style={{ color: '#A4841C' }}>${item.precio.toLocaleString()}</span>
                      <Button variant="outline-warning" size="sm" onClick={() => manejarVerDetalles(item)}>Ver Detalles</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Modal de Detalles */}
      <Modal show={mostrarDetalles} onHide={() => setMostrarDetalles(false)} size="lg" centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title style={{ color: '#A4841C' }}>{vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.modelo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6} className="mb-3">
              <img src={vehiculoSeleccionado?.url_imagen} className="img-fluid rounded shadow" style={{ height: '300px', width: '100%', objectFit: 'cover' }} />
            </Col>
            <Col md={6}>
              <h5 className="border-bottom pb-2" style={{ borderColor: '#A4841C' }}>Especificaciones</h5>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Año:</strong> {vehiculoSeleccionado?.anio}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Color:</strong> {vehiculoSeleccionado?.color}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Estado:</strong> {vehiculoSeleccionado?.estado}</ListGroup.Item>
                <ListGroup.Item className="h4 mt-2 bg-dark border-0" style={{ color: '#A4841C' }}><strong>Precio:</strong> ${vehiculoSeleccionado?.precio?.toLocaleString()}</ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ mostrar: false, mensaje: "", tipo: "" })}
      />

      {/* SECCIÓN 4: ACCESO AL CATÁLOGO */}
      <Container className="py-5 text-center">
        <Row className="justify-content-center">
          <Col md={8}>
            <h2 className="fw-bold text-white mb-4">¿Buscas renovar tu vehículo?</h2>
            <p className="text-white mb-4">Visita nuestro catálogo exclusivo de autos disponibles y encuentra la combinación perfecta de lujo y potencia.</p>
            <Button 
              className="btn-gold" 
              size="lg"
              onClick={() => navegar("/catalogo")}
            >
              VER CATÁLOGO DE AUTOS
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Inicio
