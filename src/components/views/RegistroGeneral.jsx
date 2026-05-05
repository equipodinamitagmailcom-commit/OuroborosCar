import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const RegistroGeneral = () => {
    const [tipoRegistro, setTipoRegistro] = useState(null); // 'cliente' o 'mecanico'
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // Estado inicial basado en tu esquema DDL
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        cedula: '',
        telefono: '',
        direccion: ''
    });

    const manejarCambio = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const guardarRegistro = async (e) => {
        e.preventDefault();
        setCargando(true);
        setMensaje({ tipo: '', texto: '' });

        // Definir la tabla destino según la elección del botón
        const tablaDestino = tipoRegistro === 'cliente' ? 'clientes' : 'mecanicos';

        try {
            const { error } = await supabase
                .from(tablaDestino)
                .insert([formData]);

            if (error) throw error;

            setMensaje({ 
                tipo: 'success', 
                texto: `${tipoRegistro === 'cliente' ? 'Cliente' : 'Mecánico'} registrado correctamente.` 
            });
            
            // Limpiar formulario y regresar a botones
            setFormData({ nombres: '', apellidos: '', cedula: '', telefono: '', direccion: '' });
            setTimeout(() => setTipoRegistro(null), 2000);

        } catch (error) {
            setMensaje({ tipo: 'danger', texto: error.message });
        } finally {
            setCargando(false);
        }
    };

    return (
        <Container className="py-5">
            <div className="text-center mb-5">
                <h2 className="fw-bold color-texto-marca">Registro de Personal y Clientes</h2>
                <p className="text-muted">Seleccione el tipo de perfil que desea dar de alta en el sistema.</p>
            </div>

            {/* Paso 1: Selección de Tipo */}
            {!tipoRegistro && (
                <Row className="justify-content-center gap-4">
                    <Col md={4}>
                        <Card 
                            className="h-100 shadow-sm border-0 btn-opcion-registro text-center p-4"
                            onClick={() => setTipoRegistro('cliente')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Card.Body>
                                <i className="bi bi-person-badge display-3 color-texto-marca"></i>
                                <h4 className="mt-3 fw-bold">Cliente</h4>
                                <p className="text-muted small">Registrar nuevo dueño de vehículo para historial y citas.</p>
                                <Button className="color-navbar border-0 w-100">Seleccionar</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card 
                            className="h-100 shadow-sm border-0 btn-opcion-registro text-center p-4"
                            onClick={() => setTipoRegistro('mecanico')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Card.Body>
                                <i className="bi bi-wrench-adjustable display-3 color-texto-marca"></i>
                                <h4 className="mt-3 fw-bold">Mecánico</h4>
                                <p className="text-muted small">Dar de alta a un técnico para asignación de reparaciones.</p>
                                <Button className="color-navbar border-0 w-100">Seleccionar</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Paso 2: Formulario Dinámico */}
            {tipoRegistro && (
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="shadow border-0">
                            <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                <h4 className="fw-bold mb-0">
                                    Nuevo {tipoRegistro === 'cliente' ? 'Cliente' : 'Mecánico'}
                                </h4>
                                <Button variant="link" className="text-muted p-0" onClick={() => setTipoRegistro(null)}>
                                    <i className="bi bi-x-lg"></i> Cancelar
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {mensaje.texto && <Alert variant={mensaje.tipo}>{mensaje.texto}</Alert>}
                                
                                <Form onSubmit={guardarRegistro}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small fw-bold">Nombres</Form.Label>
                                                <Form.Control name="nombres" onChange={manejarCambio} required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small fw-bold">Apellidos</Form.Label>
                                                <Form.Control name="apellidos" onChange={manejarCambio} required />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Cédula de Identidad</Form.Label>
                                        <Form.Control name="cedula" placeholder="000-000000-0000X" onChange={manejarCambio} required />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Teléfono</Form.Label>
                                        <Form.Control name="telefono" onChange={manejarCambio} />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="small fw-bold">Dirección</Form.Label>
                                        <Form.Control as="textarea" rows={2} name="direccion" onChange={manejarCambio} />
                                    </Form.Group>

                                    <Button 
                                        type="submit" 
                                        className="w-100 color-navbar border-0 py-2 shadow-sm"
                                        disabled={cargando}
                                    >
                                        {cargando ? 'Guardando...' : `Registrar ${tipoRegistro}`}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default RegistroGeneral;