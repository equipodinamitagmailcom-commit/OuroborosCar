import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../database/supabaseconfig.js';
import {
  Calendar,
  Wrench,
  Clock,
  CheckCircle2,
  Car,
  User,
  AlertCircle,
  Play,
  Sparkles,
  Search,
  Eye,
  X,
  Camera,
  Trash2,
  Save
} from 'lucide-react';

const CAMPOS_EVIDENCIA = ['evidencia1', 'evidencia2', 'evidencia3', 'evidencia4', 'evidencia5'];
const BUCKET_EVIDENCIAS = 'imagenes_vehiculo';

const normalizarEstado = (estado) => {
  const valor = (estado || '').toLowerCase().trim();
  if (valor.includes('proceso') || valor.includes('curso') || valor.includes('repar')) {
    return 'En Proceso';
  }
  if (valor.includes('complet') || valor.includes('finaliz') || valor.includes('entreg')) {
    return 'Completada';
  }
  return 'Pendiente';
};

const formatearHora = (hora) => {
  if (!hora) return 'Sin hora';

  const texto = String(hora);
  const match = texto.match(/(\d{1,2}):(\d{2})/);
  if (!match) return texto;

  let horas = parseInt(match[1], 10);
  const minutos = match[2];
  const periodo = horas >= 12 ? 'PM' : 'AM';
  horas = horas % 12 || 12;

  return `${String(horas).padStart(2, '0')}:${minutos} ${periodo}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';

  const texto = String(fecha);
  const fechaLocal = new Date(texto.includes('T') ? texto : `${texto}T00:00:00`);
  if (Number.isNaN(fechaLocal.getTime())) return texto;

  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(fechaLocal);
};

const obtenerFechaHoraActual = () => {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');

  return {
    fecha: `${anio}-${mes}-${dia}`,
    hora: `${horas}:${minutos}:${segundos}`
  };
};

const sanitizarNombreArchivo = (nombre) =>
  String(nombre || 'evidencia.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');

const extraerRutaStorage = (url) => {
  if (!url) return null;

  const marcador = `/${BUCKET_EVIDENCIAS}/`;
  const indice = url.indexOf(marcador);

  if (indice === -1) return null;

  return decodeURIComponent(url.slice(indice + marcador.length));
};

const mapearEvidencias = (fila) => {
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

  return { evidenciasPorCampo, evidencias };
};

const mapearCitaDesdeBD = (fila) => ({
  ...mapearEvidencias(fila),
  id_cita: fila.id_cita,
  fecha_inicio: fila.fecha_inicio,
  fecha_fin: fila.fecha_fin,
  hora_inicio: fila.hora_inicio,
  hora_fin: fila.hora_fin,
  nombre_cliente: fila.clientes
    ? `${fila.clientes.nombres || ''} ${fila.clientes.apellidos || ''}`.trim()
    : 'Cliente no registrado',
  vehiculo: {
    marca: fila.vehiculoclientes?.vehiculos?.marca || 'Sin marca',
    modelo: fila.vehiculoclientes?.vehiculos?.modelo || 'Sin modelo',
    anio: fila.vehiculoclientes?.vehiculos?.anio || '—',
    color: fila.vehiculoclientes?.vehiculos?.color || 'No registrado',
    placa: fila.vehiculoclientes?.patente || 'Sin placa'
  },
  motivo_cita: fila.motivo || 'Sin motivo registrado',
  detalle: fila.detalle || '',
  hora_cita: formatearHora(fila.hora_inicio),
  estado: normalizarEstado(fila.estado)
});

const ConfirmacionCitas = () => {
  const [citas, setCitas] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [idMecanico, setIdMecanico] = useState(null);
  const [nombreMecanico, setNombreMecanico] = useState('Mecánico');
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [detalleCita, setDetalleCita] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardandoDetalle, setGuardandoDetalle] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [subiendoEvidencias, setSubiendoEvidencias] = useState(false);
  const [eliminandoEvidencia, setEliminandoEvidencia] = useState('');

  const mostrarToast = (mensaje, tipo = 'success') => {
    const id = Date.now();
    setNotificaciones(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const cargarCitasDesdeBaseDatos = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCitas([]);
        mostrarToast('Debes iniciar sesión para ver tus citas.', 'error');
        return;
      }

      const { data: mecanico, error: errorMecanico } = await supabase
        .from('mecanicos')
        .select('id_mecanico, nombres, apellidos')
        .eq('profile_id', user.id)
        .single();

      if (errorMecanico || !mecanico) {
        setCitas([]);
        mostrarToast('No se encontró tu perfil de mecánico en la base de datos.', 'error');
        return;
      }

      setIdMecanico(mecanico.id_mecanico);
      setNombreMecanico(`Téc. ${mecanico.nombres} ${mecanico.apellidos}`.trim());

      const { data, error } = await supabase
        .from('cita')
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
          clientes (
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
        .eq('id_mecanico', mecanico.id_mecanico)
        .order('fecha_inicio', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (error) throw error;

      setCitas((data || []).map(mapearCitaDesdeBD));
    } catch (err) {
      console.error('Error al cargar citas:', err.message);
      setCitas([]);
      mostrarToast('Error al cargar las citas desde Supabase.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitasDesdeBaseDatos();
  }, []);

  const cargarDetalleCita = async (idCita) => {
    setCargandoDetalle(true);
    try {
      const { data, error } = await supabase
        .from('cita')
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
          clientes (
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
        .eq('id_cita', idCita)
        .single();

      if (error) throw error;

      const citaMapeada = mapearCitaDesdeBD(data);
      setDetalleCita(citaMapeada);
      setCitas(prev =>
        prev.map(cita => (cita.id_cita === citaMapeada.id_cita ? { ...cita, ...citaMapeada } : cita))
      );
    } catch (err) {
      console.error('Error al cargar el detalle de la cita:', err.message || err);
      mostrarToast('No se pudo cargar el detalle de la cita.', 'error');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const abrirDetalle = async (cita) => {
    setMostrarDetalle(true);
    setArchivosSeleccionados([]);
    setDetalleCita(cita);
    await cargarDetalleCita(cita.id_cita);
  };

  const espaciosDisponibles = useMemo(() => {
    if (!detalleCita) return 5;
    return Math.max(0, 5 - (detalleCita.evidencias?.length || 0));
  }, [detalleCita]);

  const guardarDetalleTrabajo = async () => {
    if (!detalleCita) return;

    setGuardandoDetalle(true);
    try {
      const { error } = await supabase
        .from('cita')
        .update({ detalle: detalleCita.detalle || null })
        .eq('id_cita', detalleCita.id_cita);

      if (error) throw error;

      setCitas(prev =>
        prev.map(cita =>
          cita.id_cita === detalleCita.id_cita
            ? { ...cita, detalle: detalleCita.detalle || '' }
            : cita
        )
      );

      mostrarToast('El detalle del trabajo se guardó correctamente.', 'success');
    } catch (err) {
      console.error('Error al guardar el detalle:', err.message || err);
      mostrarToast('No se pudo guardar el detalle del trabajo.', 'error');
    } finally {
      setGuardandoDetalle(false);
    }
  };

  const manejarSeleccionArchivos = (event) => {
    const archivos = Array.from(event.target.files || []);

    if (!archivos.length) {
      setArchivosSeleccionados([]);
      return;
    }

    const archivosNoValidos = archivos.filter((archivo) => !archivo.type.startsWith('image/'));
    if (archivosNoValidos.length > 0) {
      mostrarToast('Solo puedes seleccionar archivos de imagen.', 'error');
      event.target.value = '';
      setArchivosSeleccionados([]);
      return;
    }

    if (archivos.length > espaciosDisponibles) {
      mostrarToast(`Solo puedes subir ${espaciosDisponibles} imagen(es) más para esta cita.`, 'error');
      event.target.value = '';
      setArchivosSeleccionados([]);
      return;
    }

    setArchivosSeleccionados(archivos);
  };

  const subirEvidencias = async () => {
    if (!detalleCita || !archivosSeleccionados.length) {
      mostrarToast('Selecciona al menos una imagen para continuar.', 'error');
      return;
    }

    setSubiendoEvidencias(true);
    const archivosSubidos = [];

    try {
      const siguientesCampos = CAMPOS_EVIDENCIA.filter(
        (campo) => !detalleCita.evidenciasPorCampo?.[campo]
      );

      const actualizacion = {};

      for (let indice = 0; indice < archivosSeleccionados.length; indice += 1) {
        const archivo = archivosSeleccionados[indice];
        const nombreArchivo = `citas/${detalleCita.id_cita}/${Date.now()}_${indice}_${sanitizarNombreArchivo(archivo.name)}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_EVIDENCIAS)
          .upload(nombreArchivo, archivo);

        if (uploadError) throw uploadError;

        archivosSubidos.push(nombreArchivo);

        const { data: urlData } = supabase.storage
          .from(BUCKET_EVIDENCIAS)
          .getPublicUrl(nombreArchivo);

        actualizacion[siguientesCampos[indice]] = urlData.publicUrl;
      }

      const { error: errorUpdate } = await supabase
        .from('cita')
        .update(actualizacion)
        .eq('id_cita', detalleCita.id_cita);

      if (errorUpdate) throw errorUpdate;

      setArchivosSeleccionados([]);
      await Promise.all([cargarCitasDesdeBaseDatos(), cargarDetalleCita(detalleCita.id_cita)]);
      mostrarToast('Las evidencias se guardaron correctamente.', 'success');
    } catch (err) {
      console.error('Error al subir evidencias:', err.message || err);
      if (archivosSubidos.length) {
        await supabase.storage.from(BUCKET_EVIDENCIAS).remove(archivosSubidos).catch(() => {});
      }
      mostrarToast('No se pudieron guardar las evidencias.', 'error');
    } finally {
      setSubiendoEvidencias(false);
    }
  };

  const eliminarEvidencia = async (campo, url) => {
    if (!detalleCita || !campo) return;

    setEliminandoEvidencia(campo);
    try {
      const { error } = await supabase
        .from('cita')
        .update({ [campo]: null })
        .eq('id_cita', detalleCita.id_cita);

      if (error) throw error;

      const rutaArchivo = extraerRutaStorage(url);
      if (rutaArchivo) {
        await supabase.storage.from(BUCKET_EVIDENCIAS).remove([rutaArchivo]).catch(() => {});
      }

      await Promise.all([cargarCitasDesdeBaseDatos(), cargarDetalleCita(detalleCita.id_cita)]);
      mostrarToast('La evidencia fue eliminada.', 'success');
    } catch (err) {
      console.error('Error al eliminar evidencia:', err.message || err);
      mostrarToast('No se pudo eliminar la evidencia seleccionada.', 'error');
    } finally {
      setEliminandoEvidencia('');
    }
  };

  const avanzarEstado = async (idCita) => {
    const citaActual = citas.find(c => c.id_cita === idCita);
    if (!citaActual) return;

    let nuevoEstado = '';
    let mensajeToast = '';
    let datosActualizacion = {};

    if (citaActual.estado === 'Pendiente') {
      nuevoEstado = 'En Proceso';
      mensajeToast = `¡Cita de ${citaActual.nombre_cliente} iniciada! El vehículo ahora está en taller.`;
      datosActualizacion = { estado: nuevoEstado };
    } else if (citaActual.estado === 'En Proceso') {
      const { fecha, hora } = obtenerFechaHoraActual();
      nuevoEstado = 'Completada';
      mensajeToast = `¡Reparación finalizada con éxito para el vehículo ${citaActual.vehiculo.marca}!`;
      datosActualizacion = {
        estado: nuevoEstado,
        fecha_fin: fecha,
        hora_fin: hora
      };
    } else {
      return;
    }

    const { error } = await supabase
      .from('cita')
      .update(datosActualizacion)
      .eq('id_cita', idCita);

    if (error) {
      console.error('Error al actualizar cita:', error.message);
      mostrarToast('No se pudo guardar el cambio de estado en la base de datos.', 'error');
      return;
    }

    setCitas(prevCitas =>
      prevCitas.map(cita =>
        cita.id_cita === idCita
          ? {
              ...cita,
              ...datosActualizacion,
              estado: nuevoEstado
            }
          : cita
      )
    );

    mostrarToast(mensajeToast, nuevoEstado === 'Completada' ? 'success' : 'info');
  };

  const citasFiltradas = citas.filter(cita => {
    const coincideEstado = filtroActivo === 'Todas' || cita.estado === filtroActivo;
    if (!coincideEstado) return false;

    const texto = busqueda.toLowerCase().trim();
    if (!texto) return true;

    return (
      cita.nombre_cliente.toLowerCase().includes(texto) ||
      cita.motivo_cita.toLowerCase().includes(texto) ||
      cita.vehiculo.marca.toLowerCase().includes(texto) ||
      cita.vehiculo.modelo.toLowerCase().includes(texto) ||
      String(cita.vehiculo.placa).toLowerCase().includes(texto) ||
      String(cita.id_cita).includes(texto)
    );
  });

  const totalCitas = citas.length;
  const pendientesCount = citas.filter(c => c.estado === 'Pendiente').length;
  const enProcesoCount = citas.filter(c => c.estado === 'En Proceso').length;
  const completadasCount = citas.filter(c => c.estado === 'Completada').length;

  return (
    <div className="vista-mecanico min-h-screen bg-[#121212] text-slate-100 p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-[#A4841C]/40 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#A4841C] font-semibold text-lg tracking-wider uppercase mb-1">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Ouroboros Car Service</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-[#A4841C]">
              Gestión de Citas
            </h1>
            <p className="text-slate-400 text-lg mt-1">
              Panel técnico para <span className="text-[#A4841C] font-bold">{nombreMecanico}</span>.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="bg-[#1e1e1e] border border-[#A4841C]/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="p-2 bg-[#A4841C]/10 rounded-lg text-[#A4841C]">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase font-bold tracking-wider">Pendientes</p>
                <p className="text-3xl font-black text-white">{pendientesCount}</p>
              </div>
            </div>

            <div className="bg-[#1e1e1e] border border-[#A4841C]/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="p-2 bg-[#A4841C]/10 rounded-lg text-[#A4841C]">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase font-bold tracking-wider">En Curso</p>
                <p className="text-3xl font-black text-white">{enProcesoCount}</p>
              </div>
            </div>

            <div className="bg-[#1e1e1e] border border-[#A4841C]/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase font-bold tracking-wider">Completas</p>
                <p className="text-3xl font-black text-white">{completadasCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente, vehículo, placa, motivo o ID de cita..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="block w-full pl-12 pr-4 py-3.5 bg-[#1e1e1e] border border-[#A4841C]/50 rounded-xl text-slate-100 placeholder-slate-500 text-lg focus:outline-none focus:border-[#A4841C] focus:ring-1 focus:ring-[#A4841C] transition-all duration-200"
          />
        </div>

        <div className="bg-[#1e1e1e] p-1.5 rounded-xl border border-[#A4841C]/40 flex overflow-x-auto gap-1.5 scrollbar-none">
          <button
            onClick={() => setFiltroActivo('Todas')}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-lg text-base font-bold transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filtroActivo === 'Todas'
                ? 'bg-[#A4841C] text-white shadow-md border border-[#A4841C]'
                : 'text-slate-400 hover:text-[#A4841C] hover:bg-slate-900/30'
            }`}
          >
            <span>Todas</span>
            <span className="px-2 py-0.5 rounded-full text-sm bg-slate-950 text-slate-400 font-bold">
              {totalCitas}
            </span>
          </button>

          <button
            onClick={() => setFiltroActivo('Pendiente')}
            className={`flex-1 min-w-[110px] py-2.5 px-4 rounded-lg text-base font-bold transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filtroActivo === 'Pendiente'
                ? 'bg-[#A4841C]/20 text-[#A4841C] shadow-md border border-[#A4841C]/50'
                : 'text-slate-400 hover:text-[#A4841C] hover:bg-slate-900/30'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#A4841C]"></span>
            <span>Pendientes</span>
            <span className="px-2 py-0.5 rounded-full text-sm bg-slate-950 text-slate-400 font-bold">
              {pendientesCount}
            </span>
          </button>

          <button
            onClick={() => setFiltroActivo('En Proceso')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-base font-bold transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filtroActivo === 'En Proceso'
                ? 'bg-amber-500/20 text-amber-300 shadow-md border border-amber-500/30'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900/30'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>En Proceso</span>
            <span className="px-2 py-0.5 rounded-full text-sm bg-slate-950 text-slate-400 font-bold">
              {enProcesoCount}
            </span>
          </button>

          <button
            onClick={() => setFiltroActivo('Completada')}
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-lg text-base font-bold transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filtroActivo === 'Completada'
                ? 'bg-emerald-500/20 text-emerald-300 shadow-md border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900/30'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Completadas</span>
            <span className="px-2 py-0.5 rounded-full text-sm bg-slate-950 text-slate-400 font-bold">
              {completadasCount}
            </span>
          </button>
        </div>

        <div className="space-y-4">
          {cargando ? (
            <div className="bg-[#1e1e1e]/40 border border-[#A4841C]/40 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4841C] mb-4"></div>
              <p className="text-slate-400 text-lg">Cargando citas desde la base de datos...</p>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="bg-[#1e1e1e]/40 border border-dashed border-[#A4841C]/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-[#1e1e1e] rounded-full text-slate-600 mb-4">
                <Calendar className="w-10 h-10 text-[#A4841C]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-300">No hay citas</h3>
              <p className="text-slate-400 text-lg mt-1 max-w-sm">
                {busqueda.trim()
                  ? `No se encontraron citas que coincidan con "${busqueda}".`
                  : idMecanico
                    ? `No hay citas con el estado "${filtroActivo}" asignadas a tu cuenta en la base de datos.`
                    : 'No se pudo vincular tu sesión con un mecánico registrado.'}
              </p>
            </div>
          ) : (
            citasFiltradas.map((cita) => {
              const esPendiente = cita.estado === 'Pendiente';
              const esEnProceso = cita.estado === 'En Proceso';
              const esCompletada = cita.estado === 'Completada';

              let colorBorde = 'border-[#A4841C]/40';
              let badgeClase = '';
              let estadoTexto = '';

              if (esPendiente) {
                colorBorde = 'border-[#A4841C]/40 hover:border-[#A4841C]/80';
                badgeClase = 'bg-[#A4841C]/10 text-[#A4841C] border-[#A4841C]/50';
                estadoTexto = 'Pendiente / Asignada';
              } else if (esEnProceso) {
                colorBorde = 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.08)]';
                badgeClase = 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
                estadoTexto = 'En Reparación';
              } else if (esCompletada) {
                colorBorde = 'border-[#A4841C]/20 bg-[#1e1e1e]/60 opacity-80';
                badgeClase = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                estadoTexto = 'Completada';
              }

              return (
                <div
                  key={cita.id_cita}
                  className={`bg-[#1e1e1e] border rounded-2xl p-6 transition-all duration-300 ${colorBorde}`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${
                          esEnProceso ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          esCompletada ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          'bg-[#121212] border-[#A4841C]/50 text-[#A4841C]'
                        }`}>
                          <Car className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-2xl text-white leading-tight">
                            {cita.vehiculo.marca} {cita.vehiculo.modelo}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm bg-[#121212] border border-[#A4841C]/40 px-2.5 py-0.5 rounded text-[#A4841C] font-mono font-bold">
                              PLACA: {cita.vehiculo.placa}
                            </span>
                            <span className="text-sm text-slate-400 font-medium">
                              Año {cita.vehiculo.anio}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${badgeClase}`}>
                        {estadoTexto}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#121212] p-5 rounded-xl border border-[#A4841C]/35 text-lg">
                      <div className="flex items-center gap-3 text-slate-200">
                        <User className="w-5 h-5 text-[#A4841C] shrink-0" />
                        <span className="text-slate-400">Cliente:</span>
                        <strong className="text-white text-xl">{cita.nombre_cliente}</strong>
                      </div>

                      <div className="flex items-center gap-3 text-slate-200">
                        <Clock className="w-5 h-5 text-[#A4841C] shrink-0" />
                        <span className="text-slate-400">Hora Pactada:</span>
                        <strong className="text-white text-xl">{cita.hora_cita}</strong>
                      </div>

                      <div className="flex items-start gap-3 text-slate-200 md:col-span-2 mt-1 border-t border-[#A4841C]/15 pt-3">
                        <Wrench className="w-5 h-5 text-[#A4841C] shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-400 font-semibold block text-base">Motivo del Servicio:</span>
                          <p className="text-slate-100 font-bold text-xl mt-1 leading-relaxed">
                            {cita.motivo_cita}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#A4841C]/30 pt-4 mt-1">
                      <div className="flex items-center gap-1.5 text-base text-slate-400 font-medium">
                        <AlertCircle className="w-4 h-4 text-[#A4841C]" />
                        <span>ID Cita: #{cita.id_cita}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <button
                          onClick={() => abrirDetalle(cita)}
                          className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base rounded-xl border border-[#A4841C]/40 transition-all duration-300 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-[#A4841C]" />
                          <span>Detalle</span>
                        </button>

                        {esPendiente && (
                          <button
                            onClick={() => avanzarEstado(cita.id_cita)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#A4841C] hover:bg-[#8c7018] active:scale-95 text-white font-extrabold text-base rounded-xl shadow-lg shadow-[#A4841C]/10 hover:shadow-[#A4841C]/20 transition-all duration-300 cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Confirmar e Iniciar Cita</span>
                          </button>
                        )}

                        {esEnProceso && (
                          <button
                            onClick={() => avanzarEstado(cita.id_cita)}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-extrabold text-base rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Finalizar Reparación</span>
                          </button>
                        )}

                        {esCompletada && (
                          <div className="flex items-center gap-2 text-emerald-400 text-base font-extrabold bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Trabajo Finalizado y Entregado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {mostrarDetalle && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="bg-[#111111] border border-[#A4841C]/35 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-[#A4841C]/20">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#A4841C]">
                    {detalleCita ? `Detalle de la cita #${detalleCita.id_cita}` : 'Detalle de la cita'}
                  </h2>
                  <p className="text-slate-400 mt-1">
                    Registra lo realizado y agrega hasta 5 fotos como evidencia.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setMostrarDetalle(false);
                    setDetalleCita(null);
                    setArchivosSeleccionados([]);
                  }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!detalleCita || cargandoDetalle ? (
                <div className="p-10 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4841C] mx-auto mb-4"></div>
                  <p className="text-slate-400 text-lg">Cargando detalle de la cita...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 p-6">
                  <div className="space-y-6">
                    <div className="bg-[#1b1b1b] border border-[#A4841C]/20 rounded-2xl p-5">
                      <h3 className="text-xl font-extrabold text-[#A4841C] mb-4">Información general</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-200">
                        <div className="space-y-2">
                          <p><span className="text-slate-400">Cliente:</span> <strong>{detalleCita.nombre_cliente}</strong></p>
                          <p><span className="text-slate-400">Vehículo:</span> <strong>{detalleCita.vehiculo.marca} {detalleCita.vehiculo.modelo}</strong></p>
                          <p><span className="text-slate-400">Placa:</span> <strong>{detalleCita.vehiculo.placa}</strong></p>
                          <p><span className="text-slate-400">Color:</span> <strong>{detalleCita.vehiculo.color}</strong></p>
                        </div>
                        <div className="space-y-2">
                          <p><span className="text-slate-400">Estado:</span> <strong>{detalleCita.estado}</strong></p>
                          <p><span className="text-slate-400">Fecha inicio:</span> <strong>{formatearFecha(detalleCita.fecha_inicio)}</strong></p>
                          <p><span className="text-slate-400">Hora inicio:</span> <strong>{formatearHora(detalleCita.hora_inicio)}</strong></p>
                          <p><span className="text-slate-400">Hora fin:</span> <strong>{formatearHora(detalleCita.hora_fin)}</strong></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1b1b1b] border border-[#A4841C]/20 rounded-2xl p-5">
                      <h3 className="text-xl font-extrabold text-[#A4841C] mb-3">Motivo de la cita</h3>
                      <p className="text-slate-300 leading-relaxed">{detalleCita.motivo_cita}</p>
                    </div>

                    <div className="bg-[#1b1b1b] border border-[#A4841C]/20 rounded-2xl p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                        <h3 className="text-xl font-extrabold text-[#A4841C]">Trabajo realizado</h3>
                        <button
                          onClick={guardarDetalleTrabajo}
                          disabled={guardandoDetalle}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#A4841C] hover:bg-[#8c7018] disabled:opacity-60 text-white font-bold rounded-xl cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>{guardandoDetalle ? 'Guardando...' : 'Guardar detalle'}</span>
                        </button>
                      </div>

                      <textarea
                        value={detalleCita.detalle || ''}
                        onChange={(e) =>
                          setDetalleCita((prev) => ({ ...prev, detalle: e.target.value }))
                        }
                        rows={10}
                        placeholder="Escribe aquí todo lo que se hizo en esta cita..."
                        className="w-full rounded-2xl bg-[#101010] border border-slate-700 focus:border-[#A4841C] focus:outline-none px-4 py-4 text-slate-100 resize-y"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#1b1b1b] border border-[#A4841C]/20 rounded-2xl p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-xl font-extrabold text-[#A4841C]">Evidencias</h3>
                        <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-200 font-bold">
                          {detalleCita.evidencias.length}/5
                        </span>
                      </div>

                      <div className="flex items-start gap-3 bg-[#101010] border border-slate-700 rounded-2xl p-4 mb-4">
                        <Camera className="w-5 h-5 text-[#A4841C] mt-0.5 shrink-0" />
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {espaciosDisponibles === 0
                            ? 'Esta cita ya llegó al máximo de 5 imágenes.'
                            : `Puedes agregar ${espaciosDisponibles} imagen(es) más como evidencia del trabajo realizado.`}
                        </p>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={manejarSeleccionArchivos}
                        disabled={subiendoEvidencias || espaciosDisponibles === 0}
                        className="block w-full text-sm text-slate-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:bg-[#A4841C] file:text-white file:font-bold bg-[#101010] border border-slate-700 rounded-2xl cursor-pointer"
                      />

                      {archivosSeleccionados.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-slate-700 bg-[#101010] p-4">
                          <p className="font-bold text-white mb-2">Archivos seleccionados</p>
                          <div className="space-y-2 text-sm text-slate-300">
                            {archivosSeleccionados.map((archivo) => (
                              <p key={`${archivo.name}-${archivo.size}`}>{archivo.name}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={subirEvidencias}
                        disabled={subiendoEvidencias || !archivosSeleccionados.length || espaciosDisponibles === 0}
                        className="w-full mt-4 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold cursor-pointer"
                      >
                        {subiendoEvidencias ? 'Guardando evidencias...' : 'Subir evidencias'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {detalleCita.evidencias.length > 0 ? (
                        detalleCita.evidencias.map((evidencia, index) => (
                          <div
                            key={evidencia.campo}
                            className="bg-[#1b1b1b] border border-[#A4841C]/20 rounded-2xl overflow-hidden"
                          >
                            <img
                              src={evidencia.url}
                              alt={`Evidencia ${index + 1}`}
                              className="w-full h-60 object-cover"
                            />
                            <div className="p-4">
                              <p className="text-white font-bold mb-3">Evidencia {index + 1}</p>
                              <div className="grid grid-cols-2 gap-3">
                                <a
                                  href={evidencia.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-center px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold"
                                >
                                  Ver imagen
                                </a>
                                <button
                                  onClick={() => eliminarEvidencia(evidencia.campo, evidencia.url)}
                                  disabled={eliminandoEvidencia === evidencia.campo}
                                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-60 text-white font-bold cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>{eliminandoEvidencia === evidencia.campo ? 'Eliminando...' : 'Eliminar'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-[#1b1b1b] border border-dashed border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                          Esta cita todavía no tiene evidencias fotográficas.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full px-4 md:px-0">
        {notificaciones.map((notif) => (
          <div
            key={notif.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 ${
              notif.tipo === 'success'
                ? 'bg-[#1e1e1e]/95 text-emerald-300 border-emerald-500/20'
                : notif.tipo === 'error'
                  ? 'bg-[#1e1e1e]/95 text-rose-300 border-rose-500/20'
                  : 'bg-[#1e1e1e]/95 text-[#A4841C] border-[#A4841C]/45'
            }`}
          >
            <div className="mt-0.5">
              {notif.tipo === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Wrench className="w-5 h-5 text-[#A4841C] shrink-0" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                {notif.tipo === 'success'
                  ? 'Sincronizado Supabase'
                  : notif.tipo === 'error'
                    ? 'Error'
                    : 'Estado Actualizado'}
              </h4>
              <p className="text-slate-100 text-base mt-0.5">{notif.mensaje}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfirmacionCitas;
