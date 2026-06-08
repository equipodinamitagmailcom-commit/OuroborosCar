import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalEdicionCategoria = ({
  mostrarModalEdicion,
  setMostrarModalEdicion,
  categoriaEditar,
  manejoCambioInputEdicion,
  actualizarCategoria,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);


  const handleActualizar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await actualizarCategoria();
    setDeshabilitado(false);
  };

  return (
    <Modal
      show={mostrarModalEdicion}
      onHide={() => setMostrarModalEdicion(false)}
      backdrop="static"
      keyboard={false}
      centered
      contentClassName="modal-custom"
    >
      <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
        <Modal.Title className="fw-bold" style={{ color: 'var(--color-primary)' }}>Editar Categoría</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombrecat"
              value={categoriaEditar.nombrecat}
              onChange={manejoCambioInputEdicion}
              className="input-premium"
              placeholder="Ingresa el nombre"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top border-secondary">
        <Button variant="secondary" onClick={() => setMostrarModalEdicion(false)}>
          Cancelar
        </Button>
        <Button
          onClick={handleActualizar}
          disabled={categoriaEditar.nombrecat.trim() === "" || deshabilitado}
          className="fw-bold btn-primary-custom"
        >
          {deshabilitado ? "Actualizando..." : "Actualizar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEdicionCategoria;