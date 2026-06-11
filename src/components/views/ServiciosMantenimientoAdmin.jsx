import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, InputGroup, Form, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

// Importación de Componentes (Features)
import TablaServicios from '../servicios/TablaServicios.jsx';
import ModalRegistroServicio from '../servicios/ModalRegistroServicio.jsx';
import ModalEdicionServicio from '../servicios/ModalEdicionServicio.jsx';
import ModalEliminacionServicio from '../servicios/ModalEliminacionServicio.jsx';
import Paginacion from '../ordenamiento/Paginacion';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';

const ServiciosMantenimientoAdmin = () => {
    // --- ESTADOS ---
    const [listaServicios, setListaServicios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    
    // Estado para el objeto seleccionado en Edición/Eliminación
    const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

    // Estados de visibilidad de modales
    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mostrarEdicion, setMostrarEdicion] = useState(false);
    const [mostrarEliminacion, setMostrarEliminacion] = useState(false);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

    const notificar = (mensaje, tipo = 'exito') => {
        setToast({ mostrar: true, mensaje, tipo });
    };

    const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
    const [paginaActual, establecerPaginaActual] = useState(1);

    // --- LÓGICA DE DATOS ---
    const obtenerServicios = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('mantenimientoservicio')
                .select('*')
                .order('tipo_servicio', { ascending: true });

            if (error) throw error;
            setListaServicios(data || []);
        } catch (error) {
            console.error('Error al obtener servicios:', error.message);
            notificar('Error al cargar los servicios.', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        document.body.style.backgroundColor = '#121212';
        obtenerServicios();
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    // --- HANDLERS DE MODALES ---
    const abrirEdicion = (servicio) => {
        setServicioSeleccionado(servicio);
        setMostrarEdicion(true);
    };

    const abrirEliminacion = (servicio) => {
        setServicioSeleccionado(servicio);
        setMostrarEliminacion(true);
    };

    const cerrarModales = () => {
        setMostrarRegistro(false);
        setMostrarEdicion(false);
        setMostrarEliminacion(false);
        setServicioSeleccionado(null); // Limpieza crítica
    };

    // --- FILTRADO EN TIEMPO REAL ---
    const serviciosFiltrados = useMemo(() => {
        if (!busqueda.trim()) return listaServicios;
        const q = busqueda.toLowerCase().trim();
        return listaServicios.filter(s => 
            s.tipo_servicio.toLowerCase().includes(q)
        );
    }, [listaServicios, busqueda]);

    const serviciosPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * registrosPorPagina;
        return serviciosFiltrados.slice(inicio, inicio + registrosPorPagina);
    }, [serviciosFiltrados, paginaActual, registrosPorPagina]);

    useEffect(() => {
        const totalPaginas = Math.max(1, Math.ceil(serviciosFiltrados.length / registrosPorPagina));
        if (paginaActual > totalPaginas) {
            establecerPaginaActual(totalPaginas);
        }
    }, [serviciosFiltrados, registrosPorPagina, paginaActual]);

    return (
        <Container className="main-page-container py-4 mt-2">
            {/* Cabecera Responsiva */}
            <Row className="mb-4 align-items-center">
                <Col xs={12} md={6}>
                    <h4 className="fw-bold text-gold">Gestión de Servicios de Mantenimiento</h4>
                    <p className="text-white-50">Administra los tipos de servicios que ofrece el taller.</p>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
                    <Button
                        className="btn-primary-custom" 
                        onClick={() => setMostrarRegistro(true)}
                    >
                        <i className="bi bi-plus-circle-fill me-2"></i>Agregar Servicio
                    </Button>
                </Col>
            </Row>

            {/* Buscador */}
            <Row className="mb-4 align-items-center">
                <Col md={8}>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text className="border-end-0 input-group-text-custom">
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por tipo de servicio..."
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
                        <span className="visually-hidden">Cargando servicios...</span>
                    </Spinner>
                    <p className="mt-2 text-white-50">Sincronizando con la base de datos...</p>
                </div>
            ) : serviciosFiltrados.length > 0 ? (
                <>
                    <TablaServicios
                        servicios={serviciosPaginados}
                        onEditar={abrirEdicion}
                        onEliminar={abrirEliminacion}
                    />
                    <div className="mt-3">
                        <Paginacion
                            registrosPorPagina={registrosPorPagina}
                            totalRegistros={serviciosFiltrados.length}
                            paginaActual={paginaActual}
                            establecerPaginaActual={establecerPaginaActual}
                            establecerRegistrosPorPagina={establecerRegistrosPorPagina}
                        />
                    </div>
                </>
            ) : (
                <Alert variant="info" className="text-center mt-4">
                    <i className="bi bi-info-circle me-2"></i>
                    No se encontraron servicios de mantenimiento que coincidan con la búsqueda.
                </Alert>
            )}

            {/* --- MODALES DE LA FEATURE --- */}
            
            <ModalRegistroServicio 
                mostrar={mostrarRegistro} 
                manejarCierre={cerrarModales} 
                alGuardar={obtenerServicios} 
                notificar={notificar}
            />

            <ModalEdicionServicio 
                mostrar={mostrarEdicion} 
                manejarCierre={cerrarModales} 
                servicio={servicioSeleccionado} 
                alActualizar={obtenerServicios} 
                notificar={notificar}
            />

            <ModalEliminacionServicio 
                mostrar={mostrarEliminacion} 
                manejarCierre={cerrarModales} 
                servicio={servicioSeleccionado} 
                alEliminar={obtenerServicios} 
                notificar={notificar}
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

export default ServiciosMantenimientoAdmin;