import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const NoAutorizado = () => {
  const navigate = useNavigate();

  return (
    <Container className="py-5" style={{ minHeight: "100vh", backgroundColor: "#121212", color: "#e0e0e0" }}>
      <div className="text-center">
        <h1 className="display-4" style={{ color: "#A4841C" }}>Acceso denegado</h1>
        <p className="lead">No tienes permiso para acceder a esta página con tu rol actual.</p>
        <Button variant="warning" onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    </Container>
  );
};

export default NoAutorizado;
