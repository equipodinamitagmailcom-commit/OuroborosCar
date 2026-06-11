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
  const [mecanicos, setMecanicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

  const [formulario, setFormulario] = useState({
    id_vehiculo: '',
    id_servicio: '',
    id_mecanico: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
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

      const [resVehiculos, resMecanicos, resServicios] = await Promise.all([
        supabase
          .from('vehiculoclientes')
          .select(`
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
          .from('mecanicos')
          .select('id_mecanico, nombres, apellidos')
          .order('nombres', { ascending: true }),
        supabase
          .from('mantenimientoservicio')
          .select('id_servicio, tipo_servicio, precio_servicio')
          .order('tipo_servicio', { ascending: true }),
      ]);

      if (resVehiculos.error) throw resVehiculos.error;
      if (resMecanicos.error) throw resMecanicos.error;

      const listaVehiculos = resVehiculos.data || [];
      setVehiculos(listaVehiculos);
      setMecanicos(resMecanicos.data || []);

      if (listaVehiculos.length === 1 && listaVehiculos[0]?.id_vehiculo) {
        setFormulario((prev) => ({
          ...prev,
          id_vehiculo: String(listaVehiculos[0].id_vehiculo),
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

      if (name === 'hora_inicio' && value) {
        actualizado.hora_fin = calcularHoraFin(value);
      }

      return actualizado;
    });
    setErrorFormulario('');
  };

  const seleccionarVehiculo = (idVehiculo) => {
    setFormulario((prev) => ({ ...prev, id_vehiculo: String(idVehiculo) }));
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
      (v) => String(v.id_vehiculo) === String(formulario.id_vehiculo)
    );
    return registro?.vehiculos ?? null;
  };

  const obtenerServicioSeleccionado = () => {
    return servicios.find(
      (s) => String(s.id_servicio) === String(formulario.id_servicio)
    );
  };

  const obtenerMecanicoSeleccionado = () => {
    return mecanicos.find(
      (m) => String(m.id_mecanico) === String(formulario.id_mecanico)
    );
  };

  const aMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const validarFormulario = () => {
    const { id_vehiculo, id_mecanico, fecha, hora_inicio, hora_fin } = formulario;

    if (!id_vehiculo) {
      setErrorFormulario('Selecciona el vehículo que deseas llevar a mantenimiento.');
      return false;
    }

    if (!id_mecanico) {
      setErrorFormulario('Selecciona un mecánico para tu cita.');
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

    if (!hora_inicio || !hora_fin) {
      setErrorFormulario('Indica el horario de inicio y fin de la cita.');
      return false;
    }

    if (aMinutos(hora_inicio) < aMinutos(HORARIO_TALLER.inicio)) {
      setErrorFormulario(`El horario de inicio debe ser a partir de las ${HORARIO_TALLER.inicio}.`);
      return false;
    }

    if (aMinutos(hora_fin) > aMinutos(HORARIO_TALLER.fin)) {
      setErrorFormulario(`El horario de fin no puede superar las ${HORARIO_TALLER.fin}.`);
      return false;
    }

    if (aMinutos(hora_fin) <= aMinutos(hora_inicio)) {
      setErrorFormulario('La hora de fin debe ser posterior a la hora de inicio.');
      return false;
    }

    return true;
  };

  const verificarDisponibilidadMecanico = async () => {
    const { data: citasExistentes, error } = await supabase
      .from('cita')
      .select('hora_inicio, hora_fin, estado')
      .eq('id_mecanico', parseInt(formulario.id_mecanico))
      .eq('fecha_inicio', formulario.fecha)
      .neq('estado', 'Cancelada');

    if (error) throw error;

    const inicioNuevo = aMinutos(formulario.hora_inicio);
    const finNuevo = aMinutos(formulario.hora_fin);

    const hayConflicto = (citasExistentes || []).some((cita) => {
      const inicioExistente = aMinutos(cita.hora_inicio?.substring(0, 5) || '00:00');
      const finExistente = aMinutos(cita.hora_fin?.substring(0, 5) || '00:00');
      return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });

    if (hayConflicto) {
      throw new Error('El mecánico seleccionado ya tiene una cita en ese horario. Elige otra hora o mecánico.');
    }
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
      await verificarDisponibilidadMecanico();

      const nuevaCita = {
        id_cliente: cliente.id_cliente,
        id_mecanico: parseInt(formulario.id_mecanico),
        fecha_inicio: formulario.fecha,
        hora_inicio: `${formulario.hora_inicio}:00`,
        fecha_fin: formulario.fecha,
        hora_fin: `${formulario.hora_fin}:00`,
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
        id_vehiculo: vehiculos.length === 1 ? String(vehiculos[0].id_vehiculo) : '',
        id_servicio: '',
        id_mecanico: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
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
  const mecanicoActivo = obtenerMecanicoSeleccionado();

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
            <span className="badge rounded-pill badge-custom px-3 py-2 fw-bold text-uppercase">
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

            {/* Franja superior: cliente + vehículo a lo largo */}
            <Card className="perfil-card text-white mb-4 overflow-hidden">
              <Card.Body className="p-0">
                <Row className="g-0 align-items-stretch">

                  {/* Cliente con foto */}
                  <Col xs={12} lg={3} className="border-end border-secondary border-opacity-25">
                    <div className="p-4 h-100 d-flex flex-column justify-content-center align-items-center text-center">
                      <div className="avatar-container mb-3">
                        {cliente?.foto_cliente ? (
                          <img
                            src={cliente.foto_cliente}
                            alt="Foto de perfil"
                            className="avatar-img"
                          />
                        ) : (
                          <div
                            className="avatar-img d-flex align-items-center justify-content-center"
                            style={{ backgroundColor: '#1a1a1a' }}
                          >
                            <i className="bi bi-person-fill text-white" style={{ fontSize: '70px' }}></i>
                          </div>
                        )}
                      </div>
                      <h5 className="fw-bold text-gold mb-1">
                        {cliente?.nombres} {cliente?.apellidos}
                      </h5>
                      <span className="badge rounded-pill badge-custom px-3 py-1 small mb-3">
                        Cliente Ouroboros
                      </span>
                      <div className="w-100">
                        <div className="perfil-info-block d-flex align-items-center gap-3 mb-2">
                          <div className="perfil-icon-wrapper">
                            <i className="bi bi-telephone"></i>
                          </div>
                          <div className="text-start">
                            <span className="text-white-50 small text-uppercase d-block fw-bold">Teléfono</span>
                            <span className="text-white small">{cliente?.telefono || 'No registrado'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Imagen del vehículo seleccionado */}
                  <Col xs={12} lg={5} className="border-end border-secondary border-opacity-25">
                    <div className="p-4 h-100 d-flex flex-column">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-car-front-fill text-gold"></i>
                        <h6 className="fw-bold text-gold mb-0 text-uppercase small">Vehículo seleccionado</h6>
                      </div>

                      {vehiculoActivo ? (
                        <>
                          <div className="rounded overflow-hidden flex-grow-1" style={{ minHeight: '220px' }}>
                            <CarruselVehiculo vehiculo={vehiculoActivo} height="220px" />
                          </div>
                          <div className="mt-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                              <h5 className="fw-bold text-white mb-0">
                                {vehiculoActivo.marca} {vehiculoActivo.modelo}
                              </h5>
                              <span className="text-white-50 small">
                                {vehiculoActivo.anio}
                                {vehiculoActivo.color ? ` · ${vehiculoActivo.color}` : ''}
                              </span>
                            </div>
                            <span className="badge rounded-pill badge-custom px-3 py-2">
                              <i className="bi bi-check-circle me-1"></i>
                              Listo para cita
                            </span>
                          </div>
                        </>
                      ) : (
                        <div
                          className="flex-grow-1 d-flex flex-column align-items-center justify-content-center rounded border border-secondary border-opacity-50"
                          style={{ minHeight: '220px', background: 'rgba(0,0,0,0.3)' }}
                        >
                          <i className="bi bi-car-front text-gold display-4 mb-2 opacity-50"></i>
                          <p className="text-white-50 mb-0 small">Selecciona un vehículo de la lista</p>
                        </div>
                      )}
                    </div>
                  </Col>

                  {/* Selector de vehículos */}
                  <Col xs={12} lg={4}>
                    <div className="p-4 h-100">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-list-ul text-gold"></i>
                        <h6 className="fw-bold text-gold mb-0 text-uppercase small">Tus vehículos</h6>
                      </div>

                      <div className="d-flex flex-column gap-2" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {vehiculos.map((registro) => {
                          const v = registro.vehiculos;
                          if (!v) return null;
                          const seleccionado = String(registro.id_vehiculo) === String(formulario.id_vehiculo);

                          return (
                            <button
                              key={registro.id_vehiculo}
                              type="button"
                              onClick={() => seleccionarVehiculo(registro.id_vehiculo)}
                              className="d-flex align-items-center gap-3 p-2 rounded border-0 text-start w-100"
                              style={{
                                background: seleccionado ? 'rgba(164, 132, 28, 0.18)' : 'rgba(255,255,255,0.04)',
                                border: seleccionado ? '2px solid #A4841C' : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                              }}
                            >
                              <div
                                className="flex-shrink-0 rounded overflow-hidden"
                                style={{ width: '72px', height: '52px', background: '#1a1a1a' }}
                              >
                                {v.url_imagen ? (
                                  <img
                                    src={v.url_imagen}
                                    alt={`${v.marca} ${v.modelo}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                    <i className="bi bi-car-front text-white-50"></i>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow-1 min-w-0">
                                <div className="fw-semibold text-white text-truncate">
                                  {v.marca} {v.modelo}
                                </div>
                                <div className="text-white-50 small">
                                  {v.anio}{v.color ? ` · ${v.color}` : ''}
                                </div>
                              </div>
                              {seleccionado && (
                                <i className="bi bi-check-circle-fill text-gold flex-shrink-0"></i>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="perfil-welcome-banner mt-3">
                        <p className="mb-0 small text-white-50">
                          Las citas quedan en estado <strong className="text-gold">Pendiente</strong> hasta confirmación del taller.
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Formulario a lo largo de la página */}
            <Card className="perfil-card text-white mb-4">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <i className="bi bi-clipboard2-check text-gold" style={{ fontSize: '1.4rem' }}></i>
                  <h5 className="fw-bold text-gold mb-0">Detalles de la cita</h5>
                </div>

                <Row className="g-3">
                  <Col xs={12} md={6} xl={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-white">
                        <i className="bi bi-wrench me-2 text-gold"></i>
                        Tipo de mantenimiento
                      </Form.Label>
                      <Form.Select
                        name="id_servicio"
                        value={formulario.id_servicio}
                        onChange={manejarCambio}
                        className="input-premium"
                      >
                        <option value="">Mantenimiento general</option>
                        {servicios.map((servicio) => (
                          <option key={servicio.id_servicio} value={servicio.id_servicio}>
                            {servicio.tipo_servicio}
                            {servicio.precio_servicio != null
                              ? ` — $${Number(servicio.precio_servicio).toFixed(2)}`
                              : ''}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6} xl={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-white">
                        <i className="bi bi-person-gear me-2 text-gold"></i>
                        Mecánico *
                      </Form.Label>
                      <Form.Select
                        name="id_mecanico"
                        value={formulario.id_mecanico}
                        onChange={manejarCambio}
                        className="input-premium"
                        required
                      >
                        <option value="">Selecciona un mecánico...</option>
                        {mecanicos.map((mecanico) => (
                          <option key={mecanico.id_mecanico} value={mecanico.id_mecanico}>
                            {mecanico.nombres} {mecanico.apellidos}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={4} xl={2}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-white">
                        <i className="bi bi-calendar-event me-2 text-gold"></i>
                        Fecha *
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="fecha"
                        value={formulario.fecha}
                        onChange={manejarCambio}
                        min={fechaMinima}
                        className="input-premium"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={6} md={4} xl={2}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-white">
                        <i className="bi bi-clock me-2 text-gold"></i>
                        Inicio *
                      </Form.Label>
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

                  <Col xs={6} md={4} xl={2}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-white">
                        <i className="bi bi-clock-history me-2 text-gold"></i>
                        Fin *
                      </Form.Label>
                      <Form.Control
                        type="time"
                        name="hora_fin"
                        value={formulario.hora_fin}
                        onChange={manejarCambio}
                        min={HORARIO_TALLER.inicio}
                        max={HORARIO_TALLER.fin}
                        className="input-premium"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-white">
                        <i className="bi bi-chat-left-text me-2 text-gold"></i>
                        Observaciones adicionales
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="observaciones"
                        value={formulario.observaciones}
                        onChange={manejarCambio}
                        placeholder="Ej: Cambio de aceite, revisión de frenos, ruido en el motor..."
                        className="input-premium"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Resumen + acciones a lo largo */}
            <Card className="perfil-card text-white">
              <Card.Body className="p-4">
                <Row className="align-items-center g-4">
                  <Col xs={12} xl={8}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-card-checklist text-gold"></i>
                      <h6 className="fw-bold text-gold mb-0 text-uppercase small">Resumen de la cita</h6>
                    </div>
                    <Row className="g-3">
                      <Col sm={6} md={3}>
                        <div className="perfil-info-block p-3 h-100">
                          <span className="text-white-50 small text-uppercase d-block fw-bold mb-1">Cliente</span>
                          <span className="text-white small fw-semibold">
                            {cliente?.nombres} {cliente?.apellidos}
                          </span>
                        </div>
                      </Col>
                      <Col sm={6} md={3}>
                        <div className="perfil-info-block p-3 h-100">
                          <span className="text-white-50 small text-uppercase d-block fw-bold mb-1">Vehículo</span>
                          <span className="text-white small fw-semibold">
                            {vehiculoActivo
                              ? `${vehiculoActivo.marca} ${vehiculoActivo.modelo} ${vehiculoActivo.anio}`
                              : '—'}
                          </span>
                        </div>
                      </Col>
                      <Col sm={6} md={3}>
                        <div className="perfil-info-block p-3 h-100">
                          <span className="text-white-50 small text-uppercase d-block fw-bold mb-1">Servicio</span>
                          <span className="text-white small fw-semibold">
                            {servicioActivo?.tipo_servicio || 'Mantenimiento general'}
                            {servicioActivo?.precio_servicio != null && (
                              <span className="text-gold"> · ${Number(servicioActivo.precio_servicio).toFixed(2)}</span>
                            )}
                          </span>
                        </div>
                      </Col>
                      <Col sm={6} md={3}>
                        <div className="perfil-info-block p-3 h-100">
                          <span className="text-white-50 small text-uppercase d-block fw-bold mb-1">Fecha y hora</span>
                          <span className="text-white small fw-semibold">
                            {formulario.fecha && formulario.hora_inicio
                              ? `${formulario.fecha} · ${formulario.hora_inicio} – ${formulario.hora_fin || '—'}`
                              : '—'}
                          </span>
                          {mecanicoActivo && (
                            <span className="text-white-50 d-block mt-1" style={{ fontSize: '0.75rem' }}>
                              {mecanicoActivo.nombres} {mecanicoActivo.apellidos}
                            </span>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Col>

                  <Col xs={12} xl={4}>
                    <div className="d-flex flex-column gap-2">
                      <Button
                        type="submit"
                        className="btn-primary-custom py-3 fw-bold"
                        disabled={enviando || mecanicos.length === 0}
                      >
                        {enviando ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Agendando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-calendar-plus me-2"></i>
                            Confirmar cita
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        className="btn-outline-gold py-2"
                        onClick={() => navegar('/historial-citas')}
                        disabled={enviando}
                      >
                        <i className="bi bi-clock-history me-2"></i>
                        Ver historial
                      </Button>
                      {mecanicos.length === 0 && (
                        <p className="text-warning small mb-0 text-center">
                          No hay mecánicos disponibles. Contacta al administrador.
                        </p>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
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
