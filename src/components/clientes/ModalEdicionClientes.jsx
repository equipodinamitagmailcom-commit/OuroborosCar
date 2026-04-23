import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalEdicionClientes = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    clienteEditar,
    manejoCambioInput,
    actualizarCliente,
}) => {
 const [deshabilitado, setDeshabilitado] = useState(false);

 const handleActualizar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await actualizarCliente();
    setDeshabilitado(false);
 };
 return (
    <Modal
        show={mostrarModalEdicion}
        onHide={() => setMostrarModalEdicion(false)}
        backdrop="static"
        keyboard={false}
        centered
    >
        <Modal.Header closeButton>
            <Modal.Title>Editar Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control
                        type="text"
                        name="nombre"
                        value={clienteEditar.nombre}
                        onChange={manejoCambioInput}
                        placeholder="Ingresa el nombre"
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Apellido</Form.Label>
                    <Form.Control
                        type="text"
                        name="apellido"
                        value={clienteEditar.apellido}
                        onChange={manejoCambioInput}
                        placeholder="Ingresa el apellido"
                    />
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setMostrarModalEdicion(false)}>
                Cancelar
            </Button>
            <Button variant="primary" onClick={handleActualizar}>
                Actualizar
            </Button>
        </Modal.Footer>
    </Modal>
 );
};

export default ModalEdicionClientes;