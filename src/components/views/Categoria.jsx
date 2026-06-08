import { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig.js";
import ModalRegistroCategoria from "../categorias_vehiculo/ModalRegistroCategoria";
import NotificacionOperacion from "../rutas/NotificacionOperacion";
import TablaCategorias from "../categorias_vehiculo/TablaCategorias";
import TarjetaCategoria from "../categorias_vehiculo/TarjetaCategoria";
import ModalEdicionCategoria from "../categorias_vehiculo/ModalEdicionCategorias";
import ModalEliminacionCategoria from "../categorias_vehiculo/ModalEliminacionCategoria";
import CuadroBusquedas from "../busquedas/CuadroBusqueda";
import Paginacion from "../ordenamiento/Paginacion";

const Categorias = () => {
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [mostrarModal, setMostrarModal] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombrecat: "",
  });

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

  const [categoriaEditar, setCategoriaEditar] = useState({
    id_categoria: "",
    nombrecat: "",
  });

  const [textoBusqueda, setTextoBusqueda] = useState("");
const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);

// 👉 Variables de estado para la paginación
const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
const [paginaActual, establecerPaginaActual] = useState(1);

// 👉 Calcular las categorías que se mostrarán en la página actual
const categoriasPaginadas = categoriasFiltradas.slice(
  (paginaActual - 1) * registrosPorPagina,
  paginaActual * registrosPorPagina
);

  // 👉 Funciones para abrir modales
  const abrirModalEdicion = (categoria) => {
    setCategoriaEditar({
      id_categoria: categoria.id_categoria,
      nombrecat: categoria.nombrecat,
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (categoria) => {
    setCategoriaAEliminar(categoria);
    setMostrarModalEliminacion(true);
  };

  // 👉 Función para cargar categorías desde Supabase
  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("categoriavehiculos")
        .select("*")
        .order("id_categoria", { ascending: true });

      if (error) {
        console.error("Error al cargar categorías:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al cargar categorías.",
          tipo: "error",
        });
        return;
      }

      setCategorias(data || []);
    } catch (err) {
      console.error("Excepción al cargar categorías:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al cargar categorías.",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  // 👉 Ejecutar la carga al montar el componente
  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    cargarCategorias();
  }, []);

  // 👉 Filtrar categorías según búsqueda por nombre
useEffect(() => {
  if (!textoBusqueda.trim()) {
    setCategoriasFiltradas(categorias);
  } else {
    const textoLower = textoBusqueda.toLowerCase().trim();
    const filtradas = categorias.filter(
      (cat) =>
        cat.nombrecat.toLowerCase().includes(textoLower)
    );
    setCategoriasFiltradas(filtradas);
  }
}, [textoBusqueda, categorias]);

  // 👉 Manejo de inputs para registro
  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 👉 Manejo de inputs para edición
  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setCategoriaEditar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

  // 👉 Método para agregar categoría
  const agregarCategoria = async () => {
    try {
      if (
        !nuevaCategoria.nombrecat.trim()
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });
        return;
      }

      const { error } = await supabase.from("categoriavehiculos").insert([
        {
          nombrecat: nuevaCategoria.nombrecat,
        },
      ]);

      if (error) {
        console.error("Error al agregar categoria:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al registrar categoria.",
          tipo: "error",
        });
        return;
      }

      setToast({
        mostrar: true,
        mensaje: `Categoria '${nuevaCategoria.nombrecat}' registrada exitosamente.`,
        tipo: "exito",
      });

      setNuevaCategoria({ nombrecat: "" });
      setMostrarModal(false);

      // 👉 Recargar categorías después de insertar
      await cargarCategorias();
    } catch (err) {
      console.error("Excepcion al agregar categoria:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al registrar categoria.",
        tipo: "error",
      });
    }
  };

  // 👉 Método para actualizar categoría
  const actualizarCategoria = async () => {
    try {
      if (
        !categoriaEditar.nombrecat.trim()
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });
        return;
      }

      setMostrarModalEdicion(false);

      const { error } = await supabase
        .from("categoriavehiculos")
        .update({
          nombrecat: categoriaEditar.nombrecat,
        })
        .eq("id_categoria", categoriaEditar.id_categoria);

      if (error) {
        console.error("Error al actualizar categoría:", error.message);
        setToast({
          mostrar: true,
          mensaje: `Error al actualizar la categoría ${categoriaEditar.nombrecat}.`,
          tipo: "error",
        });
        return;
      }

      await cargarCategorias();
      setToast({
        mostrar: true,
        mensaje: `Categoría ${categoriaEditar.nombrecat} actualizada exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al actualizar categoría.",
        tipo: "error",
      });
      console.error("Excepción al actualizar categoría:", err.message);
    }
  };

  // 👉 Método para eliminar categoría
  const eliminarCategoria = async () => {
    if (!categoriaAEliminar) return;
    try {
      setMostrarModalEliminacion(false);

      const { error } = await supabase
        .from("categoriavehiculos")
        .delete()
        .eq("id_categoria", categoriaAEliminar.id_categoria);

      if (error) {
        console.error("Error al eliminar categoría:", error.message);
        setToast({
          mostrar: true,
          mensaje: `Error al eliminar la categoría ${categoriaAEliminar.nombrecat}.`,
          tipo: "error",
        });
        return;
      }

      await cargarCategorias();
      setToast({
        mostrar: true,
        mensaje: `Categoría ${categoriaAEliminar.nombrecat} eliminada exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al eliminar categoría.",
        tipo: "error",
      });
      console.error("Excepción al eliminar categoría:", err.message);
    }
  };

  return (
    <Container className="py-4 mt-5 pt-4" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
      <Row className="align-items-center mb-3">
        <Col xs={9} sm={7} md={7} lg={7} className="d-flex align-items-center">
          <h3 className="mb-0 fw-bold" style={{ color: '#A4841C' }}>
            <i className="bi-bookmark-plus-fill me-2"></i>Categorías
          </h3>
        </Col>
        <Col xs={3} sm={5} md={5} lg={5} className="text-end">
          <Button onClick={() => setMostrarModal(true)} size="md" className="btn-primary-custom">
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nueva Categoria</span>
          </Button>
        </Col>
      </Row>

      <hr style={{ borderColor: 'var(--color-primary)' }} />

{/* Cuadro de búsqueda debajo de la línea divisoria */}
<Row className="mb-4">
  <Col md={6} lg={5}>
    <div className="p-1 rounded card-custom" style={{ border: '1px solid var(--color-primary)' }}>
      <CuadroBusquedas
        textoBusqueda={textoBusqueda}
        manejarCambioBusqueda={manejarBusqueda}
        placeholder="Buscar por nombre..."
      />
    </div>
  </Col>
</Row>

{/* Mensaje de no coincidencias solo cuando hay búsqueda y no hay resultados */}
{!cargando && textoBusqueda.trim() && categoriasFiltradas.length === 0 && (
  <Row className="mb-4">
    <Col>
      <Alert variant="info" className="text-center">
        <i className="bi bi-info-circle me-2"></i>
        No se encontraron categorías que coincidan con "{textoBusqueda}".
      </Alert>
    </Col>
  </Row>
)}

{/* Spinner mientras se cargan las categorías */}
{cargando && (
  <Row className="text-center my-5">
    <Col>
      <Spinner animation="border" variant="warning" size="lg" />
      <p className="mt-3 text-muted">Cargando categorías...</p>
    </Col>
  </Row>
)}

{/* Lista de categorías filtradas */}
{!cargando && categoriasFiltradas.length > 0 && (
  <Row>
    {/* Vista en tarjetas para móviles */}
    <Col xs={12} sm={12} md={12} className="d-lg-none">
      <TarjetaCategoria
        categorias={categoriasFiltradas}
        abrirModalEdicion={abrirModalEdicion}
        abrirModalEliminacion={abrirModalEliminacion}
      />
    </Col>

    {/* Vista en tabla para pantallas grandes */}
    <Col lg={12} className="d-none d-lg-block">
      <TablaCategorias
        categorias={categoriasFiltradas}
        abrirModalEdicion={abrirModalEdicion}
        abrirModalEliminacion={abrirModalEliminacion}
      />
    </Col>
  </Row>
)}

<ModalRegistroCategoria
  mostrarModal={mostrarModal}
  setMostrarModal={setMostrarModal}
  nuevaCategoria={nuevaCategoria}
  manejoCambioInput={manejoCambioInput}
  agregarCategoria={agregarCategoria}
/>

<ModalEdicionCategoria
  mostrarModalEdicion={mostrarModalEdicion}
  setMostrarModalEdicion={setMostrarModalEdicion}
  categoriaEditar={categoriaEditar}
  manejoCambioInputEdicion={manejoCambioInputEdicion}
  actualizarCategoria={actualizarCategoria}
/>

<ModalEliminacionCategoria
  mostrarModalEliminacion={mostrarModalEliminacion}
  setMostrarModalEliminacion={setMostrarModalEliminacion}
  eliminarCategoria={eliminarCategoria}
  categoria={categoriaAEliminar}
/>

{/* Paginación */}
{categoriasFiltradas.length > 0 && (
  <Paginacion
    registrosPorPagina={registrosPorPagina}
    totalRegistros={categoriasFiltradas.length}
    paginaActual={paginaActual}
    establecerPaginaActual={establecerPaginaActual}
    establecerRegistrosPorPagina={establecerRegistrosPorPagina}
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

export default Categorias;