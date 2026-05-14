import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Button, Card, Spinner, Form, InputGroup, Modal, ListGroup } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";

const Inicio = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Nuevo estado para el término de búsqueda
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

  const cargarVehiculos = async () => {
    try {
      setCargando(true);
      // Obtenemos los productos (vehículos) de la base de datos para el catálogo público
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
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const verDetalles = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo);
    setMostrarDetalles(true);
  };

  // Lógica de filtrado de vehículos por marca o modelo
  const vehiculosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return vehiculos;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return vehiculos.filter(vehiculo =>
      vehiculo.marca.toLowerCase().includes(lowerCaseSearchTerm) ||
      vehiculo.modelo.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [vehiculos, searchTerm]);

  return (
    <Container className="py-5" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
      <style>
        {`
          .card-hover-custom:hover .imagen-zoom {
            transform: scale(1.1);
          }
        `}
      </style>
      {/* Barra de búsqueda */}
      <Row className="mb-4">
        <Col md={8}>
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="border-end-0" style={{ backgroundColor: '#2b2b2b', color: '#A4841C', borderColor: '#A4841C' }}>
              <i className="bi bi-search text-secondary"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por marca, modelo..."
              className="border-start-0 ps-0 text-white"
              style={{ backgroundColor: '#2b2b2b', borderColor: '#A4841C' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Listado Visual de Productos (Vehículos) */}
      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="warning" />
          <p className="mt-3 text-muted">Sincronizando catálogo con el inventario...</p>
        </div>
      ) : vehiculosFiltrados.length > 0 ? ( // Usar vehiculosFiltrados aquí
        <Row>
          {vehiculosFiltrados.map((item) => ( // Usar vehiculosFiltrados aquí
            <Col key={item.id_vehiculo} xs={12} sm={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm border-0 text-white card-hover-custom" style={{ backgroundColor: '#1e1e1e' }}>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  {item.url_imagen && (
                    <Card.Img
                      variant="top"
                      src={item.url_imagen}
                      alt={item.modelo}
                      className="imagen-zoom"
                      style={{ height: "220px", objectFit: "cover", transition: 'transform 0.4s ease-in-out' }}
                    />
                  )}
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className={`badge shadow-sm`} style={{ backgroundColor: item.stock > 0 ? '#A4841C' : '#dc3545' }}>
                      {item.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold mb-1">{item.marca} {item.modelo}</Card.Title>
                  <div className="text-muted small mb-3">
                    <span className="me-2"><i className="bi bi-calendar3 me-1"></i>{item.anio}</span>
                    <span className="me-2"><i className="bi bi-palette me-1"></i>{item.color}</span>
                  </div>
                  <Card.Text className="flex-grow-1">
                    <strong>Condición:</strong> {item.estado}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
                    <span className="h4 mb-0 fw-bold" style={{ color: '#A4841C' }}>${item.precio.toLocaleString()}</span>
                    <Button 
                      variant="outline-light"
                      style={{ borderColor: '#A4841C', color: '#A4841C' }}
                      size="sm" 
                      onClick={() => verDetalles(item)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-inboxes display-1 text-light"></i>
          {searchTerm.trim() ? (
            <p className="mt-3 text-muted">No se encontraron vehículos que coincidan con "{searchTerm}".</p>
          ) : (
            <p className="mt-3 text-muted">No se encontraron productos en el catálogo público.</p>
          )}
        </div>
      )}

      {/* Modal de Detalles del Vehículo */}
      <Modal show={mostrarDetalles} onHide={() => setMostrarDetalles(false)} size="lg" centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="fw-bold" style={{ color: '#A4841C' }}>{vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.modelo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <img 
                src={vehiculoSeleccionado?.url_imagen} 
                alt="Vehículo" 
                className="img-fluid rounded shadow-sm" 
                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
              />
            </Col>
            <Col md={6}>
              <h5 className="border-bottom pb-2 mb-3" style={{ borderColor: '#A4841C !important' }}>Especificaciones Técnicas</h5>
              <ListGroup variant="flush" >
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Año:</strong> {vehiculoSeleccionado?.anio}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Color:</strong> {vehiculoSeleccionado?.color}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Estado:</strong> {vehiculoSeleccionado?.estado}</ListGroup.Item>
                <ListGroup.Item className="bg-dark text-white border-secondary"><strong>Disponibilidad:</strong> {vehiculoSeleccionado?.stock > 0 ? `${vehiculoSeleccionado.stock} unidades` : 'Agotado'}</ListGroup.Item>
                <ListGroup.Item className="h4 mt-2 bg-dark border-0" style={{ color: '#A4841C' }}><strong>Precio:</strong> ${vehiculoSeleccionado?.precio?.toLocaleString()}</ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Inicio;
