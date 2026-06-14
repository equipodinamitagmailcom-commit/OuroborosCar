import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Card, Carousel, Button, Modal, ListGroup, Badge } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import CarruselVehiculo from "../vehiculos/CarruselVehiculo";
import NotificacionOperacion from "../rutas/NotificacionOperacion";

const FRASES_RECOMENDACION = [
  "Potencia y elegancia en cada kilómetro.",
  "Diseñado para inspirar tu camino.",
  "La combinación perfecta de lujo y rendimiento.",
  "Supera tus propios límites.",
  "Tu próximo gran viaje comienza aquí."
];

const Inicio = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculosHero, setVehiculosHero] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

  const cargarVehiculosPublicados = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("en_catalogo", true)
        .order("id_vehiculo", { ascending: false });
      
      if (error) throw error;
      const vehiculosCargados = data || [];
      setVehiculos(vehiculosCargados);
      
      // Tomar los 5 más recientes para el Hero
      setVehiculosHero(vehiculosCargados.slice(0, 5));
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
      setToast({ mostrar: true, mensaje: "Error al sincronizar catálogo", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    cargarVehiculosPublicados();
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const manejarVerDetalles = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo);
    setMostrarDetalles(true);
  };

  return (
    <div className="w-100 pb-5" style={{ backgroundColor: 'var(--color-bg-dark)', minHeight: '100vh' }}>
      
      {/* SECCIÓN HERO (CARRUSEL PRINCIPAL) */}
      {!cargando && vehiculosHero.length > 0 && (
        <div className="w-100 position-relative mb-5" style={{ marginTop: '0px' }}>
          <Carousel className="hero-carousel" fade interval={5000} indicators={false}>
            {vehiculosHero.map((vehiculo, index) => (
              <Carousel.Item key={`hero-${vehiculo.id_vehiculo}`}>
                <img
                  className="d-block w-100"
                  src={vehiculo.url_imagen}
                  alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                />
                <div className="hero-overlay"></div>
                <div className="hero-caption">
                  <Badge bg="warning" className="text-dark mb-3 px-3 py-2" style={{ fontSize: '1rem' }}>
                    NUEVO INGRESO
                  </Badge>
                  <h1>{vehiculo.marca} <span className="text-white-50">{vehiculo.modelo}</span></h1>
                  <p className="text-white-50">{FRASES_RECOMENDACION[index % FRASES_RECOMENDACION.length]}</p>
                  <Button 
                    className="btn-primary-custom btn-lg px-4 py-2" 
                    onClick={() => manejarVerDetalles(vehiculo)}
                    style={{ fontSize: '1.2rem', borderRadius: '30px' }}
                  >
                    Ver Detalles <i className="bi bi-arrow-right ms-2"></i>
                  </Button>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      )}

      {/* SECCIÓN CATÁLOGO */}
      <Container className={cargando ? 'mt-5 pt-4' : 'mt-4'}>
        <Row className="mb-5 text-center">
          <Col>
            <h2 className="fw-bold text-gold display-6 mb-2">Nuestro Inventario</h2>
            <p className="text-white-50 fs-5">Explora todas nuestras opciones disponibles</p>
            <hr className="border-gold opacity-25 mx-auto" style={{ width: '100px', borderWidth: '3px' }} />
          </Col>
        </Row>

        {cargando ? (
          <div className="text-center py-5 my-5">
            <Spinner animation="border" variant="warning" size="lg" />
            <p className="mt-3 text-gold">Cargando flota...</p>
          </div>
        ) : (
          <Row className="g-4">
            {vehiculos.length === 0 ? (
              <Col xs={12} className="text-center py-5">
                <div className="p-5 rounded-4 bg-dark border border-secondary">
                  <i className="bi bi-collection-play text-muted display-1"></i>
                  <h4 className="text-white-50 mt-3">Próximamente nuevas unidades en inventario.</h4>
                </div>
              </Col>
            ) : (
              vehiculos.map((vehiculo, index) => {
                const esNuevo = index < 3; // Los 3 primeros son marcados como NUEVO
                return (
                  <Col key={vehiculo.id_vehiculo} sm={12} md={6} lg={4}>
                    <Card className="card-custom h-100 overflow-hidden shadow-lg border-0" style={{ cursor: 'pointer' }} onClick={() => manejarVerDetalles(vehiculo)}>
                      <div className="admin-img-wrapper position-relative">
                        <CarruselVehiculo vehiculo={vehiculo} height="240px" />
                        {esNuevo && (
                          <div className="position-absolute top-0 start-0 m-3 z-3" style={{ zIndex: 10 }}>
                            <Badge bg="warning" className="text-dark px-3 py-1 shadow-sm">
                              NUEVO
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Card.Body className="p-4 d-flex flex-column">
                        <h4 className="text-gold fw-bold mb-3 text-truncate">
                          {vehiculo.marca} <span className="text-white">{vehiculo.modelo}</span>
                        </h4>
                        
                        <div className="mb-4 flex-grow-1">
                          <Row className="g-2 text-white-50 small fw-semibold mb-3">
                            <Col xs={6}><i className="bi bi-calendar3 me-2 text-gold"></i>{vehiculo.anio}</Col>
                            <Col xs={6}><i className="bi bi-palette2 me-2 text-gold"></i>{vehiculo.color}</Col>
                            <Col xs={6}><i className="bi bi-speedometer2 me-2 text-gold"></i>{vehiculo.estado}</Col>
                            <Col xs={6}><i className="bi bi-check-circle me-2 text-gold"></i>{vehiculo.stock > 0 ? 'Disponible' : 'Agotado'}</Col>
                          </Row>
                          <div className="mt-3 d-flex justify-content-between align-items-center">
                            <span className="h4 text-gold fw-bold mb-0">${vehiculo.precio?.toLocaleString()}</span>
                            <Button 
                              variant="outline-warning" 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); manejarVerDetalles(vehiculo); }}
                            >Descubrir</Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
        )}

        {/* MODAL DE DETALLES DEL VEHÍCULO */}
        <Modal show={mostrarDetalles} onHide={() => setMostrarDetalles(false)} size="lg" centered contentClassName="modal-custom">
          <Modal.Header closeButton className="border-secondary">
            <Modal.Title style={{ color: '#A4841C' }}>{vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.modelo}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="g-4">
              <Col md={6}>
                <div className="rounded overflow-hidden border border-secondary border-opacity-50 h-100">
                  {vehiculoSeleccionado && (
                    <CarruselVehiculo vehiculo={vehiculoSeleccionado} height="100%" />
                  )}
                </div>
              </Col>
              <Col md={6} className="d-flex flex-column justify-content-between">
                <div>
                  <h4 className="text-gold fw-bold border-bottom border-secondary pb-3 mb-3">Especificaciones</h4>
                  <ListGroup variant="flush" className="bg-transparent">
                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-3 d-flex justify-content-between">
                      <span className="text-white-50">Año de Fabricación</span>
                      <strong className="text-end">{vehiculoSeleccionado?.anio}</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-3 d-flex justify-content-between">
                      <span className="text-white-50">Color Exterior</span>
                      <strong className="text-end">{vehiculoSeleccionado?.color}</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-3 d-flex justify-content-between">
                      <span className="text-white-50">Condición</span>
                      <strong className="text-end">{vehiculoSeleccionado?.estado}</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="bg-transparent text-white border-secondary px-0 py-3 d-flex justify-content-between">
                      <span className="text-white-50">Disponibilidad</span>
                      <strong className="text-end">{vehiculoSeleccionado?.stock > 0 ? `${vehiculoSeleccionado.stock} unidades` : 'Agotado'}</strong>
                    </ListGroup.Item>
                  </ListGroup>
                </div>
                <div className="mt-4 pt-3 border-top border-secondary text-center">
                  <p className="text-white-50 small mb-1">Precio Final Estimado</p>
                  <h2 className="text-gold fw-bold mb-0">${vehiculoSeleccionado?.precio?.toLocaleString()}</h2>
                </div>
              </Col>
            </Row>
          </Modal.Body>
        </Modal>

        <NotificacionOperacion
          mostrar={toast.mostrar}
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast({ ...toast, mostrar: false })}
        />
      </Container>
    </div>
  );
};

export default Inicio;