import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalRegistroCategoria = ({
  mostrarModal,
  setMostrarModal,
  nuevaCategoria,
  manejoCambioInput,
  agregarCategoria,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);

  const handelRegistrar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await agregarCategoria();
    setDeshabilitado(false);
  };

  return (
    <Modal
      show={mostrarModal}
      onHide={() => setMostrarModal(false)}
      backdrop="static"
      keyboard={false}
      centered
      contentClassName="modal-custom"
    >
      <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
        <Modal.Title className="fw-bold" style={{ color: 'var(--color-primary)' }}>Agregar Categoría</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombrecat"
              value={nuevaCategoria.nombrecat}
              onChange={manejoCambioInput}
              className="input-premium"
              placeholder="Ingresa el nombre de la categoría"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top border-secondary">
        <Button variant="secondary" onClick={() => setMostrarModal(false)}>
          Cancelar
        </Button>
        <Button
          onClick={handelRegistrar}
          disabled={nuevaCategoria.nombrecat.trim() === "" || deshabilitado}
          className="fw-bold btn-primary-custom"
        >
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalRegistroCategoria;
