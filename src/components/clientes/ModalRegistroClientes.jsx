import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalRegistroClientes = ({
    mostrarModal,
    setMostrarModal,
    nuevoCliente,
    manejoCambioInput,
    agregarCliente,
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);
    
    const handleRegistrar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await agregarCliente();
        setDeshabilitado(false);
    };

    return (
        <Modal
         show={mostrarModal} 
         onHide={() => setMostrarModal(false)}
         backdrop="static"
         keyboard={false}
         centered
         >
            <Modal.Header closeButton>
                <Modal.Title>Registrar Cliente</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre"
                            value={nuevoCliente.nombre}
                            onChange={manejoCambioInput}
                            onClick={handleRegistrar}
                            placeholder="Ingresa el nombre"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
            <Form.Label>Apellido</Form.Label>
            <Form.Control
              type="text"
              name="apellido"
              value={nuevoCliente.apellido}
              onChange={manejoCambioInput}
              onClick={handleRegistrar}
              placeholder="Ingresa el apellido"
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
          onClick={handleRegistrar}
          disabled={nuevoCliente.nombre.trim() === "" || deshabilitado}
        >
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
    );
};

export default ModalRegistroClientes;