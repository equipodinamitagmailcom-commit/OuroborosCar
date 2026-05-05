import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalActualizarMecanico = ({ show, onHide, mecanico, onRefrescar }) => {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [datos, setDatos] = useState({
        nombres: '',
        apellidos: '',
        cedula: '',
        telefono: '',
        direccion: ''
    });

    // Sincronizar datos cuando el mecánico seleccionado cambie
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

    const handleChange = (e) => {
        setDatos({ ...datos, [e.target.name]: e.target.value });
    };

    const ejecutarActualizacion = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('mecanicos')
                .update({
                    nombres: datos.nombres,
                    apellidos: datos.apellidos,
                    cedula: datos.cedula,
                    telefono: datos.telefono,
                    direccion: datos.direccion
                })
                .eq('id_mecanico', mecanico.id_mecanico);

            if (updateError) throw updateError;

            // Éxito: refrescar lista y cerrar
            onRefrescar();
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>Actualizar Técnico</Modal.Title>
            </Modal.Header>
            <Form onSubmit={ejecutarActualizacion}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Nombres y Apellidos</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control
                                name="nombres"
                                value={datos.nombres}
                                onChange={handleChange}
                                placeholder="Nombres"
                                required
                            />
                            <Form.Control
                                name="apellidos"
                                value={datos.apellidos}
                                onChange={handleChange}
                                placeholder="Apellidos"
                                required
                            />
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Cédula</Form.Label>
                        <Form.Control
                            name="cedula"
                            value={datos.cedula}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control
                            name="telefono"
                            value={datos.telefono}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-0">
                        <Form.Label>Dirección</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="direccion"
                            rows={2}
                            value={datos.direccion}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={onHide} disabled={cargando}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={cargando}
                        className="d-flex align-items-center"
                    >
                        {cargando && <Spinner size="sm" className="me-2" animation="border" />}
                        {cargando ? 'Guardando...' : 'Confirmar Cambios'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalActualizarMecanico;