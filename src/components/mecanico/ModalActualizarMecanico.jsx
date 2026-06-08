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
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            backdrop="static"
            contentClassName="bg-dark text-white"
            style={{ border: '1px solid rgba(164, 132, 28, 0.5)' }}
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title style={{ color: '#A4841C' }} className="fw-bold">Actualizar Técnico</Modal.Title>
            </Modal.Header>
            <Form onSubmit={ejecutarActualizacion}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Nombres y Apellidos</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control
                                name="nombres"
                                value={datos.nombres}
                                onChange={handleChange}
                                placeholder="Nombres"
                                className="input-premium"
                                required
                            />
                            <Form.Control
                                name="apellidos"
                                value={datos.apellidos}
                                onChange={handleChange}
                                placeholder="Apellidos"
                                className="input-premium"
                                required
                            />
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Cédula</Form.Label>
                        <Form.Control
                            name="cedula"
                            value={datos.cedula}
                            onChange={handleChange}
                            className="input-premium"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Teléfono</Form.Label>
                        <Form.Control
                            name="telefono"
                            value={datos.telefono}
                            onChange={handleChange}
                            className="input-premium"
                        />
                    </Form.Group>

                    <Form.Group className="mb-0">
                        <Form.Label className="small fw-bold">Dirección</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="direccion"
                            rows={2}
                            value={datos.direccion}
                            onChange={handleChange}
                            className="input-premium"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="secondary" onClick={onHide} disabled={cargando}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={cargando}
                        className="fw-bold text-white d-flex align-items-center border-0"
                        style={{ backgroundColor: '#A4841C' }}
                    >
                        {cargando && <Spinner size="sm" className="me-2" animation="border" variant="warning" />}
                        {cargando ? 'Guardando...' : 'Confirmar Cambios'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalActualizarMecanico;