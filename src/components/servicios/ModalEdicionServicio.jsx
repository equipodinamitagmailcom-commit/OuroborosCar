import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import PropTypes from 'prop-types';

const ModalEdicionServicio = ({ mostrar, manejarCierre, servicio, alActualizar, notificar }) => {
    const [servicioEditado, setServicioEditado] = useState({
        tipo_servicio: '',
        precio_servicio: '',
    });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (servicio) {
            setServicioEditado({
                tipo_servicio: servicio.tipo_servicio || '',
                precio_servicio: servicio.precio_servicio != null ? String(servicio.precio_servicio) : '',
            });
        }
    }, [servicio]);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setServicioEditado((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');

        if (!servicioEditado.tipo_servicio.trim()) {
            setError('El tipo de servicio es obligatorio.');
            return;
        }
        if (servicioEditado.precio_servicio && isNaN(parseFloat(servicioEditado.precio_servicio))) {
            setError('El precio debe ser un número válido.');
            return;
        }

        setCargando(true);
        try {
            const { error: supabaseError } = await supabase
                .from('mantenimientoservicio')
                .update({
                    tipo_servicio: servicioEditado.tipo_servicio.trim(),
                    precio_servicio: servicioEditado.precio_servicio ? parseFloat(servicioEditado.precio_servicio) : null,
                })
                .eq('id_servicio', servicio.id_servicio);

            if (supabaseError) throw supabaseError;

            notificar('Servicio actualizado exitosamente.', 'exito');
            alActualizar();
            manejarCierre();
        } catch (err) {
            console.error('Error al actualizar servicio:', err.message);
            setError('Error al actualizar el servicio: ' + err.message);
            notificar('Error al actualizar servicio.', 'error');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-gold">Editar Servicio</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={manejarEnvio}>
                    <Form.Group className="mb-3">
                        <Form.Label>Tipo de Servicio</Form.Label>
                        <Form.Control type="text" name="tipo_servicio" value={servicioEditado.tipo_servicio} onChange={manejarCambio} className="input-premium" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Precio (Opcional)</Form.Label>
                        <Form.Control type="number" step="0.01" name="precio_servicio" value={servicioEditado.precio_servicio} onChange={manejarCambio} className="input-premium" />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="btn-primary-custom w-100" disabled={cargando}>
                        {cargando ? 'Actualizando...' : 'Guardar Cambios'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

ModalEdicionServicio.propTypes = { mostrar: PropTypes.bool.isRequired, manejarCierre: PropTypes.func.isRequired, servicio: PropTypes.object, alActualizar: PropTypes.func.isRequired, notificar: PropTypes.func.isRequired, };

export default ModalEdicionServicio;