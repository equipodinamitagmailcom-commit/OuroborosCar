import { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroVehiculos from "../components/vehiculos/ModalRegistroVehiculos";
import ModalEdicionVehiculos from "../components/vehiculos/ModalEdicionVehiculos";
import NotificacionOperacion from "../components/rutas/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusqueda";

const Vehiculos = () => {

  const [vehiculos, setVehiculos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

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
      alert("Selecciona una imagen válida (JPG, PNG, etc.)");
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
      alert("Selecciona una imagen válida (JPG, PNG, etc.)");
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

      setMostrarModal(false);

      const nombreArchivo = `${Date.now()}_${nuevoVehiculo.archivo.name}`;

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
          patente: nuevoVehiculo.patente,
          anio: parseInt(nuevoVehiculo.anio),
          color: nuevoVehiculo.color,
          estado: nuevoVehiculo.estado,
          precio: parseFloat(nuevoVehiculo.precio),
          stock: parseInt(nuevoVehiculo.stock),
          url_imagen: urlPublica,
        },
      ]);

      if (error) throw error;

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

    } catch (err) {
      console.error("Error al agregar vehículo:", err);
      setToast({ mostrar: true, mensaje: "Error al registrar vehículo", tipo: "error" });
    }
  };

 const actualizarVehiculo = async () => {
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

    setMostrarModalEdicion(false);

    let datosActualizados = {
      id_categoria: vehiculoEditar.id_categoria,
      marca: vehiculoEditar.marca,
      modelo: vehiculoEditar.modelo,
      patente: vehiculoEditar.patente,
      anio: parseInt(vehiculoEditar.anio),
      color: vehiculoEditar.color,
      estado: vehiculoEditar.estado,
      precio: parseFloat(vehiculoEditar.precio),
      stock: parseInt(vehiculoEditar.stock),
      url_imagen: vehiculoEditar.url_imagen,
    };

    if (vehiculoEditar.archivo) {
      const nombreArchivo = `${Date.now()}_${vehiculoEditar.archivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenes_vehiculo")
        .upload(nombreArchivo, vehiculoEditar.archivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("imagenes_vehiculo")
        .getPublicUrl(nombreArchivo);
      datosActualizados.url_imagen = urlData.publicUrl;

      if (vehiculoEditar.url_imagen) {
        const nombreAnterior = vehiculoEditar.url_imagen.split("/").pop().split("?")[0];
        await supabase.storage.from("imagenes_vehiculo").remove([nombreAnterior]).catch(() => {});
      }
    }

    const { error } = await supabase
      .from("vehiculos")
      .update(datosActualizados)
      .eq("id_vehiculo", vehiculoEditar.id_vehiculo);

    if (error) throw error;

    await cargarVehiculos();

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

    setToast({ mostrar: true, mensaje: "Vehículo actualizado correctamente", tipo: "exito" });    await cargarVehiculos();  } catch (err) {
    console.error("Error al actualizar:", err);
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
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-center">Gestión de Vehículos</h2>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarBusqueda}
            placeholder="Buscar por marca, modelo o patente..."
          />
        </Col>
        <Col md={6} className="text-end">
          <Button
            variant="success"
            onClick={() => setMostrarModal(true)}
            size="lg"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Vehículo
          </Button>
        </Col>
      </Row>

      <Col xs={12} md={12} lg={12}>
        {/* Spinner de carga de vehículos */}
        {cargando && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="success" size="lg" />
            <p className="mt-3 text-muted">Cargando vehículos...</p>
          </div>
        )}

        {/* Tarjetas con vehículos cargados */}
        {!cargando && vehiculosFiltrados.length > 0 && (
          <Row>
            {vehiculosFiltrados.map((vehiculo) => (
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
                    <div className="d-flex justify-content-between">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setVehiculoEditar(vehiculo);
                          setMostrarModalEdicion(true);
                        }}
                      >
                        <i className="bi bi-pencil"></i> Editar
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setVehiculoAEliminar(vehiculo);
                          setMostrarModalEliminacion(true);
                        }}
                      >
                        <i className="bi bi-trash"></i> Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
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
    </Container>
  );
};

export default Vehiculos;