import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, Spinner } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import ModalEdicionCategoria from './ModalEdicionCategorias';
import ModalEliminacionCategoria from './ModalEliminacionCategoria';

const ModalVerCategorias = ({ mostrar, manejarCierre }) => {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [categoriaEditar, setCategoriaEditar] = useState({ id_categoria: '', nombrecat: '' });
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

    useEffect(() => {
        if (mostrar) {
            cargarCategorias();
        }
    }, [mostrar]);

    const cargarCategorias = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('categoriavehiculos')
                .select('*')
                .order('id_categoria', { ascending: true });

            if (error) throw error;
            setCategorias(data || []);
        } catch (error) {
            console.error('Error al cargar categorías:', error.message);
            setCategorias([]);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalEdicion = (categoria) => {
        setCategoriaEditar({
            id_categoria: categoria.id_categoria,
            nombrecat: categoria.nombrecat,
        });
        setMostrarModalEdicion(true);
    };

    const abrirModalEliminacion = (categoria) => {
        setCategoriaAEliminar(categoria);
        setMostrarModalEliminacion(true);
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;
        setCategoriaEditar((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const actualizarCategoria = async () => {
        try {
            if (!categoriaEditar.nombrecat.trim()) {
                alert('Debe llenar el campo de nombre.');
                return;
            }

            const { error } = await supabase
                .from('categoriavehiculos')
                .update({
                    nombrecat: categoriaEditar.nombrecat,
                })
                .eq('id_categoria', categoriaEditar.id_categoria);

            if (error) throw error;

            await cargarCategorias();
            setMostrarModalEdicion(false);
        } catch (error) {
            console.error('Error al actualizar categoría:', error.message);
            alert('Error al actualizar la categoría');
        }
    };

    const eliminarCategoria = async () => {
        if (!categoriaAEliminar) return;
        try {
            const { error } = await supabase
                .from('categoriavehiculos')
                .delete()
                .eq('id_categoria', categoriaAEliminar.id_categoria);

            if (error) throw error;

            await cargarCategorias();
            setMostrarModalEliminacion(false);
            setCategoriaAEliminar(null);
        } catch (error) {
            console.error('Error al eliminar categoría:', error.message);
            alert('Error al eliminar la categoría');
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-tags-fill me-2"></i>
                    Categorías de Vehículos
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Cargando categorías...</p>
                    </div>
                ) : categorias.length > 0 ? (
                    <div className="table-responsive">
                        <Table striped hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre de Categoría</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categorias.map((cat) => (
                                    <tr key={cat.id_categoria}>
                                        <td className="fw-bold text-muted">#{cat.id_categoria}</td>
                                        <td className="fw-semibold">{cat.nombrecat}</td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => abrirModalEdicion(cat)}
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => abrirModalEliminacion(cat)}
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-inbox display-4 d-block mb-3"></i>
                        <p>No hay categorías registradas</p>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={manejarCierre}>
                    Cerrar
                </Button>
            </Modal.Footer>

            {/* Modales de edición y eliminación */}
            <ModalEdicionCategoria
                mostrarModalEdicion={mostrarModalEdicion}
                setMostrarModalEdicion={setMostrarModalEdicion}
                categoriaEditar={categoriaEditar}
                manejoCambioInputEdicion={manejoCambioInputEdicion}
                actualizarCategoria={actualizarCategoria}
            />

            <ModalEliminacionCategoria
                mostrarModalEliminacion={mostrarModalEliminacion}
                setMostrarModalEliminacion={setMostrarModalEliminacion}
                eliminarCategoria={eliminarCategoria}
                categoria={categoriaAEliminar}
            />
        </Modal>
    );
};

export default ModalVerCategorias;
