import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Table, Button, Spinner, Row, Col, InputGroup, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import ModalEdicionCategoria from './ModalEdicionCategorias';
import ModalEliminacionCategoria from './ModalEliminacionCategoria';
import ModalRegistroCategoria from './ModalRegistroCategoria';
import NotificacionOperacion from '../rutas/NotificacionOperacion';
import Paginacion from '../ordenamiento/Paginacion';

const ModalVerCategorias = ({ mostrar, manejarCierre, onCategoriasActualizadas }) => {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });
    const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState({ nombrecat: '' });
    const [categoriaEditar, setCategoriaEditar] = useState({ id_categoria: '', nombrecat: '' });
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [registrosPorPagina, setRegistrosPorPagina] = useState(5);
    const [paginaActual, setPaginaActual] = useState(1);

    const categoriasFiltradas = useMemo(() => {
        if (!busqueda.trim()) return categorias;
        const q = busqueda.toLowerCase().trim();
        return categorias.filter((c) => c.nombrecat?.toLowerCase().includes(q));
    }, [categorias, busqueda]);

    const categoriasPaginadas = useMemo(() => {
        const inicio = (paginaActual - 1) * registrosPorPagina;
        return categoriasFiltradas.slice(inicio, inicio + registrosPorPagina);
    }, [categoriasFiltradas, paginaActual, registrosPorPagina]);

    useEffect(() => {
        if (mostrar) {
            setBusqueda('');
            setPaginaActual(1);
            cargarCategorias();
        }
    }, [mostrar]);

    useEffect(() => {
        const totalPaginas = Math.max(1, Math.ceil(categoriasFiltradas.length / registrosPorPagina));
        if (paginaActual > totalPaginas) {
            setPaginaActual(totalPaginas);
        }
    }, [categoriasFiltradas.length, registrosPorPagina, paginaActual]);

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
                setToast({ mostrar: true, mensaje: 'Debe llenar el campo de nombre.', tipo: 'advertencia' });
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
            if (onCategoriasActualizadas) {
                await onCategoriasActualizadas();
            }
            setMostrarModalEdicion(false);
            setToast({ mostrar: true, mensaje: 'Categoría actualizada con éxito.', tipo: 'exito' });
        } catch (error) {
            console.error('Error al actualizar categoría:', error.message);
            setToast({ mostrar: true, mensaje: 'Error al actualizar la categoría.', tipo: 'error' });
        }
    };

    const manejoCambioInputRegistro = (e) => {
        const { name, value } = e.target;
        setNuevaCategoria((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const agregarCategoria = async () => {
        try {
            if (!nuevaCategoria.nombrecat.trim()) {
                setToast({ mostrar: true, mensaje: 'Debe llenar el campo de nombre.', tipo: 'advertencia' });
                return;
            }

            const { error } = await supabase.from('categoriavehiculos').insert([
                {
                    nombrecat: nuevaCategoria.nombrecat,
                },
            ]);

            if (error) throw error;

            setNuevaCategoria({ nombrecat: '' });
            setMostrarModalRegistro(false);
            await cargarCategorias();
            if (onCategoriasActualizadas) {
                await onCategoriasActualizadas();
            }
            setToast({ mostrar: true, mensaje: 'Categoría agregada con éxito.', tipo: 'exito' });
        } catch (error) {
            console.error('Error al agregar categoría:', error.message);
            setToast({ mostrar: true, mensaje: 'Error al agregar la categoría.', tipo: 'error' });
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
            if (onCategoriasActualizadas) {
                await onCategoriasActualizadas();
            }
            setMostrarModalEliminacion(false);
            setCategoriaAEliminar(null);
            setToast({ mostrar: true, mensaje: 'Categoría eliminada con éxito.', tipo: 'exito' });
        } catch (error) {
            console.error('Error al eliminar categoría:', error.message);
            setToast({ mostrar: true, mensaje: 'Error al eliminar la categoría.', tipo: 'error' });
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} size="xl" centered scrollable contentClassName="bg-dark text-white">
            <Modal.Header closeButton className="border-bottom border-secondary">
                <div className="d-flex flex-column flex-md-row w-100 justify-content-between align-items-start align-items-md-center gap-3 pe-2">
                    <div>
                        <Modal.Title as="h5" className="color-texto-marca fw-bold mb-1">
                            <i className="bi bi-tags-fill me-2"></i>
                            Categorías de vehículos
                        </Modal.Title>
                        <p className="text-muted small mb-0">
                            Inventario técnico de Ouroboros Car — categorías de vehículo.
                        </p>
                    </div>
                    <Button
                        type="button"
                        className="color-navbar border-0 shadow-sm flex-shrink-0"
                        onClick={() => setMostrarModalRegistro(true)}
                    >
                        <i className="bi bi-plus-circle-fill me-2"></i>
                        Agregar categoría
                    </Button>
                </div>
            </Modal.Header>

            <Modal.Body className="pt-4">
                <Row className="mb-4 align-items-center">
                    <Col md={8}>
                        <InputGroup className="shadow-sm">
                            <InputGroup.Text className="border-end-0" style={{ backgroundColor: '#2b2b2b', color: '#A4841C', borderColor: '#A4841C' }}>
                                <i className="bi bi-search text-secondary"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Buscar por nombre..."
                                className="border-start-0 ps-0 text-white"
                                style={{ backgroundColor: '#2b2b2b', borderColor: '#A4841C' }}
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                disabled={cargando}
                            />
                        </InputGroup>
                    </Col>
                </Row>

                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" role="status">
                            <span className="visually-hidden">Cargando categorías...</span>
                        </Spinner>
                        <p className="mt-2 text-muted">Sincronizando con la base de datos...</p>
                    </div>
                ) : categorias.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-bookmark-plus display-1 text-light"></i>
                        <p className="mt-3 text-muted">No hay categorías registradas.</p>
                    </div>
                ) : categoriasFiltradas.length === 0 ? (
                    <Alert variant="info" className="text-center mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        No hay categorías que coincidan con &quot;{busqueda}&quot;.
                    </Alert>
                ) : (
                    <>
                        <div className="table-responsive shadow-sm rounded">
                            <Table hover variant="dark" className="align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="border-secondary">
                                    {categoriasPaginadas.map((cat) => (
                                        <tr key={cat.id_categoria}>
                                            <td className="fw-bold text-secondary">#{cat.id_categoria}</td>
                                            <td className="fw-semibold">{cat.nombrecat}</td>
                                            <td className="text-center text-nowrap">
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
                        <div className="mt-3">
                            <Paginacion
                                registrosPorPagina={registrosPorPagina}
                                totalRegistros={categoriasFiltradas.length}
                                paginaActual={paginaActual}
                                establecerPaginaActual={setPaginaActual}
                                establecerRegistrosPorPagina={setRegistrosPorPagina}
                            />
                        </div>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={manejarCierre}>
                    Cerrar
                </Button>
            </Modal.Footer>

            <ModalRegistroCategoria
                mostrarModal={mostrarModalRegistro}
                setMostrarModal={setMostrarModalRegistro}
                nuevaCategoria={nuevaCategoria}
                manejoCambioInput={manejoCambioInputRegistro}
                agregarCategoria={agregarCategoria}
            />

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

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onClose={() => setToast({ mostrar: false, mensaje: '', tipo: '' })}
            />
        </Modal>
    );
};

export default ModalVerCategorias;
