import { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../database/supabaseconfig.js';
import NotificacionOperacion from '../rutas/NotificacionOperacion.jsx';
import CarruselVehiculo from '../vehiculos/CarruselVehiculo.jsx';

const HORARIO_TALLER = { inicio: '08:00', fin: '17:00' };

const AgendarCita = () => {
  const navegar = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

  const [formulario, setFormulario] = useState({
    id_registro: '',
    id_servicio: '',
    fecha: '',
    hora_inicio: '',
    observaciones: '',
  });

  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    cargarDatosIniciales();
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorCarga('No hay sesión activa. Inicia sesión para agendar una cita.');
        return;
      }

      const { data: datosCliente, error: errorCliente } = await supabase
        .from('clientes')
        .select('id_cliente, nombres, apellidos, telefono, foto_cliente')
        .eq('profile_id', user.id)
        .single();

      if (errorCliente) throw errorCliente;
      setCliente(datosCliente);

      const [resVehiculos, resServicios] = await Promise.all([
        supabase
          .from('vehiculoclientes')
          .select(`
            id_registro,
            id_vehiculo,
            vehiculos (
              id_vehiculo,
              marca,
              modelo,
              anio,
              color,
              url_imagen,
              url_imagen2,
              url_imagen3,
              url_imagen4
            )
          `)
          .eq('id_cliente', datosCliente.id_cliente),
        supabase
          .from('mantenimientoservicio')
          .select('id_servicio, tipo_servicio, precio_servicio')
          .order('tipo_servicio', { ascending: true }),
      ]);

      if (resVehiculos.error) throw resVehiculos.error;

      const listaVehiculos = resVehiculos.data || [];
      setVehiculos(listaVehiculos);

      if (listaVehiculos.length === 1 && listaVehiculos[0]?.id_registro) {
        setFormulario((prev) => ({
          ...prev,
          id_registro: String(listaVehiculos[0].id_registro),
        }));
      }

      if (!resServicios.error && resServicios.data?.length > 0) {
        setServicios(resServicios.data);
      }
    } catch (err) {
      console.error('Error al cargar datos para agendar cita:', err.message);
      setErrorCarga(err.message || 'No se pudieron cargar los datos necesarios.');
    } finally {
      setCargando(false);
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => {
      const actualizado = { ...prev, [name]: value };
      return actualizado;
    });
    setErrorFormulario('');
  };

  const seleccionarVehiculo = (idRegistro) => {
    setFormulario((prev) => ({ ...prev, id_registro: String(idRegistro) }));
    setErrorFormulario('');
  };

  const calcularHoraFin = (horaInicio) => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const fecha = new Date();
    fecha.setHours(horas + 1, minutos, 0, 0);
    return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  };

  const obtenerVehiculoSeleccionado = () => {
    const registro = vehiculos.find(
      (v) => String(v.id_registro) === String(formulario.id_registro)
    );
    return registro?.vehiculos ?? null;
  };

  const obtenerServicioSeleccionado = () => {
    return servicios.find(
      (s) => String(s.id_servicio) === String(formulario.id_servicio)
    );
  };

  const aMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const formatearHoraResumen = (hora) => {
    if (!hora) return '';
    const [h, m] = hora.split(':');
    let horas = parseInt(h, 10);
    const periodo = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;
    return `${String(horas).padStart(2, '0')}:${m} ${periodo}`;
  };

  const validarFormulario = () => {
    const { id_registro, fecha, hora_inicio } = formulario;

    if (!id_registro) {
      setErrorFormulario('Selecciona el vehículo que deseas llevar a mantenimiento.');
      return false;
    }

    if (!fecha) {
      setErrorFormulario('Indica la fecha de la cita.');
      return false;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(`${fecha}T00:00:00`);
    if (fechaCita < hoy) {
      setErrorFormulario('La fecha de la cita debe ser hoy o una fecha futura.');
      return false;
    }

    if (!hora_inicio) {
      setErrorFormulario('Indica el horario de inicio de la cita.');
      return false;
    }

    if (aMinutos(hora_inicio) < aMinutos(HORARIO_TALLER.inicio)) {
      setErrorFormulario(`El horario de inicio debe ser a partir de las ${HORARIO_TALLER.inicio}.`);
      return false;
    }

    // Validar que la cita estimada (1 hora) no supere el cierre del taller
    const finEstimado = calcularHoraFin(hora_inicio);
    if (aMinutos(finEstimado) > aMinutos(HORARIO_TALLER.fin)) {
      setErrorFormulario(`La cita estimada superaría el horario de cierre (${HORARIO_TALLER.fin}).`);
      return false;
    }

    return true;
  };

  const construirMotivo = () => {
    const vehiculo = obtenerVehiculoSeleccionado();
    const servicio = obtenerServicioSeleccionado();
    const tipoServicio = servicio?.tipo_servicio || 'Mantenimiento general';

    const descripcionVehiculo = vehiculo
      ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}${vehiculo.color ? ` (${vehiculo.color})` : ''}`
      : 'Vehículo no especificado';

    const partes = [
      `${tipoServicio}`,
      `Vehículo: ${descripcionVehiculo}`,
    ];

    if (formulario.observaciones.trim()) {
      partes.push(`Observaciones: ${formulario.observaciones.trim()}`);
    }

    return partes.join(' | ');
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrorFormulario('');

    if (!validarFormulario()) return;

    setEnviando(true);

    try {
      const nuevaCita = {
        id_cliente: cliente.id_cliente,
        id_mecanico: null,
        id_registro: parseInt(formulario.id_registro),
        fecha_inicio: formulario.fecha,
        hora_inicio: `${formulario.hora_inicio}:00`,
        fecha_fin: formulario.fecha,
        hora_fin: null, // El mecánico establecerá la hora final al concluir el servicio
        estado: 'Pendiente',
        motivo: construirMotivo(),
      };

      const { error } = await supabase.from('cita').insert([nuevaCita]);
      if (error) throw error;

      setToast({
        mostrar: true,
        mensaje: '¡Cita de mantenimiento agendada correctamente!',
        tipo: 'exito',
      });

      setFormulario({
        id_registro: vehiculos.length === 1 ? String(vehiculos[0].id_registro) : '',
        id_servicio: '',
        fecha: '',
        hora_inicio: '',
        observaciones: '',
      });

      setTimeout(() => navegar('/historial-citas'), 2000);
    } catch (err) {
      console.error('Error al agendar cita:', err.message);
      setErrorFormulario(err.message || 'No se pudo registrar la cita. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const fechaMinima = new Date().toISOString().substring(0, 10);
  const vehiculoActivo = obtenerVehiculoSeleccionado();
  const servicioActivo = obtenerServicioSeleccionado();

  if (cargando) {
    return (
      <div className="bg-radial-premium">
        <Container fluid className="text-center py-5">
          <Spinner animation="border" className="text-gold" />
          <p className="text-white-50 mt-3">Cargando formulario de agendamiento...</p>
        </Container>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="bg-radial-premium">
        <Container fluid className="py-5 px-4">
          <Alert variant="danger" className="text-center">
            {errorCarga}
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-radial-premium">
      <Container fluid className="main-page-container py-4 px-4">

        {/* Encabezado */}
        <Row className="mb-4 align-items-end">
          <Col xs={12} lg={8}>
            <h2 className="fw-bold text-gold mb-1">
              <i className="bi bi-calendar-check-fill me-2"></i>
              Agendar Cita de Mantenimiento
            </h2>
            <p className="text-white-50 mb-0">
              Programa el mantenimiento de tu vehículo con nuestro equipo técnico.
            </p>
          </Col>
          <Col xs={12} lg={4} className="text-lg-end mt-3 mt-lg-0">
            <span className="badge rounded-pill badge-custom px-3 py-2 text-uppercase">
              <i className="bi bi-clock me-2"></i>
              Taller: {HORARIO_TALLER.inicio} – {HORARIO_TALLER.fin}
            </span>
          </Col>
        </Row>

        {vehiculos.length === 0 ? (
          <Card className="perfil-card text-white">
            <Card.Body className="p-5 text-center">
              <i className="bi bi-exclamation-triangle text-warning display-4 mb-3 d-block"></i>
              <h5 className="text-gold fw-bold">Sin vehículos asignados</h5>
              <p className="text-white-50 mb-0">
                Contacta al administrador del taller para que registre tu vehículo antes de agendar una cita.
              </p>
            </Card.Body>
          </Card>
        ) : (
          <Form onSubmit={manejarEnvio}>
            {errorFormulario && (
              <Alert variant="danger" dismissible onClose={() => setErrorFormulario('')} className="mb-4">
                {errorFormulario}
              </Alert>
            )}

            <Row className="g-4 align-items-stretch">
              {/* Columna Izquierda: Datos del Cliente y Carro */}
              <Col lg={5}>
                <Card className="perfil-card text-white h-100 shadow border-0">
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="text-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                      <div className="avatar-container d-flex justify-content-center mb-3">
                        {cliente?.foto_cliente ? (
                          <img src={cliente.foto_cliente} alt="Perfil" className="avatar-img" />
                        ) : (
                          <div className="avatar-img d-flex align-items-center justify-content-center bg-dark">
                            <i className="bi bi-person-fill text-white" style={{ fontSize: '60px' }}></i>
                          </div>
                        )}
                      </div>
                      <h5 className="fw-bold text-gold mb-1">{cliente?.nombres} {cliente?.apellidos}</h5>
                      <span className="badge rounded-pill badge-custom px-3 py-1 small">Cliente Ouroboros</span>
                      <div className="mt-2 text-white-50 small">
                        <i className="bi bi-telephone me-2 text-gold"></i>{cliente?.telefono || 'Sin teléfono'}
                      </div>
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-car-front-fill text-gold"></i>
                        <h6 className="fw-bold text-gold mb-0 text-uppercase small">Vehículo Seleccionado</h6>
                      </div>

                      {vehiculoActivo ? (
                        <div className="p-0">
                          <div className="rounded overflow-hidden shadow-sm mb-3">
                            <CarruselVehiculo vehiculo={vehiculoActivo} height="200px" />
                          </div>
                          <div className="px-1">
                            <h5 className="fw-bold text-white mb-0">{vehiculoActivo.marca} {vehiculoActivo.modelo}</h5>
                            <p className="text-white-50 small mb-0">{vehiculoActivo.anio} · {vehiculoActivo.color}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center rounded border border-secondary border-opacity-25 py-5 opacity-50">
                          <i className="bi bi-car-front text-gold display-4 mb-2"></i>
                          <p className="text-white-50 mb-0 small">Selecciona un auto</p>
                        </div>
                      )}
                    </div>

                    {vehiculos.length > 1 && (
                      <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                        <h6 className="fw-bold text-gold mb-3 text-uppercase small">Tus otros vehículos</h6>
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          {vehiculos.map((reg) => {
                            const v = reg.vehiculos;
                            if (!v) return null;
                            const sel = String(reg.id_registro) === String(formulario.id_registro);
                            return (
                              <button key={reg.id_registro} type="button" onClick={() => seleccionarVehiculo(reg.id_registro)}
                                className="d-flex align-items-center gap-3 p-2 rounded border-0 text-start w-100"
                                style={{ background: sel ? 'rgba(164, 132, 28, 0.15)' : 'rgba(255,255,255,0.03)', border: sel ? '1px solid #A4841C' : '1px solid transparent' }}>
                                <div className="flex-shrink-0 rounded overflow-hidden bg-dark" style={{ width: '50px', height: '35px' }}>
                                  {v.url_imagen && <img src={v.url_imagen} alt={v.marca} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div className="flex-grow-1 min-w-0 fw-semibold text-white text-truncate small">{v.marca} {v.modelo}</div>
                                {sel && <i className="bi bi-check-circle-fill text-gold small"></i>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Columna Derecha: Formulario de Cita */}
              <Col lg={7}>
                <Card className="perfil-card text-white h-100 shadow border-0">
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <i className="bi bi-calendar2-plus text-gold" style={{ fontSize: '1.4rem' }}></i>
                      <h5 className="fw-bold text-gold mb-0">Datos de la Cita</h5>
                    </div>

                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-white"><i className="bi bi-wrench me-2 text-gold"></i>Servicio</Form.Label>
                          <Form.Select name="id_servicio" value={formulario.id_servicio} onChange={manejarCambio} className="input-premium">
                            <option value="">Mantenimiento General</option>
                            {servicios.map((s) => (
                              <option key={s.id_servicio} value={s.id_servicio}>{s.tipo_servicio} {s.precio_servicio ? `($${Number(s.precio_servicio).toFixed(0)})` : ''}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-white"><i className="bi bi-calendar-event me-2 text-gold"></i>Fecha *</Form.Label>
                          <Form.Control type="date" name="fecha" value={formulario.fecha} onChange={manejarCambio} min={fechaMinima} className="input-premium" required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-white"><i className="bi bi-clock me-2 text-gold"></i>Hora *</Form.Label>
                          <Form.Control 
                            type="time" 
                            name="hora_inicio" 
                            value={formulario.hora_inicio} 
                            onChange={manejarCambio}
                            min={HORARIO_TALLER.inicio} 
                            max={HORARIO_TALLER.fin} 
                            className="input-premium" 
                            required 
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mt-4 mb-4 flex-grow-1">
                      <Form.Label className="small fw-bold text-white"><i className="bi bi-chat-left-text me-2 text-gold"></i>Observaciones</Form.Label>
                      <Form.Control as="textarea" rows={5} name="observaciones" value={formulario.observaciones} onChange={manejarCambio} placeholder="¿Qué necesita tu vehículo hoy?" className="input-premium h-100" />
                    </Form.Group>

                    <div className="mt-auto pt-4 border-top border-secondary border-opacity-25">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="text-white-50 small">
                          Confirmando para el <span className="text-white fw-bold">{formulario.fecha || '---'}</span>
                          {formulario.hora_inicio && (
                            <> a las <span className="text-white fw-bold">{formatearHoraResumen(formulario.hora_inicio)}</span></>
                          )}
                        </div>
                        {servicioActivo?.precio_servicio && (
                          <div className="text-end">
                            <span className="h4 text-gold fw-bold mb-0">${Number(servicioActivo.precio_servicio).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      <div className="d-grid gap-2">
                        <Button type="submit" className="btn-primary-custom py-3 fw-bold" disabled={enviando}>
                          {enviando ? <><Spinner animation="border" size="sm" className="me-2" />Procesando...</> : <><i className="bi bi-calendar-check me-2"></i>Confirmar Cita</>}
                        </Button>
                        <Button variant="link" className="text-white-50 text-decoration-none small" onClick={() => navegar('/historial-citas')} disabled={enviando}>Ver Historial</Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        )}

        <NotificacionOperacion
          mostrar={toast.mostrar}
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast({ mostrar: false, mensaje: '', tipo: '' })}
        />
      </Container>
    </div>
  );
};

export default AgendarCita;
