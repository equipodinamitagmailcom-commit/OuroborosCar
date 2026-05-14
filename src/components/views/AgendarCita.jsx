import { Container } from "react-bootstrap";

const AgendarCita = () => {
  return (
    <Container className="py-5 mt-5 text-white text-center">
      <h2 className="fw-bold" style={{ color: '#A4841C' }}>Agendar Cita</h2>
      <div className="mt-4 p-5 rounded bg-dark border border-secondary shadow">
        <p className="mb-0">El sistema de agendamiento estará disponible próximamente.</p>
      </div>
    </Container>
  );
};

export default AgendarCita;