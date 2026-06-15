import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner
} from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import NotificacionOperacion from "../rutas/NotificacionOperacion.jsx";

const CAMPOS_EVIDENCIA = ["evidencia1", "evidencia2", "evidencia3", "evidencia4", "evidencia5"];
const BUCKET_EVIDENCIAS = "imagenes_vehiculo";

const normalizarEstado = (estado) => {
  const valor = String(estado || "").toLowerCase().trim();

  if (valor.includes("proceso") || valor.includes("curso") || valor.includes("repar")) {
    return "En Proceso";
  }

  if (valor.includes("complet") || valor.includes("finaliz") || valor.includes("entreg")) {
    return "Completada";
  }

  return "Pendiente";
};

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const texto = String(fecha);
  const fechaLocal = new Date(texto.includes("T") ? texto : `${texto}T00:00:00`);
  if (Number.isNaN(fechaLocal.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(fechaLocal);
};

const formatearHora = (hora) => {
  if (!hora) return "Sin hora";

  const texto = String(hora);
  const match = texto.match(/(\d{1,2}):(\d{2})/);
  if (!match) return texto;

  let horas = Number(match[1]);
  const minutos = match[2];
  const periodo = horas >= 12 ? "PM" : "AM";
  horas = horas % 12 || 12;

  return `${String(horas).padStart(2, "0")}:${minutos} ${periodo}`;
};

const obtenerClaseEstado = (estado) => {
  if (estado === "Completada") return "success";
  if (estado === "En Proceso") return "warning";
  return "secondary";
};

const obtenerFechaPrincipal = (cita) => {
  if (cita?.estado === "Completada" && cita?.fecha_fin) {
    return cita.fecha_fin;
  }

  return cita?.fecha_inicio;
};

const obtenerHoraPrincipal = (cita) => {
  if (cita?.estado === "Completada" && cita?.hora_fin) {
    return cita.hora_fin;
  }

  return cita?.hora_inicio;
};

const sanitizarNombreArchivo = (nombre) =>
  String(nombre || "evidencia.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");

const extraerRutaStorage = (url) => {
  if (!url) return null;

  const marcador = `/${BUCKET_EVIDENCIAS}/`;
  const indice = url.indexOf(marcador);

  if (indice === -1) return null;

  return decodeURIComponent(url.slice(indice + marcador.length));
};

const mapearCita = (fila) => {
  const evidenciasPorCampo = CAMPOS_EVIDENCIA.reduce((acumulado, campo) => {
    acumulado[campo] = fila[campo] || null;
    return acumulado;
  }, {});

  const evidencias = CAMPOS_EVIDENCIA
    .map((campo) => ({
      campo,
      url: fila[campo]
    }))
    .filter((item) => item.url);

  return {
    id_cita: fila.id_cita,
    id_cliente: fila.id_cliente,
    fecha_inicio: fila.fecha_inicio,
    fecha_fin: fila.fecha_fin,
    hora_inicio: fila.hora_inicio,
    hora_fin: fila.hora_fin,
    estado: normalizarEstado(fila.estado),
    motivo: fila.motivo || "Sin motivo registrado",
    detalle: fila.detalle || "Aún no se ha registrado el detalle del trabajo realizado.",
    mecanico: fila.mecanicos
      ? `${fila.mecanicos.nombres || ""} ${fila.mecanicos.apellidos || ""}`.trim()
      : "Sin mecánico asignado",
    vehiculo: {
      marca: fila.vehiculoclientes?.vehiculos?.marca || "Vehículo",
      modelo: fila.vehiculoclientes?.vehiculos?.modelo || "sin modelo",
      anio: fila.vehiculoclientes?.vehiculos?.anio || "—",
      color: fila.vehiculoclientes?.vehiculos?.color || "No registrado",
      placa: fila.vehiculoclientes?.patente || "Sin placa"
    },
    evidencias,
    evidenciasPorCampo
  };
};

const HistorialCitas = () => {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [detalleCita, setDetalleCita] = useState(null);
  const [mensajeVista, setMensajeVista] = useState("");
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "exito" });

  const mostrarNotificacion = useCallback((mensaje, tipo = "exito") => {
    setToast({ mostrar: true, mensaje, tipo });
  }, []);

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCitas([]);
        setMensajeVista("Debes iniciar sesión para revisar tus citas.");
        return;
      }

      const { data: cliente, error: errorCliente } = await supabase
        .from("clientes")
        .select("id_cliente, nombres, apellidos")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (errorCliente) throw errorCliente;

      if (!cliente) {
        setCitas([]);
        setMensajeVista("No se encontró tu perfil de cliente para cargar las citas.");
        return;
      }

      const { data, error } = await supabase
        .from("cita")
        .select(`
          id_cita,
          id_cliente,
          id_mecanico,
          id_registro,
          fecha_inicio,
          fecha_fin,
          hora_inicio,
          hora_fin,
          estado,
          motivo,
          detalle,
          evidencia1,
          evidencia2,
          evidencia3,
          evidencia4,
          evidencia5,
          mecanicos (
            nombres,
            apellidos
          ),
          vehiculoclientes (
            patente,
            vehiculos (
              marca,
              modelo,
              anio,
              color
            )
          )
        `)
        .eq("id_cliente", cliente.id_cliente)
        .order("fecha_inicio", { ascending: false })
        .order("hora_inicio", { ascending: false });

      if (error) throw error;

      setCitas((data || []).map(mapearCita));
      setMensajeVista("");
    } catch (err) {
      console.error("Error al cargar citas del cliente:", err.message || err);
      setCitas([]);
      setMensajeVista("Ocurrió un error al consultar tus citas en la base de datos.");
      mostrarNotificacion("No se pudieron cargar tus citas.", "error");
    } finally {
      setCargando(false);
    }
  }, [mostrarNotificacion]);

  const cargarDetalleCita = async (idCita) => {
    setCargandoDetalle(true);
    try {
      const { data: cita, error: errorCita } = await supabase
        .from("cita")
        .select(`
          id_cita,
          id_cliente,
          id_mecanico,
          id_registro,
          fecha_inicio,
          fecha_fin,
          hora_inicio,
          hora_fin,
          estado,
          motivo,
          detalle,
          evidencia1,
          evidencia2,
          evidencia3,
          evidencia4,
          evidencia5,
          mecanicos (
            nombres,
            apellidos
          ),
          vehiculoclientes (
            patente,
            vehiculos (
              marca,
              modelo,
              anio,
              color
            )
          )
        `)
        .eq("id_cita", idCita)
        .single();

      if (errorCita) throw errorCita;

      const { data: historialPago, error: errorHistorial } = await supabase
        .from("historial_pago")
        .select("id_pago, id_cita, tipo_servicio, monto_total, fecha")
        .eq("id_cita", idCita)
        .order("fecha", { ascending: false });

      if (errorHistorial) throw errorHistorial;

      const citaMapeada = {
        ...mapearCita(cita),
        historialPago: historialPago || []
      };

      setDetalleCita(citaMapeada);
      setCitas((prev) =>
        prev.map((item) => (item.id_cita === citaMapeada.id_cita ? citaMapeada : item))
      );
    } catch (err) {
      console.error("Error al cargar el detalle de la cita:", err.message || err);
      mostrarNotificacion("No se pudo abrir el detalle de la cita.", "error");
    } finally {
      setCargandoDetalle(false);
    }
  };

  useEffect(() => {
    const temporizador = setTimeout(() => {
      void cargarCitas();
    }, 0);

    return () => clearTimeout(temporizador);
  }, [cargarCitas]);

  const abrirDetalle = async (cita) => {
    setMostrarDetalle(true);
    setDetalleCita({
      ...cita,
      historialPago: []
    });
    await cargarDetalleCita(cita.id_cita);
  };

  return (
    <div style={{ backgroundColor: "#111111", minHeight: "100vh" }}>
      <Container className="py-5 mt-4 text-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#A4841C" }}>Mis Citas</h2>
            <p className="mb-0 text-white-50">
              Revisa el detalle de cada cita y adjunta hasta 5 imágenes como evidencia del trabajo realizado.
            </p>
          </div>
          <Badge bg="dark" className="border border-warning-subtle px-3 py-2 fs-6">
            {citas.length} cita(s)
          </Badge>
        </div>

        {cargando ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "#A4841C" }} />
            <p className="mt-3 mb-0 text-white-50">Cargando tus citas...</p>
          </div>
        ) : citas.length === 0 ? (
          <Alert variant="dark" className="border border-secondary text-center text-white">
            <h5 className="mb-2" style={{ color: "#A4841C" }}>No hay citas registradas</h5>
            <p className="mb-0">{mensajeVista || "Todavía no tienes citas asociadas a tu cuenta."}</p>
          </Alert>
        ) : (
          <Row className="g-4">
            {citas.map((cita) => (
              <Col key={cita.id_cita} lg={6}>
                <Card
                  className="h-100 text-white shadow border-0"
                  style={{ backgroundColor: "#1a1a1a", borderLeft: "4px solid #A4841C" }}
                >
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <Card.Title className="fw-bold mb-1">
                          {cita.vehiculo.marca} {cita.vehiculo.modelo}
                        </Card.Title>
                        <div className="text-white-50 small">
                          Placa: {cita.vehiculo.placa} | Año: {cita.vehiculo.anio}
                        </div>
                      </div>
                      <Badge bg={obtenerClaseEstado(cita.estado)}>{cita.estado}</Badge>
                    </div>

                    <div className="mb-3">
                      <p className="mb-2">
                        <strong style={{ color: "#A4841C" }}>
                          {cita.estado === "Completada" ? "Fecha completada:" : "Fecha:"}
                        </strong>{" "}
                        {formatearFecha(obtenerFechaPrincipal(cita))}
                      </p>
                      <p className="mb-2">
                        <strong style={{ color: "#A4841C" }}>
                          {cita.estado === "Completada" ? "Hora completada:" : "Hora:"}
                        </strong>{" "}
                        {formatearHora(obtenerHoraPrincipal(cita))}
                      </p>
                      <p className="mb-2">
                        <strong style={{ color: "#A4841C" }}>Motivo:</strong> {cita.motivo}
                      </p>
                      <p className="mb-0">
                        <strong style={{ color: "#A4841C" }}>Evidencias:</strong> {cita.evidencias.length}/5
                      </p>
                    </div>

                    <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top border-secondary">
                      <small className="text-white-50">Cita #{cita.id_cita}</small>
                      <Button
                        variant="outline-warning"
                        onClick={() => abrirDetalle(cita)}
                      >
                        <i className="bi bi-eye me-2"></i>
                        Detalle
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <Modal
          show={mostrarDetalle}
          onHide={() => {
            setMostrarDetalle(false);
          }}
          size="xl"
          centered
          contentClassName="bg-dark text-white border border-secondary"
        >
          <Modal.Header closeButton className="border-secondary">
            <Modal.Title style={{ color: "#A4841C" }}>
              {detalleCita ? `Detalle de la Cita #${detalleCita.id_cita}` : "Detalle de la Cita"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {!detalleCita || cargandoDetalle ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: "#A4841C" }} />
                <p className="mt-3 mb-0 text-white-50">Cargando detalle de la cita...</p>
              </div>
            ) : (
              <Row className="g-4">
                <Col lg={7}>
                  <Card className="bg-black text-white border border-secondary h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: "#A4841C" }}>Información General</h5>
                      <Row className="g-3">
                        <Col md={6}>
                          <p className="mb-2"><strong>Vehículo:</strong> {detalleCita.vehiculo.marca} {detalleCita.vehiculo.modelo}</p>
                          <p className="mb-2"><strong>Placa:</strong> {detalleCita.vehiculo.placa}</p>
                          <p className="mb-0"><strong>Color:</strong> {detalleCita.vehiculo.color}</p>
                        </Col>
                        <Col md={6}>
                          <p className="mb-2"><strong>Estado:</strong> {detalleCita.estado}</p>
                          <p className="mb-2"><strong>Fecha inicio:</strong> {formatearFecha(detalleCita.fecha_inicio)}</p>
                          <p className="mb-0"><strong>Hora inicio:</strong> {formatearHora(detalleCita.hora_inicio)}</p>
                        </Col>
                        <Col xs={12}>
                          <p className="mb-2">
                            <strong>{detalleCita.estado === "Completada" ? "Fecha completada:" : "Fecha fin:"}</strong>{" "}
                            {formatearFecha(detalleCita.fecha_fin)}
                          </p>
                          <p className="mb-2">
                            <strong>{detalleCita.estado === "Completada" ? "Hora completada:" : "Hora fin:"}</strong>{" "}
                            {formatearHora(detalleCita.hora_fin)}
                          </p>
                          <p className="mb-0"><strong>Mecánico:</strong> {detalleCita.mecanico}</p>
                        </Col>
                      </Row>

                      <hr className="border-secondary my-4" />

                      <h5 className="fw-bold mb-2" style={{ color: "#A4841C" }}>Motivo de la Cita</h5>
                      <p className="mb-4 text-white-50">{detalleCita.motivo}</p>

                      <h5 className="fw-bold mb-2" style={{ color: "#A4841C" }}>Trabajo Realizado</h5>
                      <div
                        className="p-3 rounded border border-secondary"
                        style={{ backgroundColor: "#e9ecef" }}
                      >
                        <p className="mb-0" style={{ whiteSpace: "pre-line", color: "#000" }}>
                          {detalleCita.detalle}
                        </p>
                      </div>

                      <hr className="border-secondary my-4" />

                      <h5 className="fw-bold mb-3" style={{ color: "#A4841C" }}>Registro Relacionado</h5>
                      {detalleCita.historialPago?.length ? (
                        <div className="d-flex flex-column gap-3">
                          {detalleCita.historialPago.map((item) => (
                            <div key={item.id_pago} className="p-3 rounded border border-secondary">
                              <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                                <div>
                                  <strong>{item.tipo_servicio || "Servicio registrado"}</strong>
                                  <div className="text-white-50 small">
                                    Fecha: {item.fecha ? formatearFecha(item.fecha) : "Sin fecha"}
                                  </div>
                                </div>
                                <div className="fw-bold" style={{ color: "#A4841C" }}>
                                  {item.monto_total != null ? `$${item.monto_total}` : "Monto no registrado"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert variant="light" className="mb-0 border border-secondary text-dark">
                          No hay movimientos adicionales registrados para esta cita.
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={5}>
                  <Card className="bg-black text-white border border-secondary mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0" style={{ color: "#A4841C" }}>Evidencias</h5>
                        <Badge bg="secondary">{detalleCita.evidencias.length}/5</Badge>
                      </div>
                      <Alert variant="light" className="border border-secondary text-dark mb-0">
                        Las evidencias son de solo lectura para el cliente.
                      </Alert>
                    </Card.Body>
                  </Card>

                  <Row className="g-3">
                    {detalleCita.evidencias.length ? (
                      detalleCita.evidencias.map((evidencia, index) => (
                        <Col xs={12} key={evidencia.campo}>
                          <Card className="bg-black text-white border border-secondary overflow-hidden">
                            <img
                              src={evidencia.url}
                              alt={`Evidencia ${index + 1}`}
                              style={{ width: "100%", height: "220px", objectFit: "cover" }}
                            />
                            <Card.Body>
                              <p className="mb-3 fw-bold">Evidencia {index + 1}</p>
                              <div className="d-flex">
                                <Button
                                  as="a"
                                  href={evidencia.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  variant="outline-light"
                                  className="w-100"
                                >
                                  Ver imagen
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col xs={12}>
                        <Alert variant="dark" className="border border-secondary text-white-50 mb-0">
                          Esta cita todavía no tiene evidencias fotográficas registradas.
                        </Alert>
                      </Col>
                    )}
                  </Row>
                </Col>
              </Row>
            )}
          </Modal.Body>
        </Modal>

        <NotificacionOperacion
          mostrar={toast.mostrar}
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast({ mostrar: false, mensaje: "", tipo: "exito" })}
        />
      </Container>
    </div>
  );
};

export default HistorialCitas;
