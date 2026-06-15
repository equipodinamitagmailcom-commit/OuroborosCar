import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Badge, Button } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import CarruselVehiculo from '../vehiculos/CarruselVehiculo.jsx';

const Catalogo = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('vehiculos')
          .select('*')
          .eq('en_catalogo', true)
          .order('id_vehiculo', { ascending: false });

        if (error) throw error;
        setVehiculos(data || []);
      } catch (err) {
        console.error('Error al cargar catálogo:', err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogo();
  }, []);

  return (
    <div className="bg-radial-premium min-vh-100">
      <Container className="py-5">
        <Row className="mb-4 text-center">
          <Col>
            <h2 className="display-5 fw-bold text-gold mb-2">Exhibición de Vehículos</h2>
            <p className="text-white-50">Descubre la ingeniería y el lujo en cada detalle de nuestra selección.</p>
            <hr className="border-gold opacity-25 w-25 mx-auto" />
          </Col>
        </Row>

        {cargando ? (
          <div className="text-center py-5">
            <Spinner animation="border" className="text-gold" />
            <p className="text-white-50 mt-3">Sincronizando inventario premium...</p>
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-search text-white-50 display-1"></i>
            <h4 className="text-white mt-3">Por el momento no hay vehículos en exhibición.</h4>
            <p className="text-white-50">Vuelve pronto para ver nuestras novedades.</p>
          </div>
        ) : (
          <Row className="g-4">
            {vehiculos.map((vehiculo) => (
              <Col key={vehiculo.id_vehiculo} md={6} lg={4}>
                <Card className="card-custom h-100 card-hover-custom shadow-lg">
                  <div className="position-relative">
                    <CarruselVehiculo vehiculo={vehiculo} height="250px" />
                    <Badge 
                      bg="dark" 
                      className="position-absolute top-0 end-0 m-3 border border-warning text-gold"
                    >
                      {vehiculo.estado}
                    </Badge>
                  </div>
                  <Card.Body className="p-4">
                    <h4 className="fw-bold text-white mb-1">
                      {vehiculo.marca} {vehiculo.modelo}
                    </h4>
                    <p className="text-gold fw-bold mb-3 fs-5">
                      ${Number(vehiculo.precio).toLocaleString('en-US')}
                    </p>
                    
                    <Row className="text-white-50 small g-2 mb-4">
                      <Col xs={6}>
                        <i className="bi bi-calendar-event me-2"></i>Año: {vehiculo.anio}
                      </Col>
                      <Col xs={6}>
                        <i className="bi bi-palette me-2"></i>Color: {vehiculo.color}
                      </Col>
                      <Col xs={12}>
                        <i className="bi bi-check2-circle me-2 text-gold"></i>
                        Unidades disponibles: {vehiculo.stock}
                      </Col>
                    </Row>

                    <Button className="btn-primary-custom w-100 py-2 fw-bold">
                      Solicitar Información
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Catalogo;