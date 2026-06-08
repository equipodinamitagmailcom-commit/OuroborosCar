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
      contentClassName="bg-dark text-white"
    >
      <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
        <Modal.Title style={{ color: '#A4841C' }} className="fw-bold">Agregar Categoría</Modal.Title>
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
          className="fw-bold text-white border-0"
          style={{ backgroundColor: '#A4841C' }}
        >
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalRegistroCategoria;
