import { useEffect, useState } from "react";
import { Container, Row, Col, Button, Spinner, Card } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import CarruselVehiculo from "../vehiculos/CarruselVehiculo";
import NotificacionOperacion from "../rutas/NotificacionOperacion";

const InicioAdmin = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

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
    // Forzar fondo oscuro al entrar en la vista
    document.body.style.backgroundColor = '#121212';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    cargarVehiculosPublicados();
  }, []);

  return (
    <Container fluid className="main-page-container py-5">
      <Row className="mb-4 text-center">
        <Col>
          <h1 className="fw-bold text-gold display-5 mb-2">Panel de Control</h1>
          <p className="text-white-50 fs-5">Resumen de unidades publicadas en el catálogo</p>
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
                <h4 className="text-white-50 mt-3">No hay vehículos publicados para mostrar.</h4>
              </div>
            </Col>
          ) : (
            vehiculos.map((vehiculo) => (
              <Col key={vehiculo.id_vehiculo} sm={12} md={6} lg={4}>
                <Card className="card-custom h-100 overflow-hidden shadow-lg"> {/* Eliminado border-0 */}
                  <div className="admin-img-wrapper">
                    <CarruselVehiculo vehiculo={vehiculo} height="240px" />
                  </div>
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h4 className="text-gold fw-bold mb-0 text-truncate" style={{maxWidth: '70%'}}>
                        {vehiculo.marca} <span className="text-white">{vehiculo.modelo}</span>
                      </h4>
                      <span className="badge badge-success-custom">Publicado</span>
                    </div>
                    
                    <div className="mt-3 mb-4 flex-grow-1">
                      <Row className="g-2 text-white-50 small fw-semibold">
                        <Col xs={6}><i className="bi bi-calendar3 me-2 text-gold"></i>{vehiculo.anio}</Col>
                        <Col xs={6}><i className="bi bi-palette2 me-2 text-gold"></i>{vehiculo.color}</Col>
                        <Col xs={6}><i className="bi bi-speedometer2 me-2 text-gold"></i>{vehiculo.estado}</Col>
                        <Col xs={6}><i className="bi bi-box-seam me-2 text-gold"></i>Stock: {vehiculo.stock}</Col>
                      </Row>
                      <div className="mt-3">
                        <span className="h3 text-gold fw-bold">${vehiculo.precio?.toLocaleString()}</span>
                      </div>
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

export default InicioAdmin;