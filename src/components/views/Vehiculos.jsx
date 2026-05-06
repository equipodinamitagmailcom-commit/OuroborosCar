import { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Spinner, InputGroup, Form } from "react-bootstrap";
import { supabase } from '../database/supabaseconfig.js';
import ModalRegistroVehiculos from '../vehiculos/ModalRegistroVehiculos';
import ModalEdicionVehiculos from '../vehiculos/ModalEdicionVehiculos';
import ModalVerCategorias from '../categorias_vehiculo/ModalVerCategorias';
import NotificacionOperacion from '../rutas/NotificacionOperacion';
import Paginacion from '../ordenamiento/Paginacion';

const Vehiculos = () => {

  const [vehiculos, setVehiculos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalCategorias, setMostrarModalCategorias] = useState(false);

  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    id_categoria: "",
    marca: "",
    modelo: "",
    patente: "",
    anio: "",
    color: "",
    estado: "",
    precio: "",
    stock: "",
    archivo: null,
  });

  const [registrosPorPagina, setRegistrosPorPagina] = useState(5);
  const [paginaActual, setPaginaActual] = useState(1);

  const [vehiculoEditar, setVehiculoEditar] = useState({
    id_vehiculo: "",
    id_categoria: "",
    marca: "",
    modelo: "",
    patente: "",
    anio: "",
    color: "",
    estado: "",
    precio: "",
    stock: "",
    url_imagen: "",
    archivo: null,
  });

  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoVehiculo((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setNuevoVehiculo((prev) => ({ ...prev, archivo }));
    } else {
      setToast({
        mostrar: true,
        mensaje: "Selecciona una imagen válida (JPG, PNG, etc.)",
        tipo: "advertencia",
      });
    }
  };

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setVehiculoEditar((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioArchivoActualizar = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setVehiculoEditar((prev) => ({ ...prev, archivo }));
    } else {
      setToast({
        mostrar: true,
        mensaje: "Selecciona una imagen válida (JPG, PNG, etc.)",
        tipo: "advertencia",
      });
    }
  };

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

  const vehiculosFiltrados = useMemo(() => {
    if (!textoBusqueda.trim()) return vehiculos;

    const textoLower = textoBusqueda.toLowerCase().trim();
    return vehiculos.filter((veh) => {
      const marca = veh.marca?.toLowerCase() || "";
      const modelo = veh.modelo?.toLowerCase() || "";
      const patente = veh.patente?.toLowerCase() || "";
      return (
        marca.includes(textoLower) ||
        modelo.includes(textoLower) ||
        patente.includes(textoLower)
      );
    });
  }, [textoBusqueda, vehiculos]);

  const vehiculosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return vehiculosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [vehiculosFiltrados, paginaActual, registrosPorPagina]);

  useEffect(() => {
    const totalPaginas = Math.max(1, Math.ceil(vehiculosFiltrados.length / registrosPorPagina));
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [vehiculosFiltrados, registrosPorPagina, paginaActual]);

  const cargarVehiculos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("vehiculos")
        .select("*")
        .order("id_vehiculo", { ascending: false });
      if (error) throw error;
      setVehiculos(data || []);
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
      setToast({ mostrar: true, mensaje: "Error al cargar vehículos", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categoriavehiculos")
        .select("*")
        .order("id_categoria", { ascending: true });
      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setToast({ mostrar: true, mensaje: "Error al cargar categorías", tipo: "error" });
    }
  };

  useEffect(() => {
    cargarVehiculos();
    cargarCategorias();
  }, []);

  const agregarVehiculo = async () => {
    let nombreArchivoSubido = null;
    try {
      if (
        !nuevoVehiculo.marca.trim() ||
        !nuevoVehiculo.modelo.trim() ||
        !nuevoVehiculo.patente.trim() ||
        !nuevoVehiculo.anio ||
        !nuevoVehiculo.color.trim() ||
        !nuevoVehiculo.estado.trim() ||
        !nuevoVehiculo.precio ||
        !nuevoVehiculo.stock ||
        !nuevoVehiculo.archivo
      ) {
        setToast({
          mostrar: true,
          mensaje: "Completa los campos obligatorios (marca, modelo, patente, año, color, estado, precio, stock e imagen)",
          tipo: "advertencia",
        });
        return;
      }

      const patenteTrim = nuevoVehiculo.patente.trim();
      const { data: existentesPatente, error: errConsultaPatente } = await supabase
        .from("vehiculos")
        .select("id_vehiculo")
        .ilike("patente", patenteTrim);

      if (errConsultaPatente) throw errConsultaPatente;
      if (existentesPatente?.length > 0) {
        setToast({
          mostrar: true,
          mensaje: "No puede haber dos vehículos con la misma patente.",
          tipo: "advertencia",
        });
        return;
      }

      const nombreArchivo = `${Date.now()}_${nuevoVehiculo.archivo.name}`;
      nombreArchivoSubido = nombreArchivo;

      const { error: uploadError } = await supabase.storage
        .from("imagenes_vehiculo")
        .upload(nombreArchivo, nuevoVehiculo.archivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("imagenes_vehiculo")
        .getPublicUrl(nombreArchivo);
      const urlPublica = urlData.publicUrl;

      const { error } = await supabase.from("vehiculos").insert([
        {
          id_categoria: nuevoVehiculo.id_categoria,
          marca: nuevoVehiculo.marca,
          modelo: nuevoVehiculo.modelo,
          patente: patenteTrim,
          anio: parseInt(nuevoVehiculo.anio),
          color: nuevoVehiculo.color,
          estado: nuevoVehiculo.estado,
          precio: parseFloat(nuevoVehiculo.precio),
          stock: parseInt(nuevoVehiculo.stock),
          url_imagen: urlPublica,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          await supabase.storage.from("imagenes_vehiculo").remove([nombreArchivo]).catch(() => {});
          nombreArchivoSubido = null;
          setToast({
            mostrar: true,
            mensaje: "No puede haber dos vehículos con la misma patente.",
            tipo: "advertencia",
          });
          return;
        }
        throw error;
      }

      setMostrarModal(false);
      setNuevoVehiculo({
        id_categoria: "",
        marca: "",
        modelo: "",
        patente: "",
        anio: "",
        color: "",
        estado: "",
        precio: "",
        stock: "",
        archivo: null,
      });
      setToast({ mostrar: true, mensaje: "Vehículo registrado correctamente", tipo: "exito" });
      await cargarVehiculos();
      nombreArchivoSubido = null;
    } catch (err) {
      console.error("Error al agregar vehículo:", err);
      if (nombreArchivoSubido) {
        await supabase.storage.from("imagenes_vehiculo").remove([nombreArchivoSubido]).catch(() => {});
      }
      if (err?.code === "23505") {
        setToast({
          mostrar: true,
          mensaje: "No puede haber dos vehículos con la misma patente.",
          tipo: "advertencia",
        });
        return;
      }
      setToast({ mostrar: true, mensaje: "Error al registrar vehículo", tipo: "error" });
    }
  };

  const actualizarVehiculo = async () => {
    let nombreNuevoSubido = null;
    let nombreAnteriorBorrado = null;
    try {
      if (
        !vehiculoEditar.marca.trim() ||
        !vehiculoEditar.modelo.trim() ||
        !vehiculoEditar.patente.trim() ||
        !vehiculoEditar.anio ||
        !vehiculoEditar.color.trim() ||
        !vehiculoEditar.estado.trim() ||
        !vehiculoEditar.precio ||
        !vehiculoEditar.stock
      ) {
        setToast({
          mostrar: true,
          mensaje: "Completa los campos obligatorios",
          tipo: "advertencia",
        });
        return;
      }

      const patenteTrim = vehiculoEditar.patente.trim();
      const { data: otrosConPatente, error: errPatente } = await supabase
        .from("vehiculos")
        .select("id_vehiculo")
        .ilike("patente", patenteTrim)
        .neq("id_vehiculo", vehiculoEditar.id_vehiculo);

      if (errPatente) throw errPatente;
      if (otrosConPatente?.length > 0) {
        setToast({
          mostrar: true,
          mensaje: "No puede haber dos vehículos con la misma patente.",
          tipo: "advertencia",
        });
        return;
      }

      let datosActualizados = {
        id_categoria: vehiculoEditar.id_categoria,
        marca: vehiculoEditar.marca,
        modelo: vehiculoEditar.modelo,
        patente: patenteTrim,
        anio: parseInt(vehiculoEditar.anio),
        color: vehiculoEditar.color,
        estado: vehiculoEditar.estado,
        precio: parseFloat(vehiculoEditar.precio),
        stock: parseInt(vehiculoEditar.stock),
        url_imagen: vehiculoEditar.url_imagen,
      };

      if (vehiculoEditar.archivo) {
        const nombreArchivo = `${Date.now()}_${vehiculoEditar.archivo.name}`;
        nombreNuevoSubido = nombreArchivo;

        const { error: uploadError } = await supabase.storage
          .from("imagenes_vehiculo")
          .upload(nombreArchivo, vehiculoEditar.archivo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("imagenes_vehiculo")
          .getPublicUrl(nombreArchivo);
        datosActualizados.url_imagen = urlData.publicUrl;

        if (vehiculoEditar.url_imagen) {
          nombreAnteriorBorrado = vehiculoEditar.url_imagen.split("/").pop().split("?")[0];
        }
      }

      const { error } = await supabase
        .from("vehiculos")
        .update(datosActualizados)
        .eq("id_vehiculo", vehiculoEditar.id_vehiculo);

      if (error) {
        if (error.code === "23505") {
          if (nombreNuevoSubido) {
            await supabase.storage.from("imagenes_vehiculo").remove([nombreNuevoSubido]).catch(() => {});
          }
          setToast({
            mostrar: true,
            mensaje: "No puede haber dos vehículos con la misma patente.",
            tipo: "advertencia",
          });
          return;
        }
        throw error;
      }

      if (nombreAnteriorBorrado && vehiculoEditar.archivo) {
        await supabase.storage.from("imagenes_vehiculo").remove([nombreAnteriorBorrado]).catch(() => {});
      }

      await cargarVehiculos();

      setMostrarModalEdicion(false);
      setVehiculoEditar({
        id_vehiculo: "",
        id_categoria: "",
        marca: "",
        modelo: "",
        patente: "",
        anio: "",
        color: "",
        estado: "",
        precio: "",
        stock: "",
        url_imagen: "",
        archivo: null,
      });

      setToast({ mostrar: true, mensaje: "Vehículo actualizado correctamente", tipo: "exito" });
    } catch (err) {
      console.error("Error al actualizar:", err);
      if (nombreNuevoSubido && err?.code !== "23505") {
        await supabase.storage.from("imagenes_vehiculo").remove([nombreNuevoSubido]).catch(() => {});
      }
      if (err?.code === "23505") {
        setToast({
          mostrar: true,
          mensaje: "No puede haber dos vehículos con la misma patente.",
          tipo: "advertencia",
        });
        return;
      }
      setToast({
        mostrar: true,
        mensaje: "Error al actualizar vehículo",
        tipo: "error",
      });
    }
  };

  const eliminarVehiculo = async () => {
    try {
      if (!vehiculoAEliminar) return;

      const { error } = await supabase
        .from("vehiculos")
        .delete()
        .eq("id_vehiculo", vehiculoAEliminar.id_vehiculo);

      if (error) throw error;

      if (vehiculoAEliminar.url_imagen) {
        const nombreArchivo = vehiculoAEliminar.url_imagen.split("/").pop().split("?")[0];
        await supabase.storage.from("imagenes_vehiculo").remove([nombreArchivo]).catch(() => {});
      }

      await cargarVehiculos();
      setMostrarModalEliminacion(false);
      setVehiculoAEliminar(null);
      setToast({ mostrar: true, mensaje: "Vehículo eliminado correctamente", tipo: "exito" });
    } catch (err) {
      console.error("Error al eliminar:", err);
      setToast({ mostrar: true, mensaje: "Error al eliminar vehículo", tipo: "error" });
    }
  };

  return (
    <Container className="py-4 mt-2">
      <Row className="mb-4 align-items-center">
        <Col xs={12} md={6}>
          <h2 className="color-texto-marca fw-bold">Gestión de Vehículos</h2>
          <p className="text-muted small">Inventario de unidades Ouroboros Car</p>
        </Col>
        <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
          <Button
            variant="outline-primary"
            className="me-2 shadow-sm"
            onClick={() => setMostrarModalCategorias(true)}
          >
            <i className="bi bi-tags-fill me-2"></i>
            Ver Categorías
          </Button>
          <Button
            className="color-navbar border-0 shadow-sm"
            onClick={() => setMostrarModal(true)}
          >
            <i className="bi bi-plus-circle-fill me-2"></i>
            Nuevo Vehículo
          </Button>
        </Col>
      </Row>

      <Row className="mb-4 align-items-center">
        <Col md={8}>
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="bg-white border-end-0">
              <i className="bi bi-search text-secondary"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por marca, modelo o patente..."
              className="border-start-0 ps-0"
              value={textoBusqueda}
              onChange={manejarBusqueda}
            />
          </InputGroup>
        </Col>
      </Row>

      <Col xs={12} md={12} lg={12}>
        {/* Spinner de carga de vehículos */}
        {cargando && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Cargando vehículos...</span>
            </Spinner>
            <p className="mt-2 text-muted">Sincronizando con la base de datos...</p>
          </div>
        )}

        {/* Tarjetas con vehículos cargados */}
        {!cargando && vehiculosFiltrados.length > 0 && (
          <>
            <Row>
              {vehiculosPaginados.map((vehiculo) => (
              <Col key={vehiculo.id_vehiculo} md={6} lg={4} className="mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    {vehiculo.url_imagen && (
                      <img
                        src={vehiculo.url_imagen}
                        alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                        className="card-img-top mb-3"
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                    )}
                    <h5 className="card-title">{vehiculo.marca} {vehiculo.modelo}</h5>
                    <p className="card-text">
                      <strong>Patente:</strong> {vehiculo.patente}<br />
                      <strong>Año:</strong> {vehiculo.anio}<br />
                      <strong>Color:</strong> {vehiculo.color}<br />
                      <strong>Estado:</strong> {vehiculo.estado}<br />
                      <strong>Precio:</strong> ${vehiculo.precio}<br />
                      <strong>Stock:</strong> {vehiculo.stock}
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        title="Editar"
                        onClick={() => {
                          setVehiculoEditar(vehiculo);
                          setMostrarModalEdicion(true);
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        title="Eliminar"
                        onClick={() => {
                          setVehiculoAEliminar(vehiculo);
                          setMostrarModalEliminacion(true);
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
            <div className="mt-3">
              <Paginacion
                registrosPorPagina={registrosPorPagina}
                totalRegistros={vehiculosFiltrados.length}
                paginaActual={paginaActual}
                establecerPaginaActual={setPaginaActual}
                establecerRegistrosPorPagina={setRegistrosPorPagina}
              />
            </div>
          </>
        )}
      </Col>

      <ModalRegistroVehiculos
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoVehiculo={nuevoVehiculo}
        manejoCambioInput={manejoCambioInput}
        manejoCambioArchivo={manejoCambioArchivo}
        agregarVehiculo={agregarVehiculo}
        categorias={categorias}
      />

      <ModalEdicionVehiculos
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        vehiculoEditar={vehiculoEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        manejoCambioArchivoActualizar={manejoCambioArchivoActualizar}
        actualizarVehiculo={actualizarVehiculo}
        categorias={categorias}
      />

      {mostrarModalEliminacion && vehiculoAEliminar && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar Eliminación</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarModalEliminacion(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar el vehículo <strong>{vehiculoAEliminar.marca} {vehiculoAEliminar.modelo}</strong>?</p>
                <p className="text-danger">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setMostrarModalEliminacion(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={eliminarVehiculo}>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ mostrar: false, mensaje: "", tipo: "" })}
      />

      <ModalVerCategorias
        mostrar={mostrarModalCategorias}
        manejarCierre={() => setMostrarModalCategorias(false)}
        onCategoriasActualizadas={cargarCategorias}
      />
    </Container>
  );
};

export default Vehiculos;