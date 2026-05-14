import { Container } from "react-bootstrap";

const HistorialCitas = () => {
  return (
    <Container className="py-5 mt-5 text-white text-center">
      <h2 className="fw-bold" style={{ color: '#A4841C' }}>Historial de Citas</h2>
      <div className="mt-4 p-5 rounded bg-dark border border-secondary shadow">
        <p className="mb-0">Aquí podrás visualizar el historial de tus servicios realizados.</p>
      </div>
    </Container>
  );
};

export default HistorialCitas;