import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, Table, Spinner, Card, InputGroup, Form, Modal, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import Paginacion from '../ordenamiento/Paginacion';
import NotificacionOperacion from '../rutas/NotificacionOperacion';

const ClientesAdmin = () => {
    // --- ESTADOS DE CLIENTES ---
    const [clientes, setClientes] = useState([]);
    const [cargandoClientes, setCargandoClientes] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina, setRegistrosPorPagina] = useState(5);

    // --- ESTADOS DE MODAL Y ASIGNACIÓN ---
    const [mostrarModal, setMostrarModal] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [vehiculosAsignados, setVehiculosAsignados] = useState([]);
    const [cargandoAsignados, setCargandoAsignados] = useState(false);

    // --- ESTADOS DE VEHÍCULOS DISPONIBLES ---
    const [todosVehiculos, setTodosVehiculos] = useState([]);
    const [idVehiculoSeleccionado, setIdVehiculoSeleccionado] = useState('');
    const [estadoPropiedad, setEstadoPropiedad] = useState('Propietario');
    const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().substring(0, 10));

    // --- NOTIFICACIONES ---
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });
    const [errorModal, setErrorModal] = useState('');

    // --- CARGAR CLIENTES DE SUPABASE ---
    const cargarClientes = async () => {
        try {
            setCargandoClientes(true);
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('id_cliente', { ascending: false });

            if (error) throw error;
            setClientes(data || []);
        } catch (err) {
            console.error('Error al cargar clientes:', err.message);
            setToast({ mostrar: true, mensaje: 'Error al cargar los clientes', tipo: 'error' });
        } finally {
            setCargandoClientes(false);
        }
    };

    // --- CARGAR TODOS LOS VEHÍCULOS ---
    const cargarTodosVehiculos = async () => {
        try {
            const { data, error } = await supabase
                .from('vehiculos')
                .select('id_vehiculo, marca, modelo, anio, color')
                .order('marca', { ascending: true });

            if (error) throw error;
            setTodosVehiculos(data || []);
        } catch (err) {
            console.error('Error al cargar vehículos registrados:', err.message);
        }
    };

    // --- CARGAR VEHÍCULOS DEL CLIENTE SELECCIONADO ---
    const cargarVehiculosAsignados = async (idCliente) => {
        try {
            setCargandoAsignados(true);
            const { data, error } = await supabase
                .from('vehiculoclientes')
                .select(`
                    id_registro,
                    id_cliente,
                    id_vehiculo,
                    fecha_compra,
                    estado_propiedad,
                    vehiculos (
                        id_vehiculo,
                        marca,
                        modelo,
                        anio,
                        color
                    )
                `)
                .eq('id_cliente', idCliente);

            if (error) throw error;
            setVehiculosAsignados(data || []);
        } catch (err) {
            console.error('Error al cargar vehículos asignados:', err.message);
            setErrorModal('Error al cargar los vehículos asignados al cliente.');
        } finally {
            setCargandoAsignados(false);
        }
    };

    // --- EFECTOS INICIALES ---
    useEffect(() => {
        document.body.style.backgroundColor = '#121212';
        cargarClientes();
        cargarTodosVehiculos();
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    // --- FILTRADO DE CLIENTES ---
    const clientesFiltrados = useMemo(() => {
        if (!busqueda.trim()) return clientes;
        const q = busqueda.toLowerCase().trim();
        return clientes.filter(c => 
            c.nombres?.toLowerCase().includes(q) || 
            c.apellidos?.toLowerCase().includes(q) || 
            c.cedula?.includes(q)
        );
    }, [clientes, busqueda]);

    // --- PAGINACIÓN DE CLIENTES ---
    const clientesPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * registrosPorPagina;
        return clientesFiltrados.slice(inicio, inicio + registrosPorPagina);
    }, [clientesFiltrados, paginaActual, registrosPorPagina]);

    // Ajustar página actual si cambia el filtro
    useEffect(() => {
        const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / registrosPorPagina));
        if (paginaActual > totalPaginas) {
            setPaginaActual(totalPaginas);
        }
    }, [clientesFiltrados, registrosPorPagina, paginaActual]);

    // --- ABRIR MODAL ADMINISTRACIÓN ---
    const abrirModalVehiculos = (cliente) => {
        setClienteSeleccionado(cliente);
        setMostrarModal(true);
        setErrorModal('');
        cargarVehiculosAsignados(cliente.id_cliente);
        // Reset formulario de asignación
        setIdVehiculoSeleccionado('');
        setEstadoPropiedad('Propietario');
        setFechaCompra(new Date().toISOString().substring(0, 10));
    };

    // --- CERRAR MODAL ---
    const cerrarModal = () => {
        setMostrarModal(false);
        setClienteSeleccionado(null);
        setVehiculosAsignados([]);
    };

    // --- GUARDAR NUEVA ASIGNACIÓN ---
    const guardarAsignacion = async (e) => {
        e.preventDefault();
        setErrorModal('');

        if (!idVehiculoSeleccionado) {
            setErrorModal('Debe seleccionar un vehículo de la lista.');
            return;
        }

        try {
            const nuevaAsignacion = {
                id_cliente: clienteSeleccionado.id_cliente,
                id_vehiculo: parseInt(idVehiculoSeleccionado),
                fecha_compra: new Date(fechaCompra).toISOString(),
                estado_propiedad: estadoPropiedad,
            };

            const { error } = await supabase
                .from('vehiculoclientes')
                .insert([nuevaAsignacion]);

            if (error) throw error;

            setToast({ mostrar: true, mensaje: 'Vehículo asignado correctamente', tipo: 'exito' });
            
            // Recargar vehículos asignados
            await cargarVehiculosAsignados(clienteSeleccionado.id_cliente);

            // Limpiar formulario
            setIdVehiculoSeleccionado('');
            setEstadoPropiedad('Propietario');
            setFechaCompra(new Date().toISOString().substring(0, 10));
        } catch (err) {
            console.error('Error al guardar asignación:', err.message);
            setErrorModal('Error al registrar la asignación del vehículo: ' + err.message);
        }
    };

    // --- ELIMINAR ASIGNACIÓN ---
    const eliminarAsignacion = async (idRegistro) => {
        setErrorModal('');
        try {
            const { error } = await supabase
                .from('vehiculoclientes')
                .delete()
                .eq('id_registro', idRegistro);

            if (error) throw error;

            setToast({ mostrar: true, mensaje: 'Asignación removida correctamente', tipo: 'exito' });
            await cargarVehiculosAsignados(clienteSeleccionado.id_cliente);
        } catch (err) {
            console.error('Error al eliminar asignación:', err.message);
            setErrorModal('Error al eliminar la asignación: ' + err.message);
        }
    };

    return (
        <Container className="py-4 mt-2" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
            <style>
                {`
                    .input-premium {
                        background-color: #2b2b2b !important;
                        color: #ffffff !important;
                        border: 1px solid #A4841C !important;
                    }
                    .input-premium:focus {
                        box-shadow: 0 0 8px rgba(164, 132, 28, 0.5) !important;
                        border-color: #ffffff !important;
                    }
                    .input-premium option {
                        background-color: #1e1e1e !important;
                        color: #ffffff !important;
                    }
                `}
            </style>
            
            {/* Cabecera */}
            <Row className="mb-4 align-items-center">
                <Col xs={12} md={6}>
                    <h2 className="fw-bold mb-1" style={{ color: '#A4841C' }}>Directorio de Clientes</h2>
                    <p className="text-white" style={{ color: '#ffffff !important' }}>
                        Visualiza los clientes registrados y administra las asignaciones de sus vehículos.
                    </p>
                </Col>
            </Row>

            {/* Buscador */}
            <Row className="mb-4 align-items-center">
                <Col md={8}>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text className="border-end-0" style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por nombre o cédula..."
                            className="border-start-0 ps-0 text-white form-control-custom"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            {/* Listado principal */}
            <Row>
                <Col>
                    <Card className="shadow-sm border-0 text-white" style={{ backgroundColor: '#1e1e1e', border: '1px solid rgba(164, 132, 28, 0.3)' }}>
                        <Card.Header className="py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1e1e1e', borderBottom: '1px solid rgba(164, 132, 28, 0.3)' }}>
                            <h5 className="fw-bold mb-0" style={{ color: '#A4841C' }}>Clientes Registrados</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover variant="dark" responsive className="align-middle mb-0">
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(164, 132, 28, 0.3)' }}>
                                        <th className="ps-4">ID</th>
                                        <th>CLIENTE</th>
                                        <th>CÉDULA</th>
                                        <th>TELÉFONO</th>
                                        <th>DIRECCIÓN</th>
                                        <th className="text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargandoClientes ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <Spinner animation="border" variant="warning" size="sm" className="me-2" />
                                                Cargando clientes...
                                            </td>
                                        </tr>
                                    ) : clientesFiltrados.length > 0 ? (
                                        clientesPaginados.map((c) => (
                                            <tr key={c.id_cliente} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                <td className="ps-4 text-white fw-bold">#{c.id_cliente}</td>
                                                <td>
                                                    <div className="fw-semibold">{c.nombres} {c.apellidos}</div>
                                                </td>
                                                <td>{c.cedula}</td>
                                                <td>{c.telefono || <span className="text-white-50 small italic">No registrado</span>}</td>
                                                <td className="small text-truncate" style={{ maxWidth: '250px' }}>
                                                    {c.direccion || <span className="text-white-50 small italic">No registrada</span>}
                                                </td>
                                                <td className="text-center">
                                                    <Button 
                                                        variant="outline-warning" 
                                                        size="sm"
                                                        style={{ borderColor: '#A4841C', color: '#A4841C' }}
                                                        onClick={() => abrirModalVehiculos(c)}
                                                        title="Administrar Vehículos"
                                                    >
                                                        <i className="bi bi-car-front-fill me-2"></i>
                                                        Administrar vehículos
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-white">
                                                No se encontraron clientes que coincidan con la búsqueda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                        {!cargandoClientes && clientesFiltrados.length > 0 && (
                            <div className="p-3" style={{ borderTop: '1px solid rgba(164, 132, 28, 0.3)' }}>
                                <Paginacion
                                    registrosPorPagina={registrosPorPagina}
                                    totalRegistros={clientesFiltrados.length}
                                    paginaActual={paginaActual}
                                    establecerPaginaActual={setPaginaActual}
                                    establecerRegistrosPorPagina={setRegistrosPorPagina}
                                />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* --- MODAL PARA ADMINISTRAR VEHÍCULOS DEL CLIENTE --- */}
            <Modal 
                show={mostrarModal} 
                onHide={cerrarModal} 
                size="xl" 
                centered 
                backdrop="static"
                contentClassName="bg-dark text-white"
                style={{ border: '1px solid rgba(164, 132, 28, 0.5)' }}
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                    <Modal.Title style={{ color: '#A4841C' }} className="fw-bold">
                        <i className="bi bi-car-front-fill me-2"></i>
                        Vehículos de: {clienteSeleccionado?.nombres} {clienteSeleccionado?.apellidos}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {errorModal && <Alert variant="danger">{errorModal}</Alert>}

                    <Row className="g-4">
                        {/* Columna Izquierda: Vehículos ya Asignados */}
                        <Col lg={7}>
                            <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#ffffff', borderColor: 'rgba(164, 132, 28, 0.3)' }}>
                                Vehículos Asignados
                            </h5>
                            
                            {cargandoAsignados ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="warning" size="sm" className="me-2" />
                                    Cargando asignaciones...
                                </div>
                            ) : vehiculosAsignados.length > 0 ? (
                                <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '400px' }}>
                                    <Table hover variant="dark" className="align-middle mb-0 small">
                                        <thead>
                                            <tr className="bg-secondary text-white">
                                                <th className="ps-3">VEHÍCULO</th>
                                                
                                                <th>COMPRA</th>
                                                <th>PROPIEDAD</th>
                                                <th className="text-center">ACCION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vehiculosAsignados.map((item) => (
                                                <tr key={item.id_registro}>
                                                    <td className="ps-3">
                                                        {item.vehiculos ? (
                                                            <div>
                                                                <strong>{item.vehiculos.marca} {item.vehiculos.modelo}</strong>
                                                                <div className="text-white-50 xsmall">{item.vehiculos.color} | {item.vehiculos.anio}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-danger italic">Vehículo no encontrado (ID: {item.id_vehiculo})</span>
                                                        )}
                                                    </td>
                                                        <td>{item.fecha_compra ? new Date(item.fecha_compra).toLocaleDateString() : '---'}</td>
                                                    <td>
                                                        <span className="badge border border-warning text-warning">{item.estado_propiedad || 'Propietario'}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm"
                                                            title="Eliminar Asignación"
                                                            onClick={() => eliminarAsignacion(item.id_registro)}
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
                                <div className="text-center py-5 text-white border rounded" style={{ borderColor: 'rgba(164,132,28,0.4)' }}>
                                    <i className="bi bi-car-front display-4 d-block mb-3" style={{ color: '#A4841C' }}></i>
                                    Este cliente no tiene vehículos asignados actualmente.
                                </div>
                            )}
                        </Col>

                        {/* Columna Derecha: Formulario de Nueva Asignación */}
                        <Col lg={5} className="border-start border-secondary ps-lg-4">
                            <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#A4841C', borderColor: 'rgba(164, 132, 28, 0.3)' }}>
                                Asignar Vehículo Cliente
                            </h5>
                            
                            <Form onSubmit={guardarAsignacion}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Seleccionar Vehículo</Form.Label>
                                    <Form.Select 
                                        className="input-premium"
                                        value={idVehiculoSeleccionado}
                                        onChange={(e) => setIdVehiculoSeleccionado(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Seleccione un auto registrado --</option>
                                        {todosVehiculos.map((v) => (
                                            <option key={v.id_vehiculo} value={v.id_vehiculo}>
                                                {v.marca} {v.modelo} ({v.anio}) - {v.color}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>


                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Estado de Propiedad</Form.Label>
                                    <Form.Select
                                        className="input-premium"
                                        value={estadoPropiedad}
                                        onChange={(e) => setEstadoPropiedad(e.target.value)}
                                        required
                                    >
                                        <option value="Propietario">Propietario</option>
                                        <option value="Arrendatario">Arrendatario</option>
                                        <option value="Leasing">Leasing</option>
                                        <option value="Otro">Otro</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold">Fecha de Compra</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="input-premium"
                                        value={fechaCompra}
                                        onChange={(e) => setFechaCompra(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button 
                                    type="submit" 
                                    className="w-100 py-2 shadow-sm fw-bold btn-primary-custom"
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Guardar asignación
                                </Button>
                            </Form>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-top border-secondary">
                    <Button variant="secondary" onClick={cerrarModal}>
                        Cerrar Ventana
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Notificación Toast */}
            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onClose={() => setToast({ mostrar: false, mensaje: '', tipo: '' })}
            />
        </Container>
    );
};

export default ClientesAdmin;
