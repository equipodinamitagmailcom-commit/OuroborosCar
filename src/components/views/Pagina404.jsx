import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Pagina404 = () => {
  return (
    <Container className="mt-3">
      <Row className="align-items-center">
        <Col className="text-center">
          <h2>
            <i className="bi-exclamation-triangle-fill text-danger me-2"></i>{" "}
            Error 404
          </h2>
          <p>La página que buscas no existe.</p>
        </Col>
      </Row>
    </Container>
  );
};

export default Pagina404;
