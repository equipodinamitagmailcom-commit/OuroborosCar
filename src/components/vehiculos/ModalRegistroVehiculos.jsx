import { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";

const ModalRegistroVehiculos = ({
  mostrarModal,
  setMostrarModal,
  nuevoVehiculo,
  manejoCambioInput,
  manejoCambioArchivo,
  agregarVehiculo,
  categorias,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);

  const handleRegistrar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await agregarVehiculo();
    setDeshabilitado(false);
  };

  return (
    <Modal
      show={mostrarModal}
      onHide={() => setMostrarModal(false)}
      backdrop="static"
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Nuevo vehiculo</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría *</Form.Label>
                <Form.Select
                  name="id_categoria"
                  value={nuevoVehiculo.id_categoria || ""}
                  onChange={manejoCambioInput}
                  required
                >
                  <option value="">Seleccione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombrecat}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Marca *</Form.Label>
                <Form.Control
                  type="text"
                  name="marca"
                  value={nuevoVehiculo.marca || ""}
                  onChange={manejoCambioInput}
                  placeholder="Marca"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Modelo *</Form.Label>
                <Form.Control
                  type="text"
                  name="modelo"
                  value={nuevoVehiculo.modelo || ""}
                  onChange={manejoCambioInput}
                  placeholder="Modelo"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Patente *</Form.Label>
                <Form.Control
                  type="text"
                  name="patente"
                  value={nuevoVehiculo.patente || ""}
                  onChange={manejoCambioInput}
                  placeholder="Patente"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Año *</Form.Label>
                <Form.Control
                  type="number"
                  name="anio"
                  value={nuevoVehiculo.anio || ""}
                  onChange={manejoCambioInput}
                  placeholder="Año"
                  min="1900"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Color *</Form.Label>
                <Form.Control
                  type="text"
                  name="color"
                  value={nuevoVehiculo.color || ""}
                  onChange={manejoCambioInput}
                  placeholder="Color"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Estado *</Form.Label>
                <Form.Control
                  type="text"
                  name="estado"
                  value={nuevoVehiculo.estado || ""}
                  onChange={manejoCambioInput}
                  placeholder="Estado"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Precio *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio"
                  value={nuevoVehiculo.precio || ""}
                  onChange={manejoCambioInput}
                  placeholder="Precio"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Stock *</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={nuevoVehiculo.stock || ""}
                  onChange={manejoCambioInput}
                  placeholder="Stock"
                  min="0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>Imagen *</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={manejoCambioArchivo}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => setMostrarModal(false)}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleRegistrar}
          disabled={deshabilitado}
        >
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalRegistroVehiculos;
