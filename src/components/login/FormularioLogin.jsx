import React from "react";
import { Form, Button, Alert, InputGroup } from "react-bootstrap";

const FormularioLogin = ({
  usuario,
  contrasena,
  error,
  setUsuario,
  setContrasena,
  iniciarSesion,
  verContrasena,
  setVerContrasena
}) => {
  return (
    <div style={{ minWidth: "320px", maxWidth: "400px", width: "100%" }}>
      <h3 className="text-center mb-4 text-white fw-bold">Iniciar Sesión</h3>

      {error && <Alert variant="danger" className="py-2 small text-center">{error}</Alert>}

      <Form>
        <Form.Group className="mb-3" controlId="usuario">
          <Form.Label className="small fw-bold text-white">Correo electrónico</Form.Label>
          <Form.Control
            type="email"
            placeholder="Ingresa tu correo electrónico"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="input-premium"
            required
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="contrasena">
          <Form.Label className="small fw-bold text-white">Contraseña</Form.Label>
          <InputGroup>
            <Form.Control
              type={verContrasena ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="input-premium border-end-0"
              required
            />
            <InputGroup.Text 
              className="input-group-text-custom border-start-0"
              style={{ cursor: 'pointer' }}
              onClick={() => setVerContrasena(!verContrasena)}
            >
              <i className={`bi ${verContrasena ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>

        <Button className="btn-dark-premium w-100 py-2 fw-bold text-uppercase" style={{ letterSpacing: '1px' }} onClick={iniciarSesion}>
          INGRESAR
        </Button>
      </Form>
    </div>
  );
};

export default FormularioLogin;
