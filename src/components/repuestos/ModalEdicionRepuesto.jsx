import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalEdicionRepuesto = ({ mostrar, manejarCierre, repuesto, alActualizar, notificar }) => {
    const [editado, setEditado] = useState({
        nombre: '',
        descripcion: '',
        precio_repuesto: '',
        id_categoria: ''
    });
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Cargar categorías y datos del repuesto seleccionado
    useEffect(() => {
        const obtenerCategorias = async () => {
            const { data, error } = await supabase
                .from('categoriarepuesto')
                .select('id_categoria, nombre');
            if (!error) setCategorias(data);
        };

        if (mostrar) {
            obtenerCategorias();
            if (repuesto) {
                setEditado({
                    nombre: repuesto.nombre,
                    descripcion: repuesto.descripcion,
                    precio_repuesto: repuesto.precio_repuesto,
                    id_categoria: repuesto.id_categoria
                });
            }
        }
    }, [mostrar, repuesto]);

    const manejarCambio = (e) => {
        setEditado({ ...editado, [e.target.name]: e.target.value });
    };

    const guardarCambios = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const { error } = await supabase
                .from('repuestos')
                .update({
                    nombre: editado.nombre,
                    descripcion: editado.descripcion,
                    precio_repuesto: editado.precio_repuesto,
                    id_categoria: editado.id_categoria
                })
                .eq('id_repuesto', repuesto.id_repuesto); // Filtro por tu PK real

            if (error) throw error;

            await Promise.resolve(alActualizar?.());
            manejarCierre();

            if (notificar) {
                notificar('Repuesto actualizado con éxito', 'exito');
            } else {
                alert('Repuesto actualizado con éxito');
            }
        } catch (error) {
            if (notificar) {
                notificar('Error al actualizar: ' + error.message, 'error');
            } else {
                alert('Error al actualizar: ' + error.message);
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered>
            <Modal.Header closeButton>
                <Modal.Title className="color-texto-marca">Editar Detalles del Repuesto</Modal.Title>
            </Modal.Header>
            <Form onSubmit={guardarCambios}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre de la Pieza</Form.Label>
                        <Form.Control 
                            name="nombre" 
                            value={editado.nombre} 
                            onChange={manejarCambio} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Categoría</Form.Label>
                        <Form.Select 
                            name="id_categoria" 
                            value={editado.id_categoria}
                            onChange={manejarCambio} 
                            required
                        >
                            <option value="">Seleccione...</option>
                            {categorias.map((cat) => (
                                <option key={cat.id_categoria} value={cat.id_categoria}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Precio ($)</Form.Label>
                        <Form.Control 
                            type="number" 
                            name="precio_repuesto" 
                            step="0.01"
                            value={editado.precio_repuesto}
                            onChange={manejarCambio} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            name="descripcion" 
                            value={editado.descripcion || ''}
                            onChange={manejarCambio} 
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={manejarCierre}>Cancelar</Button>
                    <Button type="submit" className="color-navbar" disabled={cargando}>
                        {cargando ? 'Actualizando...' : 'Guardar Cambios'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalEdicionRepuesto;