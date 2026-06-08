import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalEditarMecanico = ({ show, onHide, mecanico, onActualizar }) => {
    const [datos, setDatos] = useState({
        nombres: '',
        apellidos: '',
        cedula: '',
        telefono: '',
        direccion: ''
    });

    // Cargar los datos del mecánico seleccionado cuando el modal se abre
    useEffect(() => {
        if (mecanico) {
            setDatos({
                nombres: mecanico.nombres || '',
                apellidos: mecanico.apellidos || '',
                cedula: mecanico.cedula || '',
                telefono: mecanico.telefono || '',
                direccion: mecanico.direccion || ''
            });
        }
    }, [mecanico]);

    const manejarCambio = (e) => {
        setDatos({ ...datos, [e.target.name]: e.target.value });
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('mecanicos')
                .update({
                    nombres: datos.nombres,
                    apellidos: datos.apellidos,
                    cedula: datos.cedula,
                    telefono: datos.telefono,
                    direccion: datos.direccion
                })
                .eq('id_mecanico', mecanico.id_mecanico);

            if (error) throw error;

            // Notificar al componente padre para refrescar la tabla
            onActualizar();
            onHide();
        } catch (error) {
            alert("Error al actualizar: " + error.message);
        }
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            centered
            contentClassName="bg-dark text-white"
            style={{ border: '1px solid rgba(164, 132, 28, 0.5)' }}
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold" style={{ color: '#A4841C' }}>
                    <i className="bi bi-pencil-square me-2"></i>
                    Editar Información del Mecánico
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={manejarEnvio}>
                <Modal.Body className="p-4">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Nombres</Form.Label>
                                <Form.Control
                                    name="nombres"
                                    value={datos.nombres}
                                    onChange={manejarCambio}
                                    className="input-premium"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Apellidos</Form.Label>
                                <Form.Control
                                    name="apellidos"
                                    value={datos.apellidos}
                                    onChange={manejarCambio}
                                    className="input-premium"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Cédula de Identidad</Form.Label>
                        <Form.Control
                            name="cedula"
                            value={datos.cedula}
                            onChange={manejarCambio}
                            className="input-premium"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Teléfono de Contacto</Form.Label>
                        <Form.Control
                            name="telefono"
                            value={datos.telefono}
                            onChange={manejarCambio}
                            className="input-premium"
                        />
                    </Form.Group>

                    <Form.Group className="mb-0">
                        <Form.Label className="small fw-bold">Dirección de Domicilio</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="direccion"
                            value={datos.direccion}
                            onChange={manejarCambio}
                            className="input-premium"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="secondary" onClick={onHide}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        className="fw-bold text-white px-4 border-0"
                        style={{ backgroundColor: '#A4841C' }}
                    >
                        Actualizar Datos
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalEditarMecanico;