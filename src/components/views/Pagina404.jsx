import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Pagina404 = () => {
  return (
    <Container className="py-5 mt-2" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
      <Row className="align-items-center justify-content-center mt-5">
        <Col className="text-center">
          <h2 style={{ color: '#A4841C' }}>
            <i className="bi-exclamation-triangle-fill me-2"></i>{" "}
            Error 404
          </h2>
          <p>La página que buscas no existe.</p>
        </Col>
      </Row>
    </Container>
  );
};

export default Pagina404;
