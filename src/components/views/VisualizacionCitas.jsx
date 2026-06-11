import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';

const VisualizacionCitas = ({ citas, cliente }) => {
    // cliente = { nombre, telefono, foto_perfil }
    
    return (
        <div className="zona-citas p-2">
            {/* Encabezado de Perfil: Fila compacta en la parte superior */}
            <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded-4" 
                 style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(164, 132, 28, 0.3)' }}>
                <div className="position-relative">
                    {cliente?.foto_perfil ? (
                        <img 
                            src={cliente.foto_perfil} 
                            alt="Perfil" 
                            className="rounded-circle border border-warning"
                            style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                            <i className="bi bi-person-fill text-white-50" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                    )}
                </div>
                <div className="flex-grow-1">
                    <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '0.95rem' }}>{cliente?.nombre || 'Cliente'}</h6>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-telephone-fill me-1" style={{ fontSize: '0.7rem', color: '#A4841C' }}></i>
                        {cliente?.telefono || 'Sin teléfono'}
                    </p>
                </div>
                <Badge bg="outline-warning" className="text-warning border border-warning" style={{ fontSize: '0.65rem', borderRadius: '10px' }}>
                    CLIENTE ACTIVO
                </Badge>
            </div>

            {/* Listado de Citas: Diseño ultra-compacto */}
            <Row className="g-2">
                {citas.map((cita) => (
                    <Col xs={12} key={cita.id}>
                        <Card className="bg-dark border-secondary shadow-sm overflow-hidden" style={{ borderRadius: '15px' }}>
                            <Card.Body className="p-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    {/* Info Directa */}
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="text-center p-1 rounded" style={{ backgroundColor: 'rgba(164, 132, 28, 0.1)', minWidth: '45px' }}>
                                            <span className="d-block fw-bold text-warning" style={{ fontSize: '0.8rem', lineHeight: '1' }}>{cita.dia}</span>
                                            <span className="text-muted text-uppercase" style={{ fontSize: '0.6rem' }}>{cita.mes}</span>
                                        </div>
                                        
                                        <div>
                                            <h6 className="mb-0 fw-semibold text-white-50" style={{ fontSize: '0.85rem' }}>
                                                {cita.servicio}
                                            </h6>
                                            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
                                                <span className="text-muted">
                                                    <i className="bi bi-clock me-1" style={{ fontSize: '0.65rem' }}></i>{cita.hora}
                                                </span>
                                                <span className="text-muted">
                                                    <i className="bi bi-car-front-fill me-1" style={{ fontSize: '0.65rem' }}></i>{cita.vehiculo}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones Redondeados y Pequeños */}
                                    <div className="d-flex gap-1">
                                        <Button 
                                            variant="outline-light" 
                                            className="rounded-pill d-flex align-items-center justify-content-center" 
                                            style={{ padding: '4px 10px', fontSize: '0.7rem', borderWidth: '1px' }}
                                        >
                                            <i className="bi bi-eye me-1" style={{ fontSize: '0.75rem' }}></i>
                                            Ver
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            className="rounded-pill d-flex align-items-center justify-content-center" 
                                            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                        >
                                            <i className="bi bi-x-circle me-1" style={{ fontSize: '0.75rem' }}></i>
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Estilos adicionales in-line para refinamiento */}
            <style>
                {`
                    .zona-citas .card {
                        transition: transform 0.2s ease;
                        background-color: #121212 !important;
                    }
                    .zona-citas .card:hover {
                        transform: translateX(4px);
                        border-color: #A4841C !important;
                    }
                    .zona-citas .btn-outline-light:hover {
                        background-color: #A4841C;
                        border-color: #A4841C;
                    }
                `}
            </style>
        </div>
    );
};

export default VisualizacionCitas;