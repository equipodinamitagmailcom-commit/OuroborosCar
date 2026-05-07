import React, { useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import TablaMecanicos from '../mecanico/TablaMecanicos.jsx';

const VistaMecanico = () => {
    useEffect(() => {
        document.body.style.backgroundColor = '#121212';
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    return (
        <Container fluid className="px-4 py-4" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
            {/* Encabezado de la Vista */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-1" style={{ color: '#A4841C' }}>Panel de Mecánicos</h2>
                    <p className="text-muted">
                        Gestiona, edita y supervisa el personal técnico de <strong>Ouroboros Car</strong>.
                    </p>
                </Col>
                <Col xs="auto">
                    <div className="d-flex gap-2">
                        {/* Botón para refrescar manualmente si fuera necesario */}
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => window.location.reload()}
                            className="d-none d-md-inline-block"
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Actualizar Vista
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Fila de Estadísticas Rápidas (Opcional pero recomendado para UX) */}
            <Row className="mb-4">
                <Col md={3}>
                    <div className="p-3 shadow-sm rounded border-start border-4" style={{ backgroundColor: '#1e1e1e', borderColor: '#A4841C' }}>
                        <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '12px' }}>
                            Total Técnicos
                        </small>
                        <h3 className="mb-0 fw-bold">Activos</h3>
                    </div>
                </Col>
            </Row>

            {/* Contenedor de la Tabla Principal */}
            <Row>
                <Col>
                    <TablaMecanicos />
                </Col>
            </Row>

            {/* Footer de la vista con información de ayuda */}
            <Row className="mt-5">
                <Col className="text-center">
                    <p className="text-muted small">
                        <i className="bi bi-info-circle me-1"></i>
                        Los cambios realizados en esta sección afectan directamente la asignación de trabajos en el taller.
                    </p>
                </Col>
            </Row>
        </Container>
    );
};

export default VistaMecanico;