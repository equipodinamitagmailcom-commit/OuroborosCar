import React, { useState, useEffect } from 'react';
import { supabase } from '../database/supabaseconfig.js';
import { 
  Search, 
  Package, 
  MinusCircle, 
  CheckCircle, 
  AlertTriangle, 
  Layers,
  Plus, 
  Minus, 
  Warehouse,
  ShoppingBag,
  Info
} from 'lucide-react';

const RetiroRepuestos = () => {
  // Estado de los productos cargados desde la base de datos
  const [productos, setProductos] = useState([]);
  
  // Estado de carga inicial de Supabase
  const [cargando, setCargando] = useState(true);
  
  // Estado para las cantidades elegidas de cada producto (id_producto -> cantidad)
  const [cantidades, setCantidades] = useState({});
  
  // Estado para la barra de búsqueda en tiempo real
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para notificaciones de transacciones
  const [notificaciones, setNotificaciones] = useState([]);

  // Datos simulados de la sesión
  const mecanicoActual = "Téc. Ricardo Gómez";

  // Ayudante para mostrar toasts flotantes
  const mostrarToast = (mensaje, tipo = 'success') => {
    const id = Date.now();
    setNotificaciones(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  // Función para obtener repuestos desde Supabase
  const cargarRepuestosDesdeBaseDatos = async () => {
    setCargando(true);
    try {
      // Consulta a la tabla 'repuestos' uniendo con 'categoriarepuesto'
      const { data, error } = await supabase
        .from('repuestos')
        .select(`
          id_repuesto,
          nombre,
          descripcion,
          precio_repuesto,
          id_categoria,
          categoriarepuesto (
            nombre
          )
        `)
        .order('id_repuesto', { ascending: false });

      if (error) throw error;

      // Mapear los datos de Supabase a la estructura de nuestra tarjeta
      // Como la tabla 'repuestos' en Supabase no posee columna física de 'stock',
      // inyectamos un valor inicial dinámico basado en el ID para propósitos de simulación y demo de retiro.
      const productosMapeados = (data || []).map(item => ({
        id_producto: item.id_repuesto,
        nombre: item.nombre,
        categoria: item.categoriarepuesto?.nombre || 'General',
        stock: (item.id_repuesto * 4) % 16 + 5, // Genera un stock interactivo entre 5 y 20 basado en su ID
        codigo: `REP-${String(item.id_repuesto).padStart(3, '0')}`,
        descripcion: item.descripcion || 'Sin descripción técnica disponible.'
      }));

      setProductos(productosMapeados);
    } catch (err) {
      console.error("Error al cargar repuestos desde la base de datos:", err.message);
      mostrarToast("Error de conexión al cargar repuestos de Supabase", "error");
    } finally {
      setCargando(false);
    }
  };

  // Cargar los productos de la base de datos al montar la vista
  useEffect(() => {
    cargarRepuestosDesdeBaseDatos();
  }, []);

  // Obtiene la cantidad elegida para un producto específico (por defecto 1)
  const obtenerCantidadElegida = (id) => {
    return cantidades[id] ?? 1;
  };

  // Cambia la cantidad elegida asegurándose de no bajar de 1
  const cambiarCantidad = (id, delta) => {
    const actual = obtenerCantidadElegida(id);
    const nueva = Math.max(1, actual + delta);
    setCantidades(prev => ({
      ...prev,
      [id]: nueva
    }));
  };

  // Acción de Retirar Repuesto (Simulación de actualización de Supabase)
  const manejarRetiro = async (idProducto) => {
    const producto = productos.find(p => p.id_producto === idProducto);
    const cantidadRetiro = obtenerCantidadElegida(idProducto);

    if (!producto) return;

    // Validación crítica de stock antes de continuar
    if (cantidadRetiro > producto.stock) {
      mostrarToast(`Error: No hay suficiente stock de ${producto.nombre}`, 'error');
      return;
    }

    // Simulación del estado local restando el stock
    setProductos(prevProductos => {
      return prevProductos.map(p => {
        if (p.id_producto === idProducto) {
          const nuevoStock = p.stock - cantidadRetiro;
          mostrarToast(`Retiro procesado: ${cantidadRetiro}x "${p.nombre}" retirado de bodega. Stock: ${nuevoStock}`, 'success');
          return { ...p, stock: nuevoStock };
        }
        return p;
      });
    });

    // Resetear el selector de cantidad del producto retirado a 1
    setCantidades(prev => ({
      ...prev,
      [idProducto]: 1
    }));
  };

  // Filtrar los productos por nombre, categoría o código en tiempo real
  const productosFiltrados = productos.filter(p => {
    const texto = busqueda.toLowerCase().trim();
    return (
      p.nombre.toLowerCase().includes(texto) ||
      p.categoria.toLowerCase().includes(texto) ||
      p.codigo.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="vista-mecanico min-h-screen bg-[#121212] text-slate-100 p-4 md:p-6 pb-24">
      {/* Contenedor centralizado responsive */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Encabezado de la Sección */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-[#A4841C]/45 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#A4841C] font-semibold text-lg tracking-wider uppercase mb-1">
              <Warehouse className="w-5 h-5" />
              <span>Control de Bodega</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-[#A4841C]">
              Retiro de Repuestos
            </h1>
            <p className="text-slate-400 text-lg mt-1">
              Solicita materiales de forma directa. Autorizado para: <span className="text-[#A4841C] font-bold">{mecanicoActual}</span>
            </p>
          </div>

          <div className="bg-[#1e1e1e] border border-[#A4841C]/50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-base text-slate-400 font-medium">
            <Info className="w-5 h-5 text-[#A4841C] shrink-0" />
            <span>Los productos y categorías son consultados en tiempo real desde Supabase.</span>
          </div>
        </div>

        {/* Buscador de Productos (Barra superior) */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar repuestos en base de datos por nombre, categoría o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="block w-full pl-12 pr-4 py-3.5 bg-[#1e1e1e] border border-[#A4841C]/50 rounded-xl text-slate-100 placeholder-slate-500 text-lg focus:outline-none focus:border-[#A4841C] focus:ring-1 focus:ring-[#A4841C] transition-all duration-200"
          />
        </div>

        {/* Estado de Carga */}
        {cargando ? (
          <div className="bg-[#1e1e1e]/40 border border-[#A4841C]/40 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4841C] mb-4"></div>
            <p className="text-slate-400 text-lg">Cargando inventario desde base de datos Supabase...</p>
          </div>
        ) : (
          /* Catálogo de Productos */
          <>
            {productosFiltrados.length === 0 ? (
              <div className="bg-[#1e1e1e]/40 border border-dashed border-[#A4841C]/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-[#1e1e1e] rounded-full text-slate-600 mb-4">
                  <ShoppingBag className="w-10 h-10 text-[#A4841C]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-300">No se encontraron productos</h3>
                <p className="text-slate-400 text-lg mt-1 max-w-sm">
                  No hay repuestos que coincidan con la búsqueda "{busqueda}" en la base de datos de Ouroboros.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productosFiltrados.map((prod) => {
                  const cantidadElegida = obtenerCantidadElegida(prod.id_producto);
                  const esAgotado = prod.stock === 0;
                  const stockInsuficiente = cantidadElegida > prod.stock;

                  return (
                    <div
                      key={prod.id_producto}
                      className={`bg-[#1e1e1e] border rounded-2xl p-6 transition-all duration-300 ${
                        esAgotado 
                          ? 'border-[#A4841C]/30 opacity-60 bg-[#1e1e1e]/40' 
                          : stockInsuficiente 
                            ? 'border-rose-950 hover:border-rose-900/50' 
                            : 'border-[#A4841C]/40 hover:border-[#A4841C]/80'
                      }`}
                    >
                      <div className="flex flex-col h-full justify-between gap-4">
                        
                        {/* Sección Superior de la Tarjeta */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-0.5">
                              <span className="text-sm text-slate-500 font-mono tracking-wider font-bold">
                                {prod.codigo}
                              </span>
                              <h3 className="font-extrabold text-xl md:text-2xl text-white leading-tight">
                                {prod.nombre}
                              </h3>
                            </div>

                            {/* Badge de Stock */}
                            {esAgotado ? (
                              <span className="text-sm font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full shrink-0">
                                Agotado
                              </span>
                            ) : (
                              <span className={`text-sm font-bold uppercase px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5 ${
                                prod.stock <= 5 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                  : 'bg-[#A4841C]/10 text-[#A4841C] border-[#A4841C]/50'
                              }`}>
                                <Package className="w-3.5 h-3.5" />
                                <span>Stock: {prod.stock}</span>
                              </span>
                            )}
                          </div>

                          {/* Categoría */}
                          <div className="flex items-center gap-1.5 text-base text-slate-300 bg-[#121212] w-fit px-2.5 py-1 rounded-md border border-[#A4841C]/40">
                            <Layers className="w-4 h-4 text-[#A4841C] shrink-0" />
                            <span>Categoría: <strong className="text-slate-100 font-bold">{prod.categoria}</strong></span>
                          </div>

                          {/* Descripción técnica corta */}
                          {prod.descripcion && (
                            <p className="text-slate-400 text-base line-clamp-2 mt-1 italic font-medium">
                              {prod.descripcion}
                            </p>
                          )}
                        </div>

                        {/* Controles de Cantidad y Retiro */}
                        <div className="border-t border-[#A4841C]/35 pt-4 mt-1 flex flex-col gap-3.5">
                          {!esAgotado ? (
                            <>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-base text-slate-350 font-bold">Cantidad a retirar:</span>
                                
                                {/* Control Selector numérico */}
                                <div className="flex items-center bg-[#121212] border border-[#A4841C]/45 rounded-lg p-1">
                                  <button
                                    type="button"
                                    disabled={cantidadElegida <= 1}
                                    onClick={() => cambiarCantidad(prod.id_producto, -1)}
                                    className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  
                                  <span className="w-10 text-center text-lg md:text-2xl font-black text-white font-mono">
                                    {cantidadElegida}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={cantidadElegida >= prod.stock}
                                    onClick={() => cambiarCantidad(prod.id_producto, 1)}
                                    className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Botón y Validador */}
                              <div className="space-y-2">
                                {stockInsuficiente && (
                                  <div className="flex items-center justify-center gap-1.5 text-sm md:text-lg font-bold text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg text-center animate-pulse">
                                    <MinusCircle className="w-4 h-4 shrink-0" />
                                    <span>Stock Insuficiente (Máximo {prod.stock})</span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  disabled={stockInsuficiente}
                                  onClick={() => manejarRetiro(prod.id_producto)}
                                  className={`w-full py-3 px-5 font-extrabold text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border ${
                                    stockInsuficiente
                                      ? 'bg-[#121212] text-slate-500 border-[#A4841C]/30 cursor-not-allowed'
                                      : 'bg-[#A4841C] hover:bg-[#8c7018] active:scale-[0.98] text-white border-[#A4841C]/40 shadow-lg shadow-[#A4841C]/10 hover:shadow-[#A4841C]/20 cursor-pointer'
                                  }`}
                                >
                                  <Warehouse className="w-4 h-4" />
                                  <span>Retirar Producto</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center gap-2 text-base font-bold text-rose-400 bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-center">
                              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                              <span>Repuesto Agotado temporalmente en Bodega</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* Notificaciones Flotantes (Toasts de Simulación Base de Datos) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full px-4 md:px-0">
        {notificaciones.map((notif) => (
          <div
            key={notif.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 ${
              notif.tipo === 'success' 
                ? 'bg-[#1e1e1e]/95 text-emerald-300 border-emerald-500/20' 
                : 'bg-[#1e1e1e]/95 text-[#A4841C] border-[#A4841C]/45'
            }`}
          >
            <div className="mt-0.5">
              {notif.tipo === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-[#A4841C] shrink-0" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                {notif.tipo === 'success' ? 'Inventario Sincronizado' : 'Error de Retiro'}
              </h4>
              <p className="text-slate-100 text-base mt-0.5 font-medium leading-tight">{notif.mensaje}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RetiroRepuestos;
