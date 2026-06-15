import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Spinner, Card, Button, Form, InputGroup } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import CarruselVehiculo from "../vehiculos/CarruselVehiculo";
import NotificacionOperacion from "../rutas/NotificacionOperacion";

const Inicio = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
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

  const cargarVehiculosPublicados = async () => {
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
      console.error("Error al cargar vehículos:", err);
      setToast({ mostrar: true, mensaje: "Error al sincronizar catálogo", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Forzar fondo oscuro al entrar en la vista para mantener consistencia premium
    document.body.style.backgroundColor = '#121212';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    cargarVehiculosPublicados();
    cargarCategorias();
  }, []);

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
    <Container fluid className="main-page-container py-5">
      <Row className="mb-4 align-items-center px-4">
        <Col md={6} className="text-start">
          <h6 className="fw-bold text-gold mb-1 fs-6">Nuestro Catálogo</h6>
          <p className="text-white-50 fs-6 mb-2">Descubre la excelencia en cada unidad</p>
          <hr className="border-gold opacity-25 ms-0 mt-0" style={{ width: '80px', borderWidth: '3px' }} />
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

      <style>
          {`
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
          `}
      </style>
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
        <div className="text-center py-5 my-5">
          <Spinner animation="border" variant="warning" size="lg" />
          <p className="mt-3 text-gold">Cargando flota...</p>
        </div>
      ) : (
        <Row className="g-4">
          {vehiculosFiltrados.length === 0 ? (
            <Col xs={12} className="text-center py-5">
              <div className="p-5 rounded-4 bg-dark border border-secondary">
                <i className="bi bi-collection-play text-muted display-1"></i>
                <h4 className="text-white-50 mt-3">No se encontraron unidades con esos criterios.</h4>
              </div>
            </Col>
          ) : (
            vehiculosFiltrados.map((vehiculo) => (
              <Col key={vehiculo.id_vehiculo} sm={12} md={6} lg={4}>
                <Card className="h-100 border-0 text-white card-hover-custom" style={{ backgroundColor: 'transparent' }}>
                  <style>
                    {`
                      .card-hover-custom { transition: all 0.3s ease; }
                      .card-hover-custom:hover { transform: translateY(-5px); }
                      .card-hover-custom .imagen-zoom { transition: transform 0.5s ease; }
                      .card-hover-custom:hover .imagen-zoom { transform: scale(1.05); }
                    `}
                  </style>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                    <div className="imagen-zoom" style={{ height: '260px' }}>
                      <CarruselVehiculo vehiculo={vehiculo} height="100%" />
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column px-1 pt-4 pb-2">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="fw-bold mb-0 fs-4">{vehiculo.marca} {vehiculo.modelo}</Card.Title>
                      <span className="h5 mb-0 fw-bold" style={{ color: '#A4841C' }}>${vehiculo.precio?.toLocaleString()}</span>
                    </div>
                    <div className="d-flex gap-2 text-white-50 small flex-wrap">
                      <span><i className="bi bi-calendar3 me-1"></i>{vehiculo.anio}</span>
                      <span>&bull;</span>
                      <span><i className="bi bi-palette me-1"></i>{vehiculo.color}</span>
                      <span>&bull;</span>
                      <span>{vehiculo.estado}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>
  );
};

export default Inicio;