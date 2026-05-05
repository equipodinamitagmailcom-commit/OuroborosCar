import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Spinner, Form, InputGroup } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const TarjetasRepuestos = () => {
    const [repuestos, setRepuestos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState("");

    useEffect(() => {
        obtenerRepuestos();
    }, []);

    const obtenerRepuestos = async () => {
        try {
            const { data, error } = await supabase
                .from('repuestos')
                .select(`
                    *,
                    categorias ( nombre_categoria )
                `); // Asumiendo relación con tabla categorías

            if (error) throw error;
            setRepuestos(data);
        } catch (error) {
            console.error("Error al cargar repuestos:", error.message);
        } finally {
            setCargando(false);
        }
    };

    const filtrados = repuestos.filter(r => 
        r.nombre_repuesto.toLowerCase().includes(filtro.toLowerCase())
    );

    if (cargando) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Cargando inventario...</p>
            </div>
        );
    }

    return (
        <div className="contenedor-tarjetas">
            {/* Barra de búsqueda superior */}
            <Row className="mb-4">
                <Col md={6} lg={4}>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-end-0">
                            <i className="bi bi-search text-muted"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar repuesto..."
                            className="border-start-0"
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                {filtrados.map((item) => (
                    <Col key={item.id_repuesto}>
                        <Card className="h-100 border-0 shadow-sm tarjeta-hover">
                            {/* Imagen representativa o Placeholder */}
                            <div className="position-relative">
                                <Card.Img 
                                    variant="top" 
                                    src={item.url_imagen || 'https://via.placeholder.com/300x200?text=Sin+Imagen'} 
                                    style={{ height: '180px', objectFit: 'cover' }}
                                />
                                <Badge 
                                    bg={item.stock > 5 ? "success" : "danger"} 
                                    className="position-absolute top-0 end-0 m-2 shadow-sm"
                                >
                                    {item.stock > 0 ? `Stock: ${item.stock}` : 'Agotado'}
                                </Badge>
                            </div>

                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Card.Title className="fw-bold mb-0 text-truncate" title={item.nombre_repuesto}>
                                        {item.nombre_repuesto}
                                    </Card.Title>
                                </div>
                                
                                <p className="text-muted small mb-2">
                                    <i className="bi bi-tag-fill me-1"></i>
                                    {item.categorias?.nombre_categoria || 'General'}
                                </p>

                                <div className="d-flex align-items-center mb-3">
                                    <h4 className="fw-bold text-primary mb-0">
                                        C$ {item.precio?.toLocaleString()}
                                    </h4>
                                </div>

                                <Card.Text className="text-secondary small line-clamp-2">
                                    {item.descripcion || 'Sin descripción disponible.'}
                                </Card.Text>
                            </Card.Body>

                            <Card.Footer className="bg-white border-top-0 pb-3">
                                <div className="d-grid gap-2">
                                    <Button variant="outline-primary" size="sm" className="fw-bold">
                                        <i className="bi bi-eye me-2"></i>Ver Detalles
                                    </Button>
                                    <Button variant="primary" size="sm" disabled={item.stock <= 0}>
                                        <i className="bi bi-cart-plus me-2"></i>Añadir
                                    </Button>
                                </div>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>

            {filtrados.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-box-seam display-4 text-muted"></i>
                    <p className="mt-3 fs-5">No se encontraron productos coincidentes.</p>
                </div>
            )}
        </div>
    );
};

export default TarjetasRepuestos;