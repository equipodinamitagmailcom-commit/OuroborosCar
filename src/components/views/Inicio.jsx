import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../database/supabaseconfig.js';

const Inicio = () => {
  const navegar = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data, error } = await supabase.from('mantenimientoservicio').select('*').limit(6);

        if (error) throw error;

        setServicios(data || []);
      } catch (error) {
        console.error('Error al cargar datos de inicio:', error.message);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  return (
    <div className="bg-radial-premium min-vh-100">
      <Container className="py-5">
        {/* Sección de Bienvenida */}
        <Row className="justify-content-center text-center mb-5 mt-5">
          <Col lg={12} className="px-0">
            <h1 className="display-1 fw-bold text-gold mb-4 animate__animated animate__fadeInDown text-uppercase" style={{ letterSpacing: '12px', textShadow: '0 0 20px rgba(164, 132, 28, 0.3)' }}>
              Ouroboros Car
            </h1>
            <p className="h3 text-white-50 mb-5 italic fw-light">
              "Excelencia automotriz que trasciende el tiempo."
            </p>
            <p className="fs-4 text-white opacity-75 lh-base mx-auto" style={{ maxWidth: '100%' }}>
              Bienvenido a <strong className="text-gold">Ouroboros Car</strong>, su aliado integral en el mundo automotriz. 
              Somos más que un taller; somos un centro de excelencia dedicado al cuidado y comercialización 
              de vehículos de prestigio. Nuestra plataforma le permite gestionar citas de mantenimiento 
              con técnicos certificados y explorar una selección curada de vehículos que definen su estilo. 
              En Ouroboros, la calidad no es un destino, sino un ciclo constante de perfección.
            </p>
          </Col>
        </Row>

        {/* Sección de Servicios y Especialidades */}
        <Row className="mb-4 mt-5">
          <Col>
            <h2 className="fw-bold text-gold text-center mb-4">
              <i className="bi bi-tools me-3"></i>Nuestros Servicios Especializados
            </h2>
          </Col>
        </Row>

        {cargando ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : (
          <Row className="g-4 mb-5">
            {servicios.map((s) => (
              <Col key={s.id_servicio} md={6} lg={4}>
                <Card className="card-custom h-100 border-0 shadow-lg">
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <div className="perfil-icon-wrapper me-3">
                        <i className="bi bi-shield-check"></i>
                      </div>
                      <h5 className="fw-bold text-white mb-0">{s.tipo_servicio}</h5>
                    </div>
                    <p className="text-white-50 small flex-grow-1">
                      Ofrecemos mantenimiento de la más alta calidad para asegurar la longevidad de su inversión.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Llamado a la Acción (Catálogo) */}
        <Row className="mt-5">
          <Col className="text-center">
            <Card className="bg-dark border-gold p-5 shadow-lg">
              <h3 className="text-gold fw-bold mb-3">¿Busca su próximo vehículo?</h3>
              <p className="text-white-50 mb-4">
                Explore nuestra selección exclusiva de autos certificados y encuentre el modelo que se adapta a su estilo de vida.
              </p>
              <Button 
                size="lg" 
                className="btn-primary-custom px-5 py-3 shadow"
                onClick={() => navegar('/catalogo')}
              >
                <i className="bi bi-car-front-fill me-2"></i>
                Explorar Catálogo Premium
              </Button>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Inicio;