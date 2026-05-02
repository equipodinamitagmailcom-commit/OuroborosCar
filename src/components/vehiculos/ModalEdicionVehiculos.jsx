import { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";

const ModalEdicionVehiculo = ({
  mostrarModalEdicion,
  setMostrarModalEdicion,
  vehiculoEditar,
  manejoCambioInputEdicion,
  manejoCambioArchivoActualizar,
  actualizarVehiculo,
  categorias,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);

  const handleActualizar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await actualizarVehiculo();
    setDeshabilitado(false);
  };

  return (
    <Modal
      show={mostrarModalEdicion}
      onHide={() => setMostrarModalEdicion(false)}
      backdrop="static"
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Editar Vehículo</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  name="id_categoria"
                  value={vehiculoEditar.id_categoria || ""}
                  onChange={manejoCambioInputEdicion}
                  required
                >
                  <option value="">Seleccione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombrecat ?? cat.nombre_categoria}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Marca</Form.Label>
                <Form.Control
                  type="text"
                  name="marca"
                  value={vehiculoEditar.marca || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Marca"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Modelo</Form.Label>
                <Form.Control
                  type="text"
                  name="modelo"
                  value={vehiculoEditar.modelo || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Modelo"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Patente</Form.Label>
                <Form.Control
                  type="text"
                  name="patente"
                  value={vehiculoEditar.patente || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Patente"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Año</Form.Label>
                <Form.Control
                  type="number"
                  name="anio"
                  value={vehiculoEditar.anio || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Año"
                  min="1900"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Color</Form.Label>
                <Form.Control
                  type="text"
                  name="color"
                  value={vehiculoEditar.color || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Color"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Control
                  type="text"
                  name="estado"
                  value={vehiculoEditar.estado || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Estado"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Precio</Form.Label>
                <Form.Control
                  type="number"
                  name="precio"
                  value={vehiculoEditar.precio || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Precio"
                  min="0"
                  step="0.01"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={vehiculoEditar.stock || ""}
                  onChange={manejoCambioInputEdicion}
                  placeholder="Stock"
                  min="0"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3 text-center">
                <Form.Label>Imagen actual</Form.Label>
                {vehiculoEditar.url_imagen ? (
                  <div className="mb-2">
                    <img
                      src={vehiculoEditar.url_imagen}
                      alt="Vehículo actual"
                      style={{
                        maxWidth: "120px",
                        maxHeight: "120px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-muted">Sin imagen</p>
                )}
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>Nueva imagen (opcional)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={manejoCambioArchivoActualizar}
                />
                <Form.Text className="text-muted">
                  Si seleccionas una nueva imagen, reemplazará la actual
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setMostrarModalEdicion(false)}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleActualizar}
          disabled={deshabilitado}
        >
          Actualizar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEdicionVehiculo;
