import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Button, Card, Spinner, Form, InputGroup, Modal, ListGroup } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import NotificacionOperacion from "../rutas/NotificacionOperacion.jsx";
import CarruselVehiculo from "../vehiculos/CarruselVehiculo";

const CatalogoPublico = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categoriavehiculos")
        .select("*")
        .order("nombrecat", { ascending: true });
      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err.message);
    }
  };

  const cargarVehiculos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("en_catalogo", true)
        .order("id_vehiculo", { ascending: false });
      if (error) throw error;
      setVehiculos(data || []);
    } catch (err) {
      console.error("Error al cargar el catálogo público:", err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    cargarVehiculos();
    cargarCategorias();
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

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
      filtrados = filtrados.filter(vehiculo =>
        vehiculo.marca.toLowerCase().includes(lowerCaseSearchTerm) ||
        vehiculo.modelo.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtrados;
  }, [vehiculos, searchTerm, categoriaActiva]);

  return (
    <Container className="py-5 mt-5">
      <style>
        {`
          .card-hover-custom:hover .imagen-zoom { transform: scale(1.1); }
          .btn-categoria {
            transition: 0.3s;
            border-color: #A4841C;
            color: #A4841C;
          }
          .btn-categoria.active {
            background-color: #A4841C !important;
            color: white !important;
          }
        `}
      </style>
      <h2 className="text-center mb-5 fw-bold text-white">
        <i className="bi bi-stars text-gold me-3"></i>Catálogo de Autos
      </h2>
      
      <Row className="mb-4 justify-content-center">
        <Col md={10}>
          <InputGroup className="shadow-lg mb-4">
            <InputGroup.Text style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="¿Qué vehículo estás buscando hoy?"
              className="form-control-custom"
              style={{ backgroundColor: 'var(--color-bg-input)', borderColor: 'var(--color-primary)', color: 'white' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={10} className="text-center mb-5">
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Button 
              variant={categoriaActiva === "Todos" ? "warning" : "outline-warning"}
              className={`btn-categoria rounded-pill ${categoriaActiva === "Todos" ? 'active' : ''}`}
              onClick={() => setCategoriaActiva("Todos")}
            >Todos</Button>
            {categorias.map(cat => (
              <Button 
                key={cat.id_categoria}
                variant={categoriaActiva === cat.id_categoria.toString() ? "warning" : "outline-warning"}
                className={`btn-categoria rounded-pill ${categoriaActiva === cat.id_categoria.toString() ? 'active' : ''}`}
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
                  <CarruselVehiculo vehiculo={item} height="220px" />
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className="badge" style={{ backgroundColor: item.stock > 0 ? '#A4841C' : '#dc3545' }}>
                      {item.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold">{item.marca} {item.modelo}</Card.Title>
                  <p className="text-muted small mb-3">{item.anio} | {item.color}</p>
                  <Card.Text className="flex-grow-1">Condición: {item.estado}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
                    <span className="h4 mb-0 fw-bold" style={{ color: '#A4841C' }}>${item.precio.toLocaleString()}</span>
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      onClick={() => manejarVerDetalles(item)}
                    >Ver Detalles</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={mostrarDetalles} onHide={() => setMostrarDetalles(false)} size="lg" centered contentClassName="modal-custom">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title style={{ color: '#A4841C' }}>{vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.modelo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6} className="mb-3">
              {vehiculoSeleccionado && (
                <CarruselVehiculo vehiculo={vehiculoSeleccionado} height="300px" />
              )}
            </Col>
            <Col md={6}>
              <h5 className="border-bottom pb-2" style={{ borderColor: '#A4841C' }}>Especificaciones</h5>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Año:</strong> {vehiculoSeleccionado?.anio}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Color:</strong> {vehiculoSeleccionado?.color}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Estado:</strong> {vehiculoSeleccionado?.estado}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Stock:</strong> {vehiculoSeleccionado?.stock}</ListGroup.Item>
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
    </Container>
  );
};

export default CatalogoPublico;