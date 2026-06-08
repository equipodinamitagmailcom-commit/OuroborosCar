import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const ModalRegistroRepuesto = ({ mostrar, manejarCierre, alGuardar, notificar }) => {
    // Estado inicial basado en las columnas reales de tu DDL
    const [repuesto, setRepuesto] = useState({
        nombre: '',
        descripcion: '',
        precio_repuesto: '', 
        id_categoria: ''
    });
    
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Cargar categorías desde la tabla categoriarepuesto
    useEffect(() => {
        const obtenerCategorias = async () => {
            const { data, error } = await supabase
                .from('categoriarepuesto') 
                .select('id_categoria, nombre');
            if (!error) setCategorias(data);
        };
        
        if (mostrar) {
            obtenerCategorias();
        }
    }, [mostrar]);

    const manejarCambio = (e) => {
        setRepuesto({ ...repuesto, [e.target.name]: e.target.value });
    };

    const registrarRepuesto = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            // Inserción en la tabla repuestos según tu esquema
            const { error } = await supabase
                .from('repuestos')
                .insert([repuesto]);

            if (error) throw error;

            // Limpieza de campos tras éxito
            setRepuesto({
                nombre: '',
                descripcion: '',
                precio_repuesto: '',
                id_categoria: ''
            });

            await Promise.resolve(alGuardar?.());
            manejarCierre();

            if (notificar) {
                notificar('Repuesto registrado con éxito', 'exito');
            } else {
                alert('Repuesto registrado con éxito');
            }
        } catch (error) {
            if (notificar) {
                notificar('Error al registrar: ' + error.message, 'error');
            } else {
                alert('Error al registrar: ' + error.message);
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered contentClassName="modal-custom">
            <Modal.Header closeButton className="border-secondary">
                <Modal.Title className="color-texto-marca">Registrar Nuevo Repuesto</Modal.Title>
            </Modal.Header>
            <Form onSubmit={registrarRepuesto}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre de la Pieza</Form.Label>
                        <Form.Control 
                            name="nombre" 
                            type="text"
                            placeholder="Ej: Kit de embrague"
                            className="bg-secondary text-white border-0"
                            value={repuesto.nombre}
                            onChange={manejarCambio} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Categoría</Form.Label>
                        <Form.Select 
                            name="id_categoria" 
                            className="bg-secondary text-white border-0"
                            value={repuesto.id_categoria}
                            onChange={manejarCambio} 
                            required
                        >
                            <option value="">Seleccione una categoría...</option>
                            {categorias.map((cat) => (
                                <option key={cat.id_categoria} value={cat.id_categoria}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Precio de Venta ($)</Form.Label>
                        <Form.Control 
                            type="number" 
                            name="precio_repuesto" 
                            step="0.01"
                            placeholder="0.00"
                            className="bg-secondary text-white border-0"
                            value={repuesto.precio_repuesto}
                            onChange={manejarCambio} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Descripción Técnica</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            name="descripcion" 
                            className="bg-secondary text-white border-0"
                            placeholder="Detalles sobre la marca, compatibilidad, etc."
                            value={repuesto.descripcion}
                            onChange={manejarCambio} 
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-secondary">
                    <Button variant="secondary" onClick={manejarCierre}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="btn-primary-custom" disabled={cargando}>
                        {cargando ? 'Guardando...' : 'Guardar Repuesto'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalRegistroRepuesto;