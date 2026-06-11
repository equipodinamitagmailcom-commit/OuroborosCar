import { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import PropTypes from 'prop-types';

const ModalEliminacionServicio = ({ mostrar, manejarCierre, servicio, alEliminar, notificar }) => {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const confirmarEliminacion = async () => {
        setError('');
        setCargando(true);
        try {
            const { error: supabaseError } = await supabase
                .from('mantenimientoservicio')
                .delete()
                .eq('id_servicio', servicio.id_servicio);

            if (supabaseError) throw supabaseError;

            notificar('Servicio eliminado exitosamente.', 'exito');
            alEliminar();
            manejarCierre();
        } catch (err) {
            console.error('Error al eliminar servicio:', err.message);
            setError('Error al eliminar el servicio: ' + err.message);
            notificar('Error al eliminar servicio.', 'error');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-danger">Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                {error && <Alert variant="danger">{error}</Alert>}
                <i className="bi bi-exclamation-triangle-fill text-danger display-4 mb-3"></i>
                <p className="fs-5 text-white">
                    ¿Estás seguro de eliminar el servicio "<strong>{servicio?.tipo_servicio}</strong>"?
                </p>
                <p className="text-white-50 small">Esta acción no se puede deshacer.</p>
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                <Button variant="secondary" onClick={manejarCierre} disabled={cargando}>
                    Cancelar
                </Button>
                <Button variant="danger" onClick={confirmarEliminacion} disabled={cargando}>
                    {cargando ? <Spinner animation="border" size="sm" /> : 'Eliminar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

ModalEliminacionServicio.propTypes = { mostrar: PropTypes.bool.isRequired, manejarCierre: PropTypes.func.isRequired, servicio: PropTypes.object, alEliminar: PropTypes.func.isRequired, notificar: PropTypes.func.isRequired, };

export default ModalEliminacionServicio;