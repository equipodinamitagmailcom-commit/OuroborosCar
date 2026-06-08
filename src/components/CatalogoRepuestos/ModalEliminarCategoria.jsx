import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalEliminarCategoria = ({ mostrar, manejarCierre, categoria, alEliminar }) => {
    const [cargando, setCargando] = useState(false);

    const eliminarCategoria = async () => {
        setCargando(true);
        try {
            const { error } = await supabase
                .from('categoriarepuesto')
                .delete()
                .eq('id_categoria', categoria.id_categoria);

            if (error) throw error;
            alEliminar();
            manejarCierre();
        } catch (error) {
            alert('Error: No se puede eliminar si tiene repuestos asociados. ' + error.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered contentClassName="bg-dark text-white">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold text-danger">Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>¿Estás seguro de eliminar la categoría <strong>{categoria?.nombre}</strong>?</p>
                <p className="text-danger small">Esta acción fallará si existen repuestos usando esta categoría.</p>
            </Modal.Body>
            <Modal.Footer className="border-top border-secondary">
                <Button variant="secondary" onClick={manejarCierre}>Cancelar</Button>
                <Button variant="danger" onClick={eliminarCategoria} disabled={cargando}>
                    {cargando ? 'Eliminando...' : 'Eliminar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminarCategoria;