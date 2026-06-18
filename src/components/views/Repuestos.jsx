import { useState, useEffect } from 'react';
import { supabase } from '../database/supabaseconfig.js';
import { Button, Container, Row, Col, InputGroup, Form, Spinner, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// Importación de Componentes (Features)
import ModalRegistroRepuesto from '../repuestos/ModaRegistroRepuesto.jsx';
import ModalEdicionRepuesto from '../repuestos/ModalEdicionRepuesto.jsx';
import ModalEliminacionRepuesto from '../repuestos/ModalEliminacionRepuesto.jsx';
import ModalVerCategoriasRepuestos from '../CatalogoRepuestos/ModalVerCategoriasRepuestos.jsx';
import Paginacion from '../ordenamiento/Paginacion';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';
import { Pencil, Trash2, Package, Layers } from 'lucide-react';

const Repuestos = () => {
    const navegar = useNavigate();
    // --- ESTADOS ---
    const [listaRepuestos, setListaRepuestos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    
    // Estado para el objeto seleccionado en Edición/Eliminación
    const [repuestoSeleccionado, setRepuestoSeleccionado] = useState(null);

    // Estados de visibilidad de modales
    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mostrarEdicion, setMostrarEdicion] = useState(false);
    const [mostrarEliminacion, setMostrarEliminacion] = useState(false);
    const [mostrarCategorias, setMostrarCategorias] = useState(false);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

    const notificar = (mensaje, tipo = 'exito') => {
        setToast({ mostrar: true, mensaje, tipo });
    };

    const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
    const [paginaActual, establecerPaginaActual] = useState(1);

    // --- LÓGICA DE DATOS (Basada en tu DDL) ---
    const obtenerRepuestos = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('repuestos')
                .select(`
                    id_repuesto,
                    nombre,
                    descripcion,
                    precio_repuesto,
                    foto,
                    id_categoria,
                    categoriarepuesto (
                        id_categoria,
                        nombre
                    )
                `)
                .order('id_repuesto', { ascending: false });

            if (error) throw error;
            setListaRepuestos(data || []);
        } catch (error) {
            console.error('Error al obtener repuestos:', error.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        document.body.style.backgroundColor = '#121212';
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    useEffect(() => {
        obtenerRepuestos();
    }, []);

    // --- HANDLERS DE MODALES ---
    const abrirEdicion = (repuesto) => {
        setRepuestoSeleccionado(repuesto);
        setMostrarEdicion(true);
    };

    const abrirEliminacion = (repuesto) => {
        setRepuestoSeleccionado(repuesto);
        setMostrarEliminacion(true);
    };

    const cerrarModales = () => {
        setMostrarRegistro(false);
        setMostrarEdicion(false);
        setMostrarEliminacion(false);
        setRepuestoSeleccionado(null); // Limpieza crítica
    };

    // --- FILTRADO EN TIEMPO REAL ---
    const repuestosFiltrados = listaRepuestos.filter(r => 
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.categoriarepuesto?.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const repuestosPaginados = repuestosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    useEffect(() => {
        const totalPaginas = Math.max(1, Math.ceil(repuestosFiltrados.length / registrosPorPagina));
        if (paginaActual > totalPaginas) {
            establecerPaginaActual(totalPaginas);
        }
    }, [repuestosFiltrados, registrosPorPagina, paginaActual]);

    return (
        <Container className="main-page-container py-4 mt-2">
            {/* Cabecera Responsiva */}
            <Row className="mb-4 align-items-center">
                <Col xs={12} md={6}>
                    <h2 className="fw-bold text-gold">Inventario de Repuestos</h2>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
                    <Button
                        variant="outline-light"
                        className="me-2 shadow-sm btn-sm"
                        onClick={() => navegar("/perfil-cliente")}
                    >
                        <i className="bi bi-person-circle me-2"></i>
                        Mi Perfil
                    </Button>
                    <Button
                        variant="outline-warning"
                        style={{ borderColor: '#A4841C', color: '#A4841C' }}
                        className="me-2 shadow-sm"
                        onClick={() => setMostrarCategorias(true)}
                    >
                        <i className="bi bi-tags-fill me-2"></i>Ver Categorías
                    </Button>
                    <Button
                        className="btn-primary-custom" 
                        onClick={() => setMostrarRegistro(true)}
                    >
                        <i className="bi bi-plus-circle-fill me-2"></i>Agregar Repuesto
                    </Button>
                </Col>
            </Row>

            {/* Buscador y Toggle de Vista */}
            <Row className="mb-4 align-items-center">
                <Col md={8}>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text className="border-end-0 input-group-text-custom">
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por nombre o categoría..."
                            className="border-start-0 ps-0 form-control-custom"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            {/* Área Principal de Contenido */}
            {cargando ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="warning" role="status">
                        <span className="visually-hidden">Cargando repuestos...</span>
                    </Spinner>
                    <p className="mt-2 text-white-50">Sincronizando con la base de datos...</p>
                </div>
            ) : repuestosFiltrados.length > 0 ? (
                <>
                    <Row className="g-4">
                        {repuestosPaginados.map((repuesto) => (
                            <Col key={repuesto.id_repuesto} md={6} lg={4} xl={3}>
                                <Card className="card-custom card-hover-custom h-100">
                                    <div className="admin-img-wrapper" style={{ height: '200px' }}>
                                        {repuesto.foto ? (
                                            <Card.Img 
                                                variant="top" 
                                                src={repuesto.foto} 
                                                className="h-100 w-100 object-cover hover-zoom" 
                                            />
                                        ) : (
                                            <div className="h-100 bg-dark d-flex flex-column align-items-center justify-content-center border-bottom border-secondary border-opacity-25">
                                                <Package size={48} className="text-gold opacity-25" />
                                                <span className="text-muted small mt-2 uppercase font-mono">Sin imagen</span>
                                            </div>
                                        )}
                                    </div>
                                    <Card.Body className="d-flex flex-column p-4">
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h5 className="fw-bold text-gold mb-0">{repuesto.nombre}</h5>
                                                <Badge className="badge-custom">
                                                    ${Number(repuesto.precio_repuesto).toFixed(2)}
                                                </Badge>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 text-white-50 small mb-2">
                                                <Layers size={14} className="text-gold" />
                                                <span>{repuesto.categoriarepuesto?.nombre || 'General'}</span>
                                            </div>
                                            <p className="text-white-50 small mb-0 line-clamp-2">
                                                {repuesto.descripcion || 'Sin descripción técnica disponible.'}
                                            </p>
                                        </div>
                                        
                                        <div className="d-flex gap-2 mt-auto pt-3 border-top border-secondary border-opacity-25">
                                            <Button 
                                                variant="outline-warning" 
                                                size="sm" 
                                                className="flex-grow-1 btn-outline-gold"
                                                onClick={() => abrirEdicion(repuesto)}
                                            >
                                                <Pencil size={14} className="me-2" /> Editar
                                            </Button>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                className="btn-outline-danger-custom"
                                                onClick={() => abrirEliminacion(repuesto)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <div className="mt-3">
                        <Paginacion
                            registrosPorPagina={registrosPorPagina}
                            totalRegistros={repuestosFiltrados.length}
                            paginaActual={paginaActual}
                            establecerPaginaActual={establecerPaginaActual}
                            establecerRegistrosPorPagina={establecerRegistrosPorPagina}
                        />
                    </div>
                </>
            ) : (
                <div className="text-center py-5">
                    <i className="bi bi-tools display-1 text-light"></i>
                    <p className="mt-3 text-white">No se encontraron piezas en el inventario.</p>
                </div>
            )}

            {/* --- MODALES DE LA FEATURE --- */}
            
            <ModalRegistroRepuesto 
                mostrar={mostrarRegistro} 
                manejarCierre={cerrarModales} 
                alGuardar={obtenerRepuestos} 
                notificar={notificar}
            />

            <ModalEdicionRepuesto 
                mostrar={mostrarEdicion} 
                manejarCierre={cerrarModales} 
                repuesto={repuestoSeleccionado} 
                alActualizar={obtenerRepuestos} 
                notificar={notificar}
            />

            <ModalEliminacionRepuesto 
                mostrar={mostrarEliminacion} 
                manejarCierre={cerrarModales} 
                repuesto={repuestoSeleccionado} 
                alEliminar={obtenerRepuestos} 
                notificar={notificar}
            />

            <ModalVerCategoriasRepuestos
                mostrar={mostrarCategorias}
                manejarCierre={() => setMostrarCategorias(false)}
                onCategoriasActualizadas={obtenerRepuestos}
            />

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onClose={() => setToast({ mostrar: false, mensaje: '', tipo: '' })}
            />

        </Container>
    );
};

export default Repuestos;