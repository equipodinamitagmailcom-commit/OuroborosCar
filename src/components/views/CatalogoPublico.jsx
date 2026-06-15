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
          .card-hover-custom {
            transition: all 0.3s ease;
            background-color: transparent !important;
          }
          .card-hover-custom:hover {
            transform: translateY(-5px);
          }
          .card-hover-custom .imagen-zoom { 
            transition: transform 0.5s ease;
          }
          .card-hover-custom:hover .imagen-zoom { 
            transform: scale(1.05); 
          }
          .btn-categoria {
            transition: 0.3s;
            border: none;
            color: #ccc;
            font-weight: 500;
            padding: 8px 16px;
          }
          .btn-categoria:hover {
            color: #A4841C;
            background-color: transparent;
          }
          .btn-categoria.active {
            background-color: transparent !important;
            color: #A4841C !important;
            border-bottom: 2px solid #A4841C;
            border-radius: 0;
          }
          .search-input-custom {
            background-color: transparent !important;
            border: none !important;
            border-bottom: 1px solid #555 !important;
            color: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .search-input-custom:focus {
            border-bottom: 1px solid #A4841C !important;
            box-shadow: none !important;
          }
          .btn-outline-gold {
            background-color: transparent;
            border: 1px solid #A4841C;
            color: #A4841C;
            transition: all 0.3s ease;
          }
          .btn-outline-gold:hover {
            background-color: #A4841C;
            color: white;
          }
        `}
      </style>
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <h2 className="fw-bold text-white mb-0">
            <i className="bi bi-stars text-gold me-2"></i>Catálogo de Autos
          </h2>
        </Col>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #555', color: '#A4841C', borderRadius: '0' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="¿Qué vehículo estás buscando hoy?"
              className="search-input-custom"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <Row className="mb-4 justify-content-center">
        <Col md={12} className="text-center">
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Button 
              variant="link"
              className={`btn-categoria ${categoriaActiva === "Todos" ? 'active' : ''} text-decoration-none`}
              onClick={() => setCategoriaActiva("Todos")}
            >Todos</Button>
            {categorias.map(cat => (
              <Button 
                key={cat.id_categoria}
                variant="link"
                className={`btn-categoria ${categoriaActiva === cat.id_categoria.toString() ? 'active' : ''} text-decoration-none`}
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
              <Card className="h-100 border-0 text-white card-hover-custom">
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                  <div className="imagen-zoom" style={{ height: '260px' }}>
                    <CarruselVehiculo vehiculo={item} height="100%" />
                  </div>
                  <div className="position-absolute top-0 end-0 m-3">
                    <span className="badge px-3 py-2 shadow-sm" style={{ backgroundColor: item.stock > 0 ? 'rgba(164, 132, 28, 0.9)' : 'rgba(220, 53, 69, 0.9)', backdropFilter: 'blur(4px)' }}>
                      {item.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                </div>
                <Card.Body className="d-flex flex-column px-1 pt-4 pb-2">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="fw-bold mb-0 fs-4">{item.marca} {item.modelo}</Card.Title>
                    <span className="h5 mb-0 fw-bold" style={{ color: '#A4841C' }}>${item.precio.toLocaleString()}</span>
                  </div>
                  <div className="d-flex gap-2 text-white-50 small mb-4 flex-wrap">
                    <span><i className="bi bi-calendar3 me-1"></i>{item.anio}</span>
                    <span>&bull;</span>
                    <span><i className="bi bi-palette me-1"></i>{item.color}</span>
                    <span>&bull;</span>
                    <span>{item.estado}</span>
                  </div>
                  <div className="mt-auto">
                    <Button 
                      className="btn-outline-gold w-100 py-2 fw-bold text-uppercase rounded-1"
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