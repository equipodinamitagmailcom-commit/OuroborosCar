import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../database/supabaseconfig.js';

const Inicio = () => {
  const navegar = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState(null);
  const [mostrarModalRepuesto, setMostrarModalRepuesto] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resServicios, resRepuestos] = await Promise.all([
          supabase.from('mantenimientoservicio').select('*').limit(6),
          supabase.from('repuestos').select('*').limit(6)
        ]);

        if (resServicios.error) throw resServicios.error;
        if (resRepuestos.error) throw resRepuestos.error;

        setServicios(resServicios.data || []);
        setRepuestos(resRepuestos.data || []);
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
              <Col key={s.id_servicio} md={12} lg={6}>
                <Card className="card-custom h-100 border-0 shadow-lg overflow-hidden">
                  <Row className="g-0 h-100">
                    <Col xs={4} className="position-relative overflow-hidden" style={{ minHeight: '160px' }}>
                      {s.foto ? (
                        <Card.Img 
                          src={s.foto} 
                          className="w-100 h-100 position-absolute hover-zoom"
                          style={{ objectFit: 'cover', borderRadius: 0 }}
                        />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-dark">
                          <i className="bi bi-wrench-adjustable text-gold opacity-25" style={{ fontSize: '2.5rem' }}></i>
                        </div>
                      )}
                    </Col>
                    <Col xs={8}>
                      <Card.Body className="p-4 d-flex flex-column justify-content-center h-100">
                        <h5 className="fw-bold text-gold mb-2">{s.tipo_servicio}</h5>
                        <p className="text-white-50 small mb-0">
                          Ofrecemos mantenimiento de la más alta calidad con estándares premium para asegurar la longevidad y el rendimiento óptimo de su inversión automotriz.
                        </p>
                      </Card.Body>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Sección de Repuestos y Materiales */}
        {!cargando && repuestos.length > 0 && (
          <>
            <Row className="mb-4 mt-5">
              <Col>
                <h2 className="fw-bold text-gold text-center mb-4">
                  <i className="bi bi-box-seam me-3"></i>Repuestos de Alta Gama
                </h2>
              </Col>
            </Row>
            <Row className="g-4 mb-5">
              {repuestos.map((r) => (
                <Col key={r.id_repuesto} sm={6} md={4} lg={4}>
                  <Card className="card-custom h-100 border-0 shadow-lg overflow-hidden">
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                      {r.foto ? (
                        <Card.Img 
                          variant="top" 
                          src={r.foto} 
                          className="hover-zoom"
                        style={{ objectFit: 'cover', height: '100%' }}
                        />
                      ) : (
                        <div className="h-100 bg-dark d-flex align-items-center justify-content-center">
                          <i className="bi bi-gear-wide-connected text-gold opacity-25" style={{ fontSize: '3rem' }}></i>
                        </div>
                      )}
                    </div>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-white mb-0">{r.nombre}</h6>
                        <Badge bg="dark" className="border border-warning text-gold">Original</Badge>
                      </div>
                      <p className="text-white-50 small mb-0 line-clamp-2">
                        {r.descripcion || "Garantizamos el uso de componentes certificados para el máximo rendimiento de su motor."}
                      </p>
                      <Button 
                        variant="link" 
                        className="text-gold p-0 mt-2 text-decoration-none small fw-bold"
                        onClick={() => { setRepuestoSeleccionado(r); setMostrarModalRepuesto(true); }}
                      >
                        Ver más...
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
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

      {/* Modal para ver detalles completos del repuesto */}
      <Modal 
        show={mostrarModalRepuesto} 
        onHide={() => setMostrarModalRepuesto(false)} 
        centered 
        size="lg"
        contentClassName="modal-custom"
      >
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="text-gold fw-bold">
            <i className="bi bi-info-circle me-2"></i>Especificaciones del Repuesto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {repuestoSeleccionado && (
            <Row className="align-items-center">
              <Col md={5} className="mb-4 mb-md-0">
                <div className="rounded overflow-hidden border border-secondary shadow-lg">
                  <img 
                    src={repuestoSeleccionado.foto || 'https://via.placeholder.com/400x400?text=Sin+Imagen'} 
                    alt={repuestoSeleccionado.nombre} 
                    className="w-100 h-100 object-cover"
                    style={{ minHeight: '250px' }}
                  />
                </div>
              </Col>
              <Col md={7}>
                <h3 className="text-gold fw-bold mb-2">{repuestoSeleccionado.nombre}</h3>
                <Badge bg="dark" className="border border-warning text-gold mb-3">Componente Original</Badge>
                <p className="text-white opacity-75 lh-lg">
                  {repuestoSeleccionado.descripcion || "Este repuesto ha sido rigurosamente seleccionado para cumplir con los estándares de calidad de Ouroboros Car, asegurando que su vehículo mantenga su valor y rendimiento óptimo en todo momento."}
                </p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button className="btn-outline-gold" onClick={() => setMostrarModalRepuesto(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Inicio;