import { useState, useEffect } from 'react';
import { supabase } from '../database/supabaseconfig.js';
import { Button, Container, Row, Col, InputGroup, Form, Spinner } from 'react-bootstrap';

// Importación de Componentes (Features)
import TablaRepuestos from '../repuestos/TablaRepuestos.jsx';
import ModalRegistroRepuesto from '../repuestos/ModaRegistroRepuesto.jsx';
import ModalEdicionRepuesto from '../repuestos/ModalEdicionRepuesto.jsx';
import ModalEliminacionRepuesto from '../repuestos/ModalEliminacionRepuesto.jsx';
import ModalVerCategoriasRepuestos from '../CatalogoRepuestos/ModalVerCategoriasRepuestos.jsx';
import Paginacion from '../ordenamiento/Paginacion';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';

const Repuestos = () => {
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
        <Container className="py-4 mt-2" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
            {/* Cabecera Responsiva */}
            <Row className="mb-4 align-items-center">
                <Col xs={12} md={6}>
                    <h2 className="fw-bold" style={{ color: '#A4841C' }}>Inventario de Repuestos</h2>
                
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
                    <Button
                        variant="outline-warning"
                        style={{ borderColor: '#A4841C', color: '#A4841C' }}
                        className="me-2 shadow-sm"
                        onClick={() => setMostrarCategorias(true)}
                    >
                        <i className="bi bi-tags-fill me-2"></i>Ver Categorías
                    </Button>
                    <Button
                        style={{ backgroundColor: '#A4841C' }}
                        className="border-0 shadow-sm" 
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
                        <InputGroup.Text className="border-end-0" style={{ backgroundColor: '#2b2b2b', color: '#A4841C', borderColor: '#A4841C' }}>
                            <i className="bi bi-search" style={{ color: '#A4841C' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por nombre o categoría..."
                            className="border-start-0 ps-0 text-white"
                            style={{ backgroundColor: '#2b2b2b', borderColor: '#A4841C' }}
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
                    <TablaRepuestos
                        repuestos={repuestosPaginados}
                        onEditar={abrirEdicion}
                        onEliminar={abrirEliminacion}
                    />
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