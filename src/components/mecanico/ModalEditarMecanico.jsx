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
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title className="fw-bold">
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
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Teléfono de Contacto</Form.Label>
                        <Form.Control
                            name="telefono"
                            value={datos.telefono}
                            onChange={manejarCambio}
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
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={onHide}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="color-navbar border-0 px-4">
                        Actualizar Datos
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalEditarMecanico;