import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import TablaMecanicos from '../mecanico/TablaMecanicos.jsx';

const Mecanicos = () => {
    return (
        <Container fluid className="px-4 py-4">
            {/* Encabezado de la Vista */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-1">Panel de Mecánicos</h2>
                    <p className="text-muted">
                        Gestiona, edita y supervisa el personal técnico de <strong>Ouroboros Car</strong>.
                    </p>
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

export default Mecanicos;