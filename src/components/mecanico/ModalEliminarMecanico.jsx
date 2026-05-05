import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalEliminarMecanico = ({ show, onHide, mecanico, onConfirmar }) => {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    const ejecutarEliminacion = async () => {
        setCargando(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('mecanicos')
                .delete()
                .eq('id_mecanico', mecanico.id_mecanico); // Basado en tu esquema de base de datos

            if (deleteError) throw deleteError;

            // Notificar éxito al componente padre
            onConfirmar();
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold text-danger">
                    <i className="bi bi-exclamation-octagon-fill me-2"></i>
                    Confirmar Eliminación
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-4">
                {error && <Alert variant="danger">{error}</Alert>}
                
                <div className="mb-4">
                    <p className="fs-5 mb-1">¿Estás seguro de que deseas eliminar a:</p>
                    <h4 className="fw-bold color-texto-marca">
                        {mecanico?.nombres} {mecanico?.apellidos}
                    </h4>
                    <p className="text-muted mt-3">
                        Esta acción es permanente y eliminará al técnico de los registros del taller.
                    </p>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-0 d-flex justify-content-center pb-4">
                <Button 
                    variant="outline-secondary" 
                    onClick={onHide} 
                    disabled={cargando}
                    className="px-4"
                >
                    Cancelar
                </Button>
                <Button 
                    variant="danger" 
                    onClick={ejecutarEliminacion} 
                    disabled={cargando}
                    className="px-4 d-flex align-items-center"
                >
                    {cargando && <Spinner size="sm" className="me-2" animation="border" />}
                    {cargando ? 'Eliminando...' : 'Eliminar Técnico'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminarMecanico;