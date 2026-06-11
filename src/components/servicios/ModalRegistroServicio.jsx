import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import PropTypes from 'prop-types';

const ModalRegistroServicio = ({ mostrar, manejarCierre, alGuardar, notificar }) => {
    const [nuevoServicio, setNuevoServicio] = useState({
        tipo_servicio: '',
        precio_servicio: '',
    });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setNuevoServicio((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');

        if (!nuevoServicio.tipo_servicio.trim()) {
            setError('El tipo de servicio es obligatorio.');
            return;
        }
        if (nuevoServicio.precio_servicio && isNaN(parseFloat(nuevoServicio.precio_servicio))) {
            setError('El precio debe ser un número válido.');
            return;
        }

        setCargando(true);
        try {
            const { error: supabaseError } = await supabase
                .from('mantenimientoservicio')
                .insert([
                    {
                        tipo_servicio: nuevoServicio.tipo_servicio.trim(),
                        precio_servicio: nuevoServicio.precio_servicio ? parseFloat(nuevoServicio.precio_servicio) : null,
                    },
                ]);

            if (supabaseError) throw supabaseError;

            notificar('Servicio registrado exitosamente.', 'exito');
            alGuardar();
            manejarCierre();
            setNuevoServicio({ tipo_servicio: '', precio_servicio: '' });
        } catch (err) {
            console.error('Error al registrar servicio:', err.message);
            setError('Error al registrar el servicio: ' + err.message);
            notificar('Error al registrar servicio.', 'error');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-gold">Registrar Nuevo Servicio</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={manejarEnvio}>
                    <Form.Group className="mb-3">
                        <Form.Label>Tipo de Servicio</Form.Label>
                        <Form.Control type="text" name="tipo_servicio" value={nuevoServicio.tipo_servicio} onChange={manejarCambio} className="input-premium" placeholder="Ej: Cambio de aceite" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Precio (Opcional)</Form.Label>
                        <Form.Control type="number" step="0.01" name="precio_servicio" value={nuevoServicio.precio_servicio} onChange={manejarCambio} className="input-premium" placeholder="Ej: 50.00" />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="btn-primary-custom w-100" disabled={cargando}>
                        {cargando ? 'Guardando...' : 'Guardar Servicio'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

ModalRegistroServicio.propTypes = { mostrar: PropTypes.bool.isRequired, manejarCierre: PropTypes.func.isRequired, alGuardar: PropTypes.func.isRequired, notificar: PropTypes.func.isRequired, };

export default ModalRegistroServicio;