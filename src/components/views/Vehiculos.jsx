import { useEffect, useMemo, useState } from "react";
import {
Container,Row, Col, Button,Spinner,InputGroup, Form,} from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import ModalRegistroVehiculos from "../vehiculos/ModalRegistroVehiculos";
import ModalEdicionVehiculos from "../vehiculos/ModalEdicionVehiculos";
import ModalVerCategorias from "../categorias_vehiculo/ModalVerCategorias";
import NotificacionOperacion from "../rutas/NotificacionOperacion";
import Paginacion from "../ordenamiento/Paginacion";

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
      return marca.includes(textoLower) || modelo.includes(textoLower);
    });
  }, [textoBusqueda, vehiculos]);

  const vehiculosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return vehiculosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [vehiculosFiltrados, paginaActual, registrosPorPagina]);

  useEffect(() => {
    const totalPaginas = Math.max(
      1,
      Math.ceil(vehiculosFiltrados.length / registrosPorPagina),
    );
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
      setToast({
        mostrar: true,
        mensaje: "Error al cargar vehículos",
        tipo: "error",
      });
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
      setToast({
        mostrar: true,
        mensaje: "Error al cargar categorías",
        tipo: "error",
      });
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    cargarVehiculos();
    cargarCategorias();
  }, []);

  const toggleEstadoCatalogo = async (vehiculo) => {
    try {
      const nuevoEstado = !vehiculo.en_catalogo;

      // Actualización optimista del estado local para una respuesta inmediata
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id_vehiculo === vehiculo.id_vehiculo
            ? { ...v, en_catalogo: nuevoEstado }
            : v
        )
      );

      const { error } = await supabase
        .from("vehiculos")
        .update({ en_catalogo: nuevoEstado })
        .eq("id_vehiculo", vehiculo.id_vehiculo);

      if (error) {
        // Si falla la base de datos, revertimos el cambio local
        setVehiculos((prev) =>
          prev.map((v) =>
            v.id_vehiculo === vehiculo.id_vehiculo
              ? { ...v, en_catalogo: !nuevoEstado }
              : v
          )
        );
        throw error;
      }

      setToast({
        mostrar: true,
        mensaje: nuevoEstado ? "Vehículo visible en el catálogo" : "Vehículo oculto del catálogo",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al actualizar catálogo:", err.message || err);
      setToast({
        mostrar: true,
        mensaje: `Error: ${err.message || "No se pudo cambiar el estado del catálogo"}`,
        tipo: "error",
      });
    }
  };

  const agregarVehiculo = async () => {
    let nombreArchivoSubido = null;
    try {
      if (
        !nuevoVehiculo.marca.trim() ||
        !nuevoVehiculo.modelo.trim() ||
        !nuevoVehiculo.anio ||
        !nuevoVehiculo.color.trim() ||
        !nuevoVehiculo.estado.trim() ||
        !nuevoVehiculo.precio ||
        !nuevoVehiculo.stock ||
        !nuevoVehiculo.archivo
      ) {
        setToast({
          mostrar: true,
          mensaje:
            "Completa los campos obligatorios (marca, modelo, año, color, estado, precio, stock e imagen)",
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
          anio: parseInt(nuevoVehiculo.anio),
          color: nuevoVehiculo.color,
          estado: nuevoVehiculo.estado,
          precio: parseFloat(nuevoVehiculo.precio),
          stock: parseInt(nuevoVehiculo.stock),
          url_imagen: urlPublica,
          en_catalogo: false,
        },
      ]);

      if (error) {
        throw error;
      }

      setMostrarModal(false);
      setNuevoVehiculo({
        id_categoria: "",
        marca: "",
        modelo: "",
        anio: "",
        color: "",
        estado: "",
        precio: "",
        stock: "",
        archivo: null,
      });
      setToast({
        mostrar: true,
        mensaje: "Vehículo registrado correctamente",
        tipo: "exito",
      });
      await cargarVehiculos();
      nombreArchivoSubido = null;
    } catch (err) {
      console.error("Error al agregar vehículo:", err);
      if (nombreArchivoSubido) {
        await supabase.storage
          .from("imagenes_vehiculo")
          .remove([nombreArchivoSubido])
          .catch(() => {});
      }
      setToast({
        mostrar: true,
        mensaje: "Error al registrar vehículo",
        tipo: "error",
      });
    }
  };

  const actualizarVehiculo = async () => {
    let nombreNuevoSubido = null;
    let nombreAnteriorBorrado = null;
    try {
      if (
        !vehiculoEditar.marca.trim() ||
        !vehiculoEditar.modelo.trim() ||
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

      let datosActualizados = {
        id_categoria: vehiculoEditar.id_categoria,
        marca: vehiculoEditar.marca,
        modelo: vehiculoEditar.modelo,
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
          nombreAnteriorBorrado = vehiculoEditar.url_imagen
            .split("/")
            .pop()
            .split("?")[0];
        }
      }

      const { error } = await supabase
        .from("vehiculos")
        .update(datosActualizados)
        .eq("id_vehiculo", vehiculoEditar.id_vehiculo);

      if (error) {
        throw error;
      }

      if (nombreAnteriorBorrado && vehiculoEditar.archivo) {
        await supabase.storage
          .from("imagenes_vehiculo")
          .remove([nombreAnteriorBorrado])
          .catch(() => {});
      }

      await cargarVehiculos();

      setMostrarModalEdicion(false);
      setVehiculoEditar({
        id_vehiculo: "",
        id_categoria: "",
        marca: "",
        modelo: "",
        anio: "",
        color: "",
        estado: "",
        precio: "",
        stock: "",
        url_imagen: "",
        archivo: null,
      });

      setToast({
        mostrar: true,
        mensaje: "Vehículo actualizado correctamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al actualizar:", err);
      if (nombreNuevoSubido) {
        await supabase.storage
          .from("imagenes_vehiculo")
          .remove([nombreNuevoSubido])
          .catch(() => {});
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
        const nombreArchivo = vehiculoAEliminar.url_imagen
          .split("/")
          .pop()
          .split("?")[0];
        await supabase.storage
          .from("imagenes_vehiculo")
          .remove([nombreArchivo])
          .catch(() => {});
      }

      await cargarVehiculos();
      setMostrarModalEliminacion(false);
      setVehiculoAEliminar(null);
      setToast({
        mostrar: true,
        mensaje: "Vehículo eliminado correctamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al eliminar:", err);
      setToast({
        mostrar: true,
        mensaje: "Error al eliminar vehículo",
        tipo: "error",
      });
    }
  };

  return (
    <Container
      fluid
      className="py-4 mt-2"
      style={{
        backgroundColor: "#121212",
        minHeight: "100vh",
        color: "#e0e0e0",
      }}
    >
      <style>
        {`
          .card-hover-custom:hover .imagen-zoom {
            transform: scale(1.1);
          }
        `}
      </style>
      <Row className="mb-4 align-items-center">
        <Col xs={12} md={6}>
          <h2 className="fw-bold" style={{ color: "#A4841C" }}>
            Inventario de Vehículos
          </h2>
        </Col>
        <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
          <Button
            variant="outline-warning"
            style={{ borderColor: "#A4841C", color: "#A4841C" }}
            className="me-2 shadow-sm"
            onClick={() => setMostrarModalCategorias(true)}
          >
            <i className="bi bi-tags-fill me-2"></i>
            Ver Categorías
          </Button>
          <Button
            className="border-0 shadow-sm"
            style={{ backgroundColor: "#A4841C" }}
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
            <InputGroup.Text
              className="border-end-0"
              style={{
                backgroundColor: "#2b2b2b",
                color: "#A4841C",
                borderColor: "#A4841C",
              }}
            >
              <i className="bi bi-search text-secondary"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por marca o modelo..."
              className="border-start-0 ps-0 text-white"
              style={{ backgroundColor: "#2b2b2b", borderColor: "#A4841C" }}
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
            <Spinner animation="border" variant="warning" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-2 text-muted">
              Sincronizando con la base de datos...
            </p>
          </div>
        )}

        {/* Tarjetas con vehículos cargados */}
        {!cargando && vehiculosFiltrados.length > 0 && (
          <>
            <Row>
              {vehiculosPaginados.map((vehiculo) => (
                <Col key={vehiculo.id_vehiculo} md={6} lg={4} className="mb-4">
                  <div
                    className="card h-100 shadow-sm text-white card-hover-custom"
                    style={{ backgroundColor: "#1e1e1e" }}
                  >
                    <div className="card-body d-flex flex-column">
                      {vehiculo.url_imagen && (
                        <div style={{ overflow: 'hidden', borderRadius: '4px' }} className="mb-3">
                          <img
                            src={vehiculo.url_imagen}
                            alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                            className="card-img-top imagen-zoom"
                            style={{ height: "200px", objectFit: "cover", transition: 'transform 0.4s ease-in-out' }}
                          />
                        </div>
                      )}
                      <h5 className="card-title d-flex justify-content-between align-items-center">
                        {vehiculo.marca} {vehiculo.modelo}
                        {vehiculo.en_catalogo && (
                          <span className="badge bg-success" style={{ fontSize: '10px' }}>En Catálogo</span>
                        )}
                      </h5>
                      <p className="card-text flex-grow-1">
                        <strong>Año:</strong> {vehiculo.anio}
                        <br />
                        <strong>Color:</strong> {vehiculo.color}
                        <br />
                        <strong>Estado:</strong> {vehiculo.estado}
                        <br />
                        <strong style={{ color: "#A4841C" }}>Precio:</strong> $
                        {vehiculo.precio}
                        <br />
                        <strong>Stock:</strong> {vehiculo.stock}
                      </p>
                      <div className="d-flex justify-content-center gap-2 mt-auto">
                        <Button
                          variant={vehiculo.en_catalogo ? "success" : "outline-warning"}
                          size="sm"
                          title={vehiculo.en_catalogo ? "Quitar del catálogo" : "Publicar auto"}
                          onClick={() => toggleEstadoCatalogo(vehiculo)}
                        >
                          {vehiculo.en_catalogo ? 'Publicado' : 'Publicar auto'}
                        </Button>
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
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Confirmar Eliminación</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setMostrarModalEliminacion(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  ¿Estás seguro de que deseas eliminar el vehículo{" "}
                  <strong>
                    {vehiculoAEliminar.marca} {vehiculoAEliminar.modelo}
                  </strong>
                  ?
                </p>
                <p style={{ color: "#ff6b6b" }}>
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer border-secondary">
                <Button
                  variant="outline-light"
                  onClick={() => setMostrarModalEliminacion(false)}
                >
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
  