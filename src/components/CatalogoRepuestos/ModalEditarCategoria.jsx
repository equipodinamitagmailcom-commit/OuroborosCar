import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalEditarCategoria = ({ mostrar, manejarCierre, categoria, alActualizar }) => {
    const [nombre, setNombre] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (mostrar && categoria) {
            setNombre(categoria.nombre);
        }
    }, [mostrar, categoria]);

    const actualizarCategoria = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const { error } = await supabase
                .from('categoriarepuesto')
                .update({ nombre: nombre.trim() })
                .eq('id_categoria', categoria.id_categoria); // Basado en tu DDL

            if (error) throw error;
            alActualizar();
            manejarCierre();
        } catch (error) {
            alert('Error al actualizar: ' + error.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered contentClassName="bg-dark text-white">
            <Modal.Header closeButton>
                <Modal.Title className="color-texto-marca">Editar Categoría</Modal.Title>
            </Modal.Header>
            <Form onSubmit={actualizarCategoria}>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Nombre de la Categoría</Form.Label>
                        <Form.Control 
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={manejarCierre}>Cancelar</Button>
                    <Button type="submit" className="color-navbar" disabled={cargando}>
                        {cargando ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalEditarCategoria;