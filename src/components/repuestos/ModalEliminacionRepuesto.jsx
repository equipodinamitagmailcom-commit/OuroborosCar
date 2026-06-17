import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalEliminacionRepuesto = ({ mostrar, manejarCierre, repuesto, alEliminar, notificar }) => {
    const [cargando, setCargando] = useState(false);

    const ejecutarEliminacion = async () => {
        if (!repuesto) return;
        
        setCargando(true);
        try {
            // Eliminación basada en el id_repuesto de tu DDL
            const { error } = await supabase
                .from('repuestos')
                .delete()
                .eq('id_repuesto', repuesto.id_repuesto);

            if (error) throw error;

            // Eliminar foto del bucket si existe
            if (repuesto.foto) {
                const fileName = repuesto.foto.split('/').pop().split('?')[0];
                await supabase.storage.from('repuestos_imagenes').remove([fileName]).catch(e => console.warn(e));
            }

            await Promise.resolve(alEliminar?.());
            manejarCierre();

            if (notificar) {
                notificar('Repuesto eliminado con éxito del sistema', 'exito');
            } else {
                alert('Repuesto eliminado con éxito del sistema');
            }
        } catch (error) {
            if (notificar) {
                notificar('Error al eliminar: ' + error.message, 'error');
            } else {
                alert('Error al eliminar: ' + error.message);
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered contentClassName="text-white" style={{ '--bs-modal-bg': '#000', '--bs-modal-border-color': '#444' }}>
            <Modal.Header closeButton>
                <Modal.Title>Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>¿Estás seguro de que deseas eliminar permanentemente este repuesto?</p>
                <div className="p-3 mb-3 bg-black text-white rounded border-start border-danger border-4" style={{ backgroundColor: '#000', border: '1px solid #333' }}>
                    <strong>Pieza:</strong> {repuesto?.nombre} <br />
                    <strong>ID de Registro:</strong> {repuesto?.id_repuesto} <br />
                    <strong>Precio:</strong> ${repuesto?.precio_repuesto}
                </div>
                <p className="text-danger small">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> 
                    Esta acción no se puede deshacer y afectará los registros históricos.
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={manejarCierre} disabled={cargando}>
                    Cancelar
                </Button>
                <Button 
                    variant="danger" 
                    onClick={ejecutarEliminacion} 
                    disabled={cargando}
                >
                    {cargando ? 'Eliminando...' : 'Eliminar Permanentemente'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminacionRepuesto;