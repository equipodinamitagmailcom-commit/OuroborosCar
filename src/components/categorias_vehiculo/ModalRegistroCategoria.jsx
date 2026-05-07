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
      <Modal.Header closeButton>
        <Modal.Title>Agregar Categoria</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombrecat"
              value={nuevaCategoria.nombrecat}
              onChange={manejoCambioInput}
              placeholder="Ingresa el nombre de la categoría"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setMostrarModal(false)}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handelRegistrar}
          disabled={nuevaCategoria.nombrecat.trim() === "" || deshabilitado}
        >
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalRegistroCategoria;
