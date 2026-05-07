import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalRegistroCategoria = ({ mostrar, manejarCierre, alGuardar }) => {
    const [nombre, setNombre] = useState('');
    const [cargando, setCargando] = useState(false);

    const guardarCategoria = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;

        setCargando(true);
        try {
            const { error } = await supabase
                .from('categoriarepuesto')
                .insert([{ nombre: nombre.trim() }]);

            if (error) throw error;

            setNombre('');
            alGuardar(); // Recarga la tabla en la vista
            manejarCierre();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered contentClassName="bg-dark text-white">
            <Modal.Header closeButton>
                <Modal.Title className="color-texto-marca">Agregar Categoría</Modal.Title>
            </Modal.Header>
            <Form onSubmit={guardarCategoria}>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Nombre de la Categoría</Form.Label>
                        <Form.Control 
                            type="text"
                            placeholder="Ej: Motor, Frenos, Suspensión"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            Este nombre aparecerá al clasificar nuevos repuestos.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={manejarCierre}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        className="color-navbar" 
                        disabled={cargando || !nombre}
                    >
                        {cargando ? 'Guardando...' : 'Guardar Categoría'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalRegistroCategoria;