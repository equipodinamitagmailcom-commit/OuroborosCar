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
      contentClassName="bg-dark text-white"
    >
      <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
        <Modal.Title>Nuevo vehiculo</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Categoría *</Form.Label>
                <Form.Select
                  name="id_categoria"
                  value={nuevoVehiculo.id_categoria || ""}
                  onChange={manejoCambioInput}
                  className="bg-secondary text-white border-0"
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
                <Form.Label className="text-white">Marca *</Form.Label>
                <Form.Control
                  type="text"
                  name="marca"
                  value={nuevoVehiculo.marca || ""}
                  onChange={manejoCambioInput}
                  placeholder="Marca"
                  className="bg-secondary text-white border-0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Modelo *</Form.Label>
                <Form.Control
                  type="text"
                  name="modelo"
                  value={nuevoVehiculo.modelo || ""}
                  onChange={manejoCambioInput}
                  placeholder="Modelo"
                  className="bg-secondary text-white border-0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Año *</Form.Label>
                <Form.Control
                  type="number"
                  name="anio"
                  value={nuevoVehiculo.anio || ""}
                  onChange={manejoCambioInput}
                  placeholder="Año"
                  className="bg-secondary text-white border-0"
                  min="1900"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Color *</Form.Label>
                <Form.Control
                  type="text"
                  name="color"
                  value={nuevoVehiculo.color || ""}
                  onChange={manejoCambioInput}
                  placeholder="Color"
                  className="bg-secondary text-white border-0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Estado *</Form.Label>
                <Form.Control
                  type="text"
                  name="estado"
                  value={nuevoVehiculo.estado || ""}
                  onChange={manejoCambioInput}
                  placeholder="Estado"
                  className="bg-secondary text-white border-0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Precio *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio"
                  value={nuevoVehiculo.precio || ""}
                  onChange={manejoCambioInput}
                  placeholder="Precio"
                  className="bg-secondary text-white border-0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Stock *</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={nuevoVehiculo.stock || ""}
                  onChange={manejoCambioInput}
                  placeholder="Stock"
                  className="bg-secondary text-white border-0"
                  min="0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Imagen *</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={manejoCambioArchivo}
                  className="bg-secondary text-white border-0"
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
          className="color-navbar"
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
