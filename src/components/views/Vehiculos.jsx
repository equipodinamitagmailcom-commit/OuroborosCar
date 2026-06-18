import { useEffect, useMemo, useState } from "react";
import {
Container,Row, Col, Button,Spinner,InputGroup, Form} from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import ModalRegistroVehiculos from "../vehiculos/ModalRegistroVehiculos";
import { useNavigate } from "react-router-dom";
import ModalEdicionVehiculos from "../vehiculos/ModalEdicionVehiculos";
import ModalVerCategorias from "../categorias_vehiculo/ModalVerCategorias";
import NotificacionOperacion from "../rutas/NotificacionOperacion";
import Paginacion from "../ordenamiento/Paginacion";
import CarruselVehiculo from "../vehiculos/CarruselVehiculo";

const Vehiculos = () => {
  const navegar = useNavigate();
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
    archivo2: null,
    archivo3: null,
    archivo4: null,
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
    url_imagen2: "",
    url_imagen3: "",
    url_imagen4: "",
    archivo: null,
    archivo2: null,
    archivo3: null,
    archivo4: null,
  });

  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoVehiculo((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioArchivo = (e, campo = "archivo") => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setNuevoVehiculo((prev) => ({ ...prev, [campo]: archivo }));
    } else if (!archivo) {
      setNuevoVehiculo((prev) => ({ ...prev, [campo]: null }));
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

  const manejoCambioArchivoActualizar = (e, campo = "archivo") => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setVehiculoEditar((prev) => ({ ...prev, [campo]: archivo }));
    } else if (!archivo) {
      setVehiculoEditar((prev) => ({ ...prev, [campo]: null }));
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

  const subirImagen = async (archivo) => {
    if (!archivo) return null;
    const nombreArchivo = `${Date.now()}_${archivo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("imagenes_vehiculo")
      .upload(nombreArchivo, archivo);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("imagenes_vehiculo")
      .getPublicUrl(nombreArchivo);
    return { nombreArchivo, urlPublica: urlData.publicUrl };
  };

  const agregarVehiculo = async () => {
    const archivosSubidos = [];
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
            "Completa los campos obligatorios (marca, modelo, año, color, estado, precio, stock e imagen frontal)",
          tipo: "advertencia",
        });
        return;
      }

      // Subir Frente del vehículo
      const res1 = await subirImagen(nuevoVehiculo.archivo);
      if (res1) archivosSubidos.push(res1.nombreArchivo);
      const url1 = res1?.urlPublica;

      // Subir Trasero del vehículo
      const res2 = await subirImagen(nuevoVehiculo.archivo2);
      if (res2) archivosSubidos.push(res2.nombreArchivo);
      const url2 = res2?.urlPublica || null;

      // Subir Costado del vehículo
      const res3 = await subirImagen(nuevoVehiculo.archivo3);
      if (res3) archivosSubidos.push(res3.nombreArchivo);
      const url3 = res3?.urlPublica || null;

      // Subir Interior del vehículo
      const res4 = await subirImagen(nuevoVehiculo.archivo4);
      if (res4) archivosSubidos.push(res4.nombreArchivo);
      const url4 = res4?.urlPublica || null;

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
          url_imagen: url1,
          url_imagen2: url2,
          url_imagen3: url3,
          url_imagen4: url4,
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
        archivo2: null,
        archivo3: null,
        archivo4: null,
      });
      setToast({
        mostrar: true,
        mensaje: "Vehículo registrado correctamente",
        tipo: "exito",
      });
      await cargarVehiculos();
    } catch (err) {
      console.error("Error al agregar vehículo:", err);
      for (const nombre of archivosSubidos) {
        await supabase.storage
          .from("imagenes_vehiculo")
          .remove([nombre])
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
    const archivosSubidos = [];
    const nombresAnterioresBorrar = [];
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
        url_imagen2: vehiculoEditar.url_imagen2,
        url_imagen3: vehiculoEditar.url_imagen3,
        url_imagen4: vehiculoEditar.url_imagen4,
      };

      // 1. Frente del vehículo
      if (vehiculoEditar.archivo) {
        const res = await subirImagen(vehiculoEditar.archivo);
        if (res) {
          archivosSubidos.push(res.nombreArchivo);
          datosActualizados.url_imagen = res.urlPublica;
          if (vehiculoEditar.url_imagen) {
            nombresAnterioresBorrar.push(
              vehiculoEditar.url_imagen.split("/").pop().split("?")[0]
            );
          }
        }
      }

      // 2. Trasero del vehículo
      if (vehiculoEditar.archivo2) {
        const res = await subirImagen(vehiculoEditar.archivo2);
        if (res) {
          archivosSubidos.push(res.nombreArchivo);
          datosActualizados.url_imagen2 = res.urlPublica;
          if (vehiculoEditar.url_imagen2) {
            nombresAnterioresBorrar.push(
              vehiculoEditar.url_imagen2.split("/").pop().split("?")[0]
            );
          }
        }
      }

      // 3. Costado del vehículo
      if (vehiculoEditar.archivo3) {
        const res = await subirImagen(vehiculoEditar.archivo3);
        if (res) {
          archivosSubidos.push(res.nombreArchivo);
          datosActualizados.url_imagen3 = res.urlPublica;
          if (vehiculoEditar.url_imagen3) {
            nombresAnterioresBorrar.push(
              vehiculoEditar.url_imagen3.split("/").pop().split("?")[0]
            );
          }
        }
      }

      // 4. Interior del vehículo
      if (vehiculoEditar.archivo4) {
        const res = await subirImagen(vehiculoEditar.archivo4);
        if (res) {
          archivosSubidos.push(res.nombreArchivo);
          datosActualizados.url_imagen4 = res.urlPublica;
          if (vehiculoEditar.url_imagen4) {
            nombresAnterioresBorrar.push(
              vehiculoEditar.url_imagen4.split("/").pop().split("?")[0]
            );
          }
        }
      }

      const { error } = await supabase
        .from("vehiculos")
        .update(datosActualizados)
        .eq("id_vehiculo", vehiculoEditar.id_vehiculo);

      if (error) {
        throw error;
      }

      // Borrar imágenes viejas si se actualizaron con éxito
      for (const nombre of nombresAnterioresBorrar) {
        await supabase.storage
          .from("imagenes_vehiculo")
          .remove([nombre])
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
        url_imagen2: "",
        url_imagen3: "",
        url_imagen4: "",
        archivo: null,
        archivo2: null,
        archivo3: null,
        archivo4: null,
      });

      setToast({
        mostrar: true,
        mensaje: "Vehículo actualizado correctamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al actualizar:", err);
      for (const nombre of archivosSubidos) {
        await supabase.storage.from("imagenes_vehiculo").remove([nombre]).catch(() => {});
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

      const urls = [
        vehiculoAEliminar.url_imagen,
        vehiculoAEliminar.url_imagen2,
        vehiculoAEliminar.url_imagen3,
        vehiculoAEliminar.url_imagen4
      ];

      for (const url of urls) {
        if (url) {
          const nombreArchivo = url.split("/").pop().split("?")[0];
          await supabase.storage
            .from("imagenes_vehiculo")
            .remove([nombreArchivo])
            .catch(() => {});
        }
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
    <Container fluid className="main-page-container py-4 mt-2">
      <Row className="mb-4 align-items-center">
        <Col xs={12} md={6}>
          <h2 className="fw-bold text-gold">Inventario de Vehículos</h2>
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
            className="btn-primary-custom"
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
              className="border-end-0 input-group-text-custom"
            >
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por marca o modelo..."
              className="border-start-0 ps-0 form-control-custom"
              value={textoBusqueda}
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
            <p className="mt-2 text-white-50">
              Sincronizando con la base de datos...
            </p>
          </div>
        )}

        {/* Tarjetas con vehículos cargados */}
        {!cargando && vehiculosFiltrados.length > 0 && (
          <>
            <Row>
              {vehiculosPaginados.map((vehiculo) => (
                <Col key={vehiculo.id_vehiculo} sm={6} md={4} lg={3} className="mb-4">
                  <div
                    className="card shadow-sm text-white card-custom card-hover-custom"
                  >
                    <div className="card-body d-flex flex-column p-3">
                      <div style={{ overflow: "hidden", borderRadius: "8px" }} className="mb-2">
                        <CarruselVehiculo vehiculo={vehiculo} height="150px" />
                      </div>
                      <h6 className="card-title d-flex justify-content-between align-items-center text-truncate" style={{ fontSize: '1rem' }}>
                        {vehiculo.marca} {vehiculo.modelo}
                        {vehiculo.en_catalogo && (
                          <span className="badge bg-success ms-1" style={{ fontSize: '9px' }}>En Catálogo</span>
                        )}
                      </h6>
                      <p className="card-text mb-2" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        <strong>Año:</strong> {vehiculo.anio}
                        <br />
                        <strong>Color:</strong> {vehiculo.color} | <strong>Stock:</strong> {vehiculo.stock}
                        <br />
                        <strong>Estado:</strong> {vehiculo.estado}
                        <br />
                        <strong style={{ color: "#A4841C" }}>Precio:</strong> $
                        {vehiculo.precio}
                      </p>
                      <div className="d-flex justify-content-center gap-1 mt-auto">
                        <Button
                          variant={vehiculo.en_catalogo ? "success" : "outline-warning"}
                          size="sm"
                          style={{ fontSize: '0.75rem' }}
                          title={vehiculo.en_catalogo ? "Quitar del catálogo" : "Publicar"}
                          onClick={() => toggleEstadoCatalogo(vehiculo)}
                        >
                          {vehiculo.en_catalogo ? 'Publicado' : 'Publicar'}
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
  