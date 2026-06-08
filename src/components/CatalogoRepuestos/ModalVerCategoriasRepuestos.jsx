import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Table, Button, Spinner, Row, Col, InputGroup, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import ModalRegistroCategoria from './ModalRegistroCategoria.jsx';
import ModalEditarCategoria from './ModalEditarCategoria.jsx';
import ModalEliminarCategoria from './ModalEliminarCategoria.jsx';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';
import Paginacion from '../ordenamiento/Paginacion.jsx';

const ModalVerCategoriasRepuestos = ({ mostrar, manejarCierre, onCategoriasActualizadas }) => {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });
    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mostrarEdicion, setMostrarEdicion] = useState(false);
    const [mostrarEliminacion, setMostrarEliminacion] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [registrosPorPagina, setRegistrosPorPagina] = useState(5);
    const [paginaActual, setPaginaActual] = useState(1);

    const categoriasFiltradas = useMemo(() => {
        if (!busqueda.trim()) return categorias;
        const q = busqueda.toLowerCase().trim();
        return categorias.filter((c) => c.nombre?.toLowerCase().includes(q));
    }, [categorias, busqueda]);

    const categoriasPaginadas = useMemo(() => {
        const inicio = (paginaActual - 1) * registrosPorPagina;
        return categoriasFiltradas.slice(inicio, inicio + registrosPorPagina);
    }, [categoriasFiltradas, paginaActual, registrosPorPagina]);

    const cargarCategorias = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('categoriarepuesto')
                .select('*')
                .order('id_categoria', { ascending: true });

            if (error) throw error;
            setCategorias(data || []);
        } catch (error) {
            console.error('Error al cargar categorías de repuestos:', error.message);
            setCategorias([]);
        } finally {
            setCargando(false);
        }
    };

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

    const refrescarCategorias = async () => {
        await cargarCategorias();
        if (onCategoriasActualizadas) {
            await onCategoriasActualizadas();
        }
    };

    const notificar = (mensaje, tipo = 'exito') => {
        setToast({ mostrar: true, mensaje, tipo });
    };

    const trasRegistroCategoria = async () => {
        await refrescarCategorias();
        notificar('Categoría agregada con éxito.');
    };

    const trasActualizarCategoria = async () => {
        await refrescarCategorias();
        notificar('Categoría actualizada con éxito.');
    };

    const trasEliminarCategoria = async () => {
        await refrescarCategorias();
        notificar('Categoría eliminada con éxito.');
    };

    const cerrarModalesInternos = () => {
        setMostrarRegistro(false);
        setMostrarEdicion(false);
        setMostrarEliminacion(false);
        setCategoriaSeleccionada(null);
    };

    const abrirEdicion = (categoria) => {
        setCategoriaSeleccionada(categoria);
        setMostrarEdicion(true);
    };

    const abrirEliminacion = (categoria) => {
        setCategoriaSeleccionada(categoria);
        setMostrarEliminacion(true);
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} size="xl" centered scrollable contentClassName="bg-dark text-white">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <div className="d-flex flex-column flex-md-row w-100 justify-content-between align-items-start align-items-md-center gap-3 pe-2">
                    <div>
                        <Modal.Title as="h5" className="fw-bold mb-1" style={{ color: '#A4841C' }}>
                            <i className="bi bi-tags-fill me-2"></i>
                            Categorías de repuestos
                        </Modal.Title>
                        <p className="text-white-50 small mb-0">
                            Inventario técnico de Ouroboros Car — categorías de piezas.
                        </p>
                    </div>
                    <Button
                        type="button"
                        className="border-0 shadow-sm flex-shrink-0 text-white"
                        style={{ backgroundColor: '#A4841C' }}
                        onClick={() => setMostrarRegistro(true)}
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
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Buscar por nombre..."
                                className="border-start-0 ps-0 text-white input-premium"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                disabled={cargando}
                            />
                        </InputGroup>
                    </Col>
                </Row>

                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="warning" role="status">
                            <span className="visually-hidden">Cargando categorías...</span>
                        </Spinner>
                        <p className="mt-2 text-white-50">Sincronizando con la base de datos...</p>
                    </div>
                ) : categorias.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-tools display-1 text-light"></i>
                        <p className="mt-3 text-white">No hay categorías registradas.</p>
                    </div>
                ) : categoriasFiltradas.length === 0 ? (
                    <Alert variant="info" className="text-center mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        No hay categorías que coincidan con &quot;{busqueda}&quot;.
                    </Alert>
                ) : (
                    <>
                        <div className="table-responsive shadow-sm rounded">
                            <Table hover variant="dark" responsive className="align-middle mb-0">
                                <thead style={{ borderBottom: '2px solid rgba(164, 132, 28, 0.3)' }}>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoriasPaginadas.map((cat) => (
                                        <tr key={cat.id_categoria} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <td className="fw-bold text-white">#{cat.id_categoria}</td>
                                            <td className="fw-semibold">{cat.nombre}</td>
                                            <td className="text-center text-nowrap">
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    style={{ borderColor: '#A4841C', color: '#A4841C' }}
                                                    className="me-2"
                                                    onClick={() => abrirEdicion(cat)}
                                                    title="Editar"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => abrirEliminacion(cat)}
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

            <Modal.Footer className="border-top border-secondary">
                <Button variant="secondary" onClick={manejarCierre}>
                    Cerrar
                </Button>
            </Modal.Footer>

            <ModalRegistroCategoria
                mostrar={mostrarRegistro}
                manejarCierre={cerrarModalesInternos}
                alGuardar={trasRegistroCategoria}
            />

            <ModalEditarCategoria
                mostrar={mostrarEdicion}
                manejarCierre={cerrarModalesInternos}
                categoria={categoriaSeleccionada}
                alActualizar={trasActualizarCategoria}
            />

            <ModalEliminarCategoria
                mostrar={mostrarEliminacion}
                manejarCierre={cerrarModalesInternos}
                categoria={categoriaSeleccionada}
                alEliminar={trasEliminarCategoria}
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

export default ModalVerCategoriasRepuestos;
