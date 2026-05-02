import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const ModalEliminacionClientes = ({
    mostrarModalEliminacion,
    setMostrarModalEliminacion,
    eliminarCliente,
    cliente,
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleEliminar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await eliminarCliente();
        setDeshabilitado(false);
        setMostrarModalEliminacion(false);
    };

    return (
        <Modal
            show={mostrarModalEliminacion}
            onHide={() => setMostrarModalEliminacion(false)}
            backdrop="static"
            keyboard={false}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label> 
                            ¿Estás seguro de que deseas eliminar a {cliente.nombre} {cliente.apellido}?
                            </Form.Label>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" 
                 onClick={() => setMostrarModalEliminacion(false)}
                >
                    Cancelar
                </Button>
                <Button variant="danger"
                 onClick={handleEliminar}
                 disabled={deshabilitado}
                >
                    {deshabilitado ? "Eliminando..." : "Eliminar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminacionClientes;