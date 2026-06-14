import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';

const HistorialCitas = () => {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    cargarHistorial();
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const cargarHistorial = async () => {
    setCargando(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa.');

      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .select('id_cliente')
        .eq('profile_id', user.id)
        .single();

      if (errCliente) throw errCliente;

      const { data: historial, error: errHistorial } = await supabase
        .from('cita')
        .select('*, mecanicos(nombres, apellidos)')
        .eq('id_cliente', cliente.id_cliente)
        .order('fecha_inicio', { ascending: false });

      if (errHistorial) throw errHistorial;

      setCitas(historial || []);
    } catch (err) {
      console.error('Error al cargar historial:', err.message);
      setError(err.message || 'Error al cargar el historial de citas.');
    } finally {
      setCargando(false);
    }
  };

  const getBadgeVariant = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return 'warning';
      case 'en progreso': return 'primary';
      case 'completada':
      case 'finalizada': return 'success';
      case 'cancelada': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="bg-radial-premium min-vh-100 py-5">
      <Container>
        <div className="d-flex align-items-center gap-3 mb-4">
          <i className="bi bi-clock-history text-gold display-6"></i>
          <h2 className="fw-bold mb-0 text-gold">Historial de Citas</h2>
        </div>
        
        {cargando ? (
          <div className="text-center py-5">
            <Spinner animation="border" className="text-gold" />
            <p className="text-white-50 mt-3">Cargando tu historial...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : citas.length === 0 ? (
          <Card className="perfil-card text-white text-center p-5">
            <Card.Body>
              <i className="bi bi-calendar-x text-white-50 display-1 mb-3"></i>
              <h4 className="text-gold">No tienes citas registradas</h4>
              <p className="text-white-50">Aún no has solicitado servicios en nuestro taller.</p>
            </Card.Body>
          </Card>
        ) : (
          <Card className="perfil-card text-white">
            <Card.Body className="p-0 table-responsive">
              <Table variant="dark" hover className="mb-0 align-middle">
                <thead style={{ borderBottom: '2px solid #A4841C' }}>
                  <tr>
                    <th className="bg-transparent text-gold py-3 px-4">Fecha y Hora</th>
                    <th className="bg-transparent text-gold py-3 px-4">Motivo / Servicio</th>
                    <th className="bg-transparent text-gold py-3 px-4">Mecánico</th>
                    <th className="bg-transparent text-gold py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map((cita) => (
                    <tr key={cita.id_cita || cita.id} style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                      <td className="bg-transparent py-3 px-4">
                        <div className="fw-bold">{cita.fecha_inicio}</div>
                        <div className="text-white-50 small">{cita.hora_inicio?.substring(0, 5)} - {cita.hora_fin?.substring(0, 5)}</div>
                      </td>
                      <td className="bg-transparent py-3 px-4">
                        <div className="text-wrap" style={{ maxWidth: '300px' }}>
                          {cita.motivo}
                        </div>
                      </td>
                      <td className="bg-transparent py-3 px-4">
                        {cita.mecanicos ? `${cita.mecanicos.nombres} ${cita.mecanicos.apellidos}` : 'No asignado'}
                      </td>
                      <td className="bg-transparent py-3 px-4 text-center">
                        <Badge bg={getBadgeVariant(cita.estado)} className="px-3 py-2 rounded-pill">
                          {cita.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default HistorialCitas;