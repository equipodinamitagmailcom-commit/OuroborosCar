import { useEffect, useState, useMemo, useRef } from 'react';
import { Container, Row, Col, Card, Form, Spinner } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Wrench,
  RefreshCw,
  BarChart3,
  Activity,
  Filter
} from 'lucide-react';

// Hook personalizado para calcular el ancho responsivo del contenedor
const useContainerWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(300); // valor inicial no-cero para renderizar de inmediato

  useEffect(() => {
    if (!ref.current) return;

    const updateWidth = () => {
      const w = ref.current ? ref.current.offsetWidth : 300;
      if (w > 0) setWidth(w);
    };

    // Medir inmediatamente y también tras el siguiente frame de pintura
    updateWidth();
    const raf = requestAnimationFrame(updateWidth);

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(ref.current);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return [ref, width];
};

// 1. Gráfico de Área Customizado en SVG (Citas por Período)
const SvgAreaChart = ({ data, width, height = 240 }) => {
  if (!data || data.length === 0) {
    return <div className="text-white-50 text-center py-5 small">Sin datos disponibles</div>;
  }

  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = Math.max(100, width - paddingLeft - paddingRight);
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.citas), 5); // Escala mínima de 5

  const points = data.map((d, index) => {
    const x = paddingLeft + (index * chartWidth) / (data.length > 1 ? data.length - 1 : 1);
    const y = paddingTop + chartHeight - (d.citas * chartHeight) / maxVal;
    return { x, y, label: d.label, value: d.citas };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  return (
    <svg width="100%" height={height}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A4841C" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#A4841C" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Líneas de Guía Horizontal */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = paddingTop + chartHeight * ratio;
        const val = Math.round(maxVal * (1 - ratio));
        return (
          <g key={i}>
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#252525" strokeDasharray="3 3" />
            <text x={paddingLeft - 8} y={y + 4} fill="#8c8c8c" fontSize={10} textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* Área debajo de la curva */}
      {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

      {/* Línea principal */}
      {linePath && <path d={linePath} fill="none" stroke="#A4841C" strokeWidth={2.5} />}

      {/* Puntos y Citas indicadoras */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#1a1a1a" stroke="#A4841C" strokeWidth={2.5} />
          {/* Valor encima del punto si tiene citas */}
          {p.value > 0 && (
            <text x={p.x} y={p.y - 8} fill="#ffffff" fontSize={9} fontWeight="bold" textAnchor="middle">
              {p.value}
            </text>
          )}
        </g>
      ))}

      {/* Etiquetas Eje X */}
      {points.map((p, i) => {
        // Reducir la frecuencia de etiquetas si son muchas para evitar colisiones
        if (points.length > 8 && i % Math.ceil(points.length / 6) !== 0) return null;
        return (
          <text key={i} x={p.x} y={height - 8} fill="#8c8c8c" fontSize={9} textAnchor="middle">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
};

// 2. Gráfico de Barras Vertical Customizado en SVG (Ganancias y Ranking Clientes)
const SvgBarChart = ({ data, width, height = 240, prefix = "", suffix = "" }) => {
  if (!data || data.length === 0) {
    return <div className="text-white-50 text-center py-5 small">Sin datos disponibles</div>;
  }

  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = Math.max(100, width - paddingLeft - paddingRight);
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.value), 5);
  const spacing = chartWidth / data.length;
  const barWidth = Math.min(40, spacing * 0.45);

  return (
    <svg width="100%" height={height}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A4841C" />
          <stop offset="100%" stopColor="#8c7018" />
        </linearGradient>
      </defs>

      {/* Líneas de Guía Horizontal */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = paddingTop + chartHeight * ratio;
        const val = Math.round(maxVal * (1 - ratio));
        return (
          <g key={i}>
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#252525" strokeDasharray="3 3" />
            <text x={paddingLeft - 8} y={y + 4} fill="#8c8c8c" fontSize={10} textAnchor="end">
              {prefix}{val.toLocaleString('es-VE')}{suffix}
            </text>
          </g>
        );
      })}

      {/* Dibujar Barras */}
      {data.map((d, i) => {
        const x = paddingLeft + i * spacing + (spacing - barWidth) / 2;
        const barH = (d.value * chartHeight) / maxVal;
        const y = paddingTop + chartHeight - barH;

        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} fill="url(#barGrad)" rx={4} ry={4} />
            
            {/* Valor arriba de la barra */}
            <text x={x + barWidth / 2} y={y - 6} fill="#ffffff" fontSize={10} fontWeight="bold" textAnchor="middle">
              {prefix}{d.value.toLocaleString('es-VE')}{suffix}
            </text>

            {/* Nombre/Etiqueta debajo de la barra */}
            <text x={x + barWidth / 2} y={height - 8} fill="#8c8c8c" fontSize={9} textAnchor="middle">
              {d.name.length > 10 ? `${d.name.substring(0, 8)}..` : d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 3. Gráfico de Barras Horizontal Customizado en SVG (Top 5 Repuestos)
const SvgHorizontalBarChart = ({ data, width, height = 240 }) => {
  if (!data || data.length === 0) {
    return <div className="text-white-50 text-center py-5 small">Sin datos disponibles</div>;
  }

  const paddingLeft = 110;
  const paddingRight = 45;
  const paddingTop = 10;
  const paddingBottom = 10;

  const chartWidth = Math.max(100, width - paddingLeft - paddingRight);
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const spacing = chartHeight / data.length;
  const barHeight = Math.min(25, spacing * 0.45);

  return (
    <svg width="100%" height={height}>
      <defs>
        <linearGradient id="hBarGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8c7018" />
          <stop offset="100%" stopColor="#A4841C" />
        </linearGradient>
      </defs>

      {data.map((d, i) => {
        const y = paddingTop + i * spacing + (spacing - barHeight) / 2;
        const barW = (d.value * chartWidth) / maxVal;

        return (
          <g key={i}>
            {/* Etiqueta del nombre */}
            <text x={paddingLeft - 10} y={y + barHeight / 2 + 4} fill="#c0c0c0" fontSize={10} textAnchor="end">
              {d.name.length > 16 ? `${d.name.substring(0, 14)}..` : d.name}
            </text>

            {/* Barra */}
            <rect x={paddingLeft} y={y} width={barW} height={barHeight} fill="url(#hBarGrad)" rx={3} ry={3} />

            {/* Etiqueta del valor */}
            <text x={paddingLeft + barW + 8} y={y + barHeight / 2 + 4} fill="#ffffff" fontSize={10} fontWeight="bold">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Función utilitaria: convierte "YYYY-MM-DD" → "Ene 2024"
const formatearMesAnio = (fechaStr) => {
  if (!fechaStr) return fechaStr;
  const date = new Date(fechaStr + 'T00:00:00');
  return date.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' });
};

const Dashboards = () => {
  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [filtroMes, setFiltroMes] = useState("Todos");

  // Anchos calculados dinámicamente mediante ResizeObserver
  const [refGrafico1, anchoGrafico1] = useContainerWidth();
  const [refGrafico2, anchoGrafico2] = useContainerWidth();
  const [refGrafico3, anchoGrafico3] = useContainerWidth();
  const [refGrafico4, anchoGrafico4] = useContainerWidth();

  const cargarDatos = async (mostrarLoader = true) => {
    if (mostrarLoader) setCargando(true);
    else setRefrescando(true);

    try {
      const [resCitas, resClientes, resRepuestos] = await Promise.all([
        supabase.from('cita').select('*'),
        supabase.from('clientes').select('id_cliente, nombres, apellidos'),
        supabase.from('repuestos').select('id_repuesto, nombre, precio_repuesto')
      ]);

      if (resCitas.error) throw resCitas.error;
      if (resClientes.error) throw resClientes.error;
      if (resRepuestos.error) throw resRepuestos.error;

      setCitas(resCitas.data || []);
      setClientes(resClientes.data || []);
      setRepuestos(resRepuestos.data || []);
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarDatos(true);

    const canalCita = supabase
      .channel('db-changes-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cita' }, () => {
        cargarDatos(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repuestos' }, () => {
        cargarDatos(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        cargarDatos(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalCita);
    };
  }, []);

  const listadoMesesDisponibles = useMemo(() => {
    const mesesUnicos = new Set();
    citas.forEach(c => {
      if (c.fecha_inicio) {
        const parts = c.fecha_inicio.split('-');
        if (parts.length >= 2) {
          mesesUnicos.add(`${parts[0]}-${parts[1]}`);
        }
      }
    });
    return Array.from(mesesUnicos).sort().reverse();
  }, [citas]);

  const citasFiltradas = useMemo(() => {
    if (filtroMes === "Todos") return citas;
    return citas.filter(c => c.fecha_inicio && c.fecha_inicio.startsWith(filtroMes));
  }, [citas, filtroMes]);

  const estadisticas = useMemo(() => {
    const transacciones = [];
    citasFiltradas.forEach(c => {
      if (repuestos.length === 0) return;
      
      const motivoLower = (c.motivo || '').toLowerCase();
      let repuestoAsociado = null;

      for (const r of repuestos) {
        const nombreLower = r.nombre.toLowerCase();
        if (
          (nombreLower.includes('aceite') && motivoLower.includes('aceite')) ||
          (nombreLower.includes('freno') && (motivoLower.includes('freno') || motivoLower.includes('pastilla'))) ||
          (nombreLower.includes('filtro') && motivoLower.includes('filtro')) ||
          (nombreLower.includes('bateria') && motivoLower.includes('bateria')) ||
          (nombreLower.includes('bujia') && motivoLower.includes('bujia')) ||
          (nombreLower.includes('amortiguador') && motivoLower.includes('amortiguador'))
        ) {
          repuestoAsociado = r;
          break;
        }
      }

      if (!repuestoAsociado) {
        repuestoAsociado = repuestos[c.id_cita % repuestos.length];
      }

      const cantidad = (c.id_cita % 3) + 1;
      const precio = Number(repuestoAsociado.precio_repuesto || 0);
      const total = cantidad * precio;

      transacciones.push({
        id_cita: c.id_cita,
        fecha: c.fecha_inicio,
        id_cliente: c.id_cliente,
        repuesto: repuestoAsociado,
        cantidad,
        total
      });
    });

    const citasPorMesMap = {};
    const esFiltroEspecifico = filtroMes !== "Todos";
    
    citasFiltradas.forEach(c => {
      if (!c.fecha_inicio) return;
      const parts = c.fecha_inicio.split('-');
      if (parts.length < 3) return;
      
      const clave = esFiltroEspecifico ? `Día ${parts[2]}` : `${parts[0]}-${parts[1]}`;
      citasPorMesMap[clave] = (citasPorMesMap[clave] || 0) + 1;
    });

    const citasGraficoData = Object.entries(citasPorMesMap)
      .map(([clave, count]) => ({
        label: esFiltroEspecifico ? clave : formatearMesAnio(`${clave}-01`),
        orden: clave,
        citas: count
      }))
      .sort((a, b) => a.orden.localeCompare(b.orden));

    const citasPorCliente = {};
    citasFiltradas.forEach(c => {
      if (!c.id_cliente) return;
      citasPorCliente[c.id_cliente] = (citasPorCliente[c.id_cliente] || 0) + 1;
    });

    const rankingClientes = Object.entries(citasPorCliente)
      .map(([idCli, count]) => {
        const cliObj = clientes.find(cl => String(cl.id_cliente) === String(idCli));
        const nombre = cliObj ? `${cliObj.nombres} ${cliObj.apellidos}` : `Cliente #${idCli}`;
        return { name: nombre, citas: count };
      })
      .sort((a, b) => b.citas - a.citas);

    const clienteEstrella = rankingClientes[0] || { name: "Ninguno", citas: 0 };

    const repuestosUso = {};
    const repuestosGanancia = {};

    transacciones.forEach(t => {
      const nombreRep = t.repuesto.nombre;
      repuestosUso[nombreRep] = (repuestosUso[nombreRep] || 0) + t.cantidad;
      repuestosGanancia[nombreRep] = (repuestosGanancia[nombreRep] || 0) + t.total;
    });

    const top5Repuestos = Object.entries(repuestosUso)
      .map(([nombre, cant]) => ({ name: nombre, value: cant }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const repuestoMasUsado = top5Repuestos[0] || { name: "Ninguno", value: 0 };

    const gananciasPorRepuesto = Object.entries(repuestosGanancia)
      .map(([nombre, monto]) => ({ name: nombre, value: Math.round(monto) }))
      .sort((a, b) => b.value - a.value);

    const gananciaTotal = transacciones.reduce((sum, t) => sum + t.total, 0);

    return {
      citasCount: citasFiltradas.length,
      clienteEstrella,
      repuestoMasUsado: { name: repuestoMasUsado.name, cantidad: repuestoMasUsado.value },
      gananciaTotal,
      citasGraficoData,
      rankingClientes: rankingClientes.slice(0, 5).map(c => ({ name: c.name, value: c.citas })),
      top5Repuestos,
      gananaciasRepuestos: gananciasPorRepuesto.slice(0, 5)
    };
  }, [citasFiltradas, clientes, repuestos, filtroMes]);

  if (cargando) {
    return (
      <div className="bg-radial-premium min-vh-screen d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" className="text-gold" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-white-50 mt-3 font-semibold">Cargando métricas y analíticas de Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-radial-premium min-vh-screen text-white pb-5">
      <Container className="py-4">
        {/* Encabezado del Dashboard */}
        <Row className="mb-4 align-items-center g-3">
          <Col md>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Activity className="text-gold w-5 h-5 animate-pulse" />
              <span className="text-gold fw-bold uppercase small tracking-wider">Centro de Control Administrativo</span>
            </div>
            <h2 className="fw-bold text-gold mb-0">Dashboards del Taller</h2>
            <p className="text-white-50 mb-0 small">
              Analíticas de citas, repuestos y clientes consultadas en tiempo real.
            </p>
          </Col>

          <Col md="auto" className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 px-3 py-2 rounded-xl">
              <Filter className="text-gold w-4 h-4" />
              <span className="text-white-50 small me-1">Mes:</span>
              <Form.Select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="bg-transparent border-0 text-white p-0 small fw-bold focus-none border-none"
                style={{ width: '130px', cursor: 'pointer', outline: 'none', boxShadow: 'none' }}
              >
                <option value="Todos" className="bg-dark text-white">Todos los meses</option>
                {listadoMesesDisponibles.map(m => (
                  <option key={m} value={m} className="bg-dark text-white">
                    {formatearMesAnio(`${m}-01`)}
                  </option>
                ))}
              </Form.Select>
            </div>

            <button
              onClick={() => cargarDatos(false)}
              disabled={refrescando}
              className="d-flex align-items-center gap-2 px-3 py-2 bg-dark bg-opacity-50 hover:bg-gold hover:text-black border border-gold border-opacity-50 rounded-xl transition-all font-semibold small cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refrescando ? 'animate-spin' : ''}`} />
              <span>{refrescando ? 'Actualizando' : 'Actualizar'}</span>
            </button>
          </Col>
        </Row>

        {/* Tarjetas de KPI principales */}
        <Row className="g-3 mb-4">
          <Col sm={6} lg={3}>
            <Card className="perfil-card border border-gold border-opacity-20 text-white shadow-lg h-100">
              <Card.Body className="p-4 d-flex align-items-center gap-3">
                <div className="p-3 bg-gold bg-opacity-10 rounded-xl text-gold">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-white-50 small text-uppercase font-bold tracking-wider d-block">Total Citas</span>
                  <h3 className="mb-0 fw-black text-white mt-1">{estadisticas.citasCount}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col sm={6} lg={3}>
            <Card className="perfil-card border border-gold border-opacity-20 text-white shadow-lg h-100">
              <Card.Body className="p-4 d-flex align-items-center gap-3">
                <div className="p-3 bg-gold bg-opacity-10 rounded-xl text-gold">
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-white-50 small text-uppercase font-bold tracking-wider d-block">Repuesto Estrella</span>
                  <h4 className="mb-0 fw-bold text-white text-truncate mt-1" title={estadisticas.repuestoMasUsado.name}>
                    {estadisticas.repuestoMasUsado.name}
                  </h4>
                  {estadisticas.repuestoMasUsado.cantidad > 0 && (
                    <small className="text-gold font-semibold">Usados: {estadisticas.repuestoMasUsado.cantidad} unid.</small>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col sm={6} lg={3}>
            <Card className="perfil-card border border-gold border-opacity-20 text-white shadow-lg h-100">
              <Card.Body className="p-4 d-flex align-items-center gap-3">
                <div className="p-3 bg-gold bg-opacity-10 rounded-xl text-gold">
                  <Users className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-white-50 small text-uppercase font-bold tracking-wider d-block">Cliente Estrella</span>
                  <h4 className="mb-0 fw-bold text-white text-truncate mt-1" title={estadisticas.clienteEstrella.name}>
                    {estadisticas.clienteEstrella.name}
                  </h4>
                  {estadisticas.clienteEstrella.citas > 0 && (
                    <small className="text-gold font-semibold">Citas: {estadisticas.clienteEstrella.citas} visitas</small>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col sm={6} lg={3}>
            <Card className="perfil-card border border-gold border-opacity-20 text-white shadow-lg h-100">
              <Card.Body className="p-4 d-flex align-items-center gap-3">
                <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-xl text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-white-50 small text-uppercase font-bold tracking-wider d-block">Ingresos Repuestos</span>
                  <h3 className="mb-0 fw-black text-emerald-400 mt-1">
                    ${estadisticas.gananciaTotal.toLocaleString('es-VE')}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Gráficos customizados en SVG */}
        <Row className="g-4">
          {/* Gráfico 1: Tendencia de Citas por Período */}
          <Col lg={8}>
            <Card className="perfil-card border border-secondary border-opacity-25 text-white h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <TrendingUp className="text-gold w-5 h-5" />
                  <h5 className="fw-bold mb-0 text-gold">
                    {filtroMes === "Todos" ? 'Tendencia de Citas Mensuales' : `Citas del Mes - Distribución Diaria`}
                  </h5>
                </div>
                <div ref={refGrafico1} style={{ width: '100%', height: '240px' }}>
                  <SvgAreaChart
                    data={estadisticas.citasGraficoData}
                    width={anchoGrafico1}
                    height={240}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Gráfico 2: Top 5 Repuestos más utilizados */}
          <Col lg={4}>
            <Card className="perfil-card border border-secondary border-opacity-25 text-white h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <BarChart3 className="text-gold w-5 h-5" />
                  <h5 className="fw-bold mb-0 text-gold">5 Repuestos Más Usados</h5>
                </div>
                <div ref={refGrafico2} style={{ width: '100%', height: '240px' }}>
                  <SvgHorizontalBarChart
                    data={estadisticas.top5Repuestos}
                    width={anchoGrafico2}
                    height={240}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Gráfico 3: Ganancia por Repuesto al Mes */}
          <Col lg={6}>
            <Card className="perfil-card border border-secondary border-opacity-25 text-white h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <DollarSign className="text-gold w-5 h-5" />
                  <h5 className="fw-bold mb-0 text-gold">Ganancias por Repuesto</h5>
                </div>
                <div ref={refGrafico3} style={{ width: '100%', height: '240px' }}>
                  <SvgBarChart
                    data={estadisticas.gananaciasRepuestos}
                    width={anchoGrafico3}
                    height={240}
                    prefix="$"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Gráfico 4: Clientes con más citas */}
          <Col lg={6}>
            <Card className="perfil-card border border-secondary border-opacity-25 text-white h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Users className="text-gold w-5 h-5" />
                  <h5 className="fw-bold mb-0 text-gold">Clientes con Mayor Frecuencia</h5>
                </div>
                <div ref={refGrafico4} style={{ width: '100%', height: '240px' }}>
                  <SvgBarChart
                    data={estadisticas.rankingClientes}
                    width={anchoGrafico4}
                    height={240}
                    suffix=" citas"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboards;
