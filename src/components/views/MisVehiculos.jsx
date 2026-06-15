import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Form, Modal, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';
import CarruselVehiculo from '../vehiculos/CarruselVehiculo.jsx';

const MisVehiculos = () => {
    const [vehiculos, setVehiculos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cliente, setCliente] = useState(null);
    const [error, setError] = useState('');
    
    // Estados para el modal de añadir patente
    const [mostrarModal, setMostrarModal] = useState(false);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [nuevaPatente, setNuevaPatente] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No se encontró una sesión activa.');

            const { data: datosCliente, error: eCliente } = await supabase
                .from('clientes')
                .select('id_cliente')
                .eq('profile_id', user.id)
                .single();

            if (eCliente) throw eCliente;
            setCliente(datosCliente);

            const { data: misVehiculos, error: eVehiculos } = await supabase
                .from('vehiculoclientes')
                .select(`
                    id_registro,
                    id_cliente,
                    id_vehiculo,
                    fecha_compra,
                    estado_propiedad,
                    patente,
                    vehiculos (
                        url_imagen,
                        url_imagen2,
                        url_imagen3,
                        url_imagen4,
                        marca,
                        modelo,
                        anio,
                        color
                    )
                `)
                .eq('id_cliente', datosCliente.id_cliente);

            if (eVehiculos) throw eVehiculos;
            setVehiculos(misVehiculos || []);
        } catch (err) {
            console.error('Error:', err.message);
            setError('No se pudieron cargar tus vehículos.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        document.body.style.backgroundColor = '#121212';
        cargarDatos();
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    const abrirModalPatente = (item) => {
        setVehiculoSeleccionado(item);
        setNuevaPatente('');
        setMostrarModal(true);
    };

    const guardarPatente = async (e) => {
        e.preventDefault();
        if (!nuevaPatente.trim()) return;

        setGuardando(true);
        try {
            const { error: updateError } = await supabase
                .from('vehiculoclientes')
                .update({ patente: nuevaPatente.trim().toUpperCase() })
                .eq('id_registro', vehiculoSeleccionado.id_registro);

            if (updateError) throw updateError;

            setToast({ mostrar: true, mensaje: 'Patente registrada correctamente', tipo: 'exito' });
            setMostrarModal(false);
            cargarDatos(); // Recargar para actualizar la lista y ocultar el botón
        } catch (err) {
            console.error('Error al actualizar patente:', err.message);
            setToast({ mostrar: true, mensaje: 'Error al registrar la patente', tipo: 'error' });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Container className="main-page-container py-5">
            <Row className="mb-4">
                <Col>
                    <h2 className="fw-bold text-gold">Mis Vehículos Asignados</h2>
                    <p className="text-white-50">Gestiona la información de identificación de tus unidades.</p>
                </Col>
            </Row>

            {cargando ? (
                <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : vehiculos.length === 0 ? (
                <Card className="card-custom p-5 text-center">
                    <i className="bi bi-car-front text-muted display-1 mb-3"></i>
                    <h4 className="text-white-50">Aún no tienes vehículos asignados.</h4>
                </Card>
            ) : (
                <Row className="g-4">
                    {vehiculos.map((item) => (
                        <Col key={item.id_registro} xs={12} md={6} lg={4}>
                            <Card className="card-custom h-100 overflow-hidden shadow-lg">
                                <div className="admin-img-wrapper">
                                    <CarruselVehiculo vehiculo={item.vehiculos} height="220px" />
                                </div>
                                <Card.Body className="p-4 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h4 className="text-gold fw-bold mb-0 text-truncate" style={{ maxWidth: '70%' }}>
                                            {item.vehiculos?.marca} <span className="text-white">{item.vehiculos?.modelo}</span>
                                        </h4>
                                        <span className="badge border border-warning text-warning small">{item.estado_propiedad}</span>
                                    </div>

                                    <div className="flex-grow-1 text-white-50 small mb-4">
                                        <p className="mb-2"><i className="bi bi-calendar3 me-2 text-gold"></i>Año: {item.vehiculos?.anio}</p>
                                        <p className="mb-2"><i className="bi bi-palette2 me-2 text-gold"></i>Color: {item.vehiculos?.color}</p>
                                        <p className="mb-0">
                                            <i className="bi bi-hash me-2 text-gold"></i>
                                            Matrícula: <span className={item.patente ? "text-white fw-bold" : "text-muted italic"}>
                                                {item.patente || 'Pendiente de registro'}
                                            </span>
                                        </p>
                                    </div>

                                    {!item.patente && (
                                        <Button 
                                            className="btn-primary-custom w-100 py-2 fw-bold"
                                            onClick={() => abrirModalPatente(item)}
                                        >
                                            <i className="bi bi-plus-circle me-2"></i>Añadir Patente
                                        </Button>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Modal para añadir patente */}
            <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered contentClassName="modal-custom">
                <Form onSubmit={guardarPatente}>
                    <Modal.Header closeButton closeVariant="white">
                        <Modal.Title>Añadir Matrícula</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="small text-white-50">Ingresa la patente para el vehículo: <strong>{vehiculoSeleccionado?.vehiculos?.marca} {vehiculoSeleccionado?.vehiculos?.modelo}</strong></p>
                        <Form.Group>
                            <Form.Label className="small fw-bold">Número de Patente / Matrícula</Form.Label>
                            <Form.Control 
                                type="text" 
                                className="input-premium text-uppercase" 
                                placeholder="EJ: ABC-1234"
                                value={nuevaPatente}
                                onChange={(e) => setNuevaPatente(e.target.value)}
                                required
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setMostrarModal(false)}>Cancelar</Button>
                        <Button type="submit" className="btn-primary-custom" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar Matrícula'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onClose={() => setToast({ ...toast, mostrar: false })}
            />
        </Container>
    );
};

export default MisVehiculos;