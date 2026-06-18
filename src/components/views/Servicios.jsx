import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, Spinner, InputGroup, Form, Card } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import ModalRegistroServicio from '../servicios/ModalRegistroServicio.jsx';
import ModalEdicionServicio from '../servicios/ModalEdicionServicio.jsx';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';
import Paginacion from '../ordenamiento/Paginacion.jsx';
import { Search, PlusCircle, Pencil, Trash2, Wrench } from 'lucide-react';

const Servicios = () => {
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [textoBusqueda, setTextoBusqueda] = useState('');
    
    const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [servicioEditar, setServicioEditar] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

    const [registrosPorPagina, setRegistrosPorPagina] = useState(6);
    const [paginaActual, setPaginaActual] = useState(1);

    const cargarServicios = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from('mantenimientoservicio')
                .select('*')
                .order('id_servicio', { ascending: false });
            if (error) throw error;
            setServicios(data || []);
        } catch (err) {
            console.error('Error al cargar servicios:', err);
            mostrarToast('Error al cargar la lista de servicios', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarServicios();
    }, []);

    const mostrarToast = (mensaje, tipo) => {
        setToast({ mostrar: true, mensaje, tipo });
    };

    const serviciosFiltrados = useMemo(() => {
        if (!textoBusqueda.trim()) return servicios;
        const search = textoBusqueda.toLowerCase().trim();
        return servicios.filter(s => s.tipo_servicio.toLowerCase().includes(search));
    }, [textoBusqueda, servicios]);

    const serviciosPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * registrosPorPagina;
        return serviciosFiltrados.slice(inicio, inicio + registrosPorPagina);
    }, [serviciosFiltrados, paginaActual, registrosPorPagina]);

    const eliminarServicio = async (id, fotoUrl) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) return;
        
        try {
            const { error } = await supabase
                .from('mantenimientoservicio')
                .delete()
                .eq('id_servicio', id);
            if (error) throw error;

            if (fotoUrl) {
                const fileName = fotoUrl.split('/').pop().split('?')[0];
                await supabase.storage.from('servicio_imagenes').remove([fileName]).catch(e => console.warn(e));
            }

            mostrarToast('Servicio eliminado correctamente', 'exito');
            cargarServicios();
        } catch (err) {
            mostrarToast('Error al eliminar el servicio', 'error');
        }
    };

    return (
        <Container fluid className="main-page-container py-4 mt-2">
            <Row className="mb-4 align-items-center">
                <Col xs={12} md={6}>
                    <h2 className="fw-bold text-gold">Catálogo de Servicios</h2>
                    <p className="text-white-50">Gestiona los tipos de mantenimiento y precios de Ouroboros.</p>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
                    <Button className="btn-primary-custom" onClick={() => setMostrarModalRegistro(true)}>
                        <PlusCircle size={18} className="me-2" />
                        Nuevo Servicio
                    </Button>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={8}>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text className="input-group-text-custom">
                            <Search size={18} />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por tipo de servicio..."
                            className="form-control-custom"
                            value={textoBusqueda}
                            onChange={(e) => setTextoBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            {cargando ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="warning" />
                    <p className="mt-2 text-white-50">Sincronizando servicios con Supabase...</p>
                </div>
            ) : (
                <>
                    <Row className="g-4">
                        {serviciosPaginados.map((servicio) => (
                            <Col key={servicio.id_servicio} md={6} lg={4}>
                                <Card className="card-custom card-hover-custom h-100">
                                    <div className="admin-img-wrapper" style={{ height: '220px' }}>
                                        {servicio.foto ? (
                                            <Card.Img 
                                                variant="top" 
                                                src={servicio.foto} 
                                                className="h-100 w-100 object-cover hover-zoom" 
                                            />
                                        ) : (
                                            <div className="h-100 bg-dark d-flex flex-column align-items-center justify-content-center border-bottom border-secondary border-opacity-25">
                                                <Wrench size={48} className="text-gold opacity-25" />
                                                <span className="text-muted small mt-2 uppercase font-mono">Sin imagen técnica</span>
                                            </div>
                                        )}
                                    </div>
                                    <Card.Body className="d-flex flex-column p-4">
                                        <div className="mb-3">
                                            <h5 className="fw-bold text-gold mb-1">{servicio.tipo_servicio}</h5>
                                            <div className="text-white-50 small mb-2">ID Servicio: #{servicio.id_servicio}</div>
                                            <h4 className="fw-bold text-white mb-0">
                                                {servicio.precio_servicio ? `$${servicio.precio_servicio}` : 'Consultar Precio'}
                                            </h4>
                                        </div>
                                        
                                        <div className="d-flex gap-2 mt-auto pt-3 border-top border-secondary border-opacity-25">
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                className="flex-grow-1"
                                                onClick={() => {
                                                    setServicioEditar(servicio);
                                                    setMostrarModalEdicion(true);
                                                }}
                                            >
                                                <Pencil size={14} className="me-2" /> Editar
                                            </Button>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                onClick={() => eliminarServicio(servicio.id_servicio, servicio.foto)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                        {serviciosFiltrados.length === 0 && (
                            <Col xs={12} className="text-center py-5">
                                <Wrench size={40} className="text-muted mb-3 mx-auto" />
                                <div className="text-muted">No se encontraron servicios que coincidan.</div>
                            </Col>
                        )}
                    </Row>
                    
                    {serviciosFiltrados.length > 0 && (
                        <div className="mt-5">
                            <Paginacion
                                registrosPorPagina={registrosPorPagina}
                                totalRegistros={serviciosFiltrados.length}
                                paginaActual={paginaActual}
                                establecerPaginaActual={setPaginaActual}
                                establecerRegistrosPorPagina={setRegistrosPorPagina}
                            />
                        </div>
                    )}
                </>
            )}

            <ModalRegistroServicio 
                mostrar={mostrarModalRegistro}
                manejarCierre={() => setMostrarModalRegistro(false)}
                alGuardar={cargarServicios}
                notificar={(msg, tipo) => mostrarToast(msg, tipo === 'exito' ? 'exito' : 'error')}
            />

            {servicioEditar && (
                <ModalEdicionServicio
                    mostrar={mostrarModalEdicion}
                    manejarCierre={() => {
                        setMostrarModalEdicion(false);
                        setServicioEditar(null);
                    }}
                    servicio={servicioEditar}
                    alActualizar={cargarServicios}
                    notificar={(msg, tipo) => mostrarToast(msg, tipo === 'exito' ? 'exito' : 'error')}
                />
            )}

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onClose={() => setToast({ ...toast, mostrar: false })}
            />
        </Container>
    );
};

export default Servicios;