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
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold" style={{ color: '#A4841C' }}>Agregar Categoría</Modal.Title>
            </Modal.Header>
            <Form onSubmit={guardarCategoria}>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Nombre de la Categoría</Form.Label>
                        <Form.Control 
                            type="text"
                            placeholder="Ej: Motor, Frenos, Suspensión"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="input-premium"
                            required
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            Este nombre aparecerá al clasificar nuevos repuestos.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="secondary" onClick={manejarCierre}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        className="fw-bold text-white border-0" 
                        style={{ backgroundColor: '#A4841C' }}
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