import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Badge, Spinner, InputGroup, Form } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import ModalActualizarMecanico from './ModalActualizarMecanico.jsx';
import ModalEliminarMecanico from './ModalEliminarMecanico.jsx';

const TablaMecanicos = () => {
    const [mecanicos, setMecanicos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    
    // Estados para modales
    const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        obtenerMecanicos();
    }, []);

    const obtenerMecanicos = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('mecanicos')
                .select('*')
                .order('nombres', { ascending: true });

            if (error) throw error;
            setMecanicos(data);
        } catch (error) {
            console.error("Error al obtener mecánicos:", error.message);
        } finally {
            setCargando(false);
        }
    };

    // Filtrado en tiempo real
    const mecanicosFiltrados = mecanicos.filter(m => 
        m.nombres.toLowerCase().includes(busqueda.toLowerCase()) || 
        m.cedula.includes(busqueda)
    );

    const prepararEdicion = (meca) => {
        setMecanicoSeleccionado(meca);
        setShowEdit(true);
    };

    const prepararEliminacion = (meca) => {
        setMecanicoSeleccionado(meca);
        setShowDelete(true);
    };

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h5 className="fw-bold mb-0 color-texto-marca">Personal Técnico</h5>
                    <InputGroup style={{ maxWidth: '300px' }}>
                        <InputGroup.Text className="bg-white border-end-0">
                            <i className="bi bi-search text-muted"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por nombre o cédula..."
                            className="border-start-0 ps-0"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </div>
            </Card.Header>

            <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                    <thead className="bg-light text-secondary small">
                        <tr>
                            <th className="ps-4">TÉCNICO</th>
                            <th>CÉDULA</th>
                            <th>TELÉFONO</th>
                            <th>DIRECCIÓN</th>
                            <th className="text-center">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="align-middle">
                        {cargando ? (
                            <tr>
                                <td colSpan="5" className="text-center py-5">
                                    <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                                    Cargando personal...
                                </td>
                            </tr>
                        ) : mecanicosFiltrados.length > 0 ? (
                            mecanicosFiltrados.map((m) => (
                                <tr key={m.id_mecanico}>
                                    <td className="ps-4">
                                        <div className="fw-bold">{m.nombres} {m.apellidos}</div>
                                        <Badge bg="info" className="fw-normal" style={{ fontSize: '10px' }}>Mecánico</Badge>
                                    </td>
                                    <td className="text-muted small">{m.cedula}</td>
                                    <td>{m.telefono || <span className="text-muted italic small">No registrado</span>}</td>
                                    <td className="small text-truncate" style={{ maxWidth: '200px' }}>
                                        {m.direccion}
                                    </td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                onClick={() => prepararEdicion(m)}
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                onClick={() => prepararEliminacion(m)}
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-5 text-muted">
                                    No se encontraron mecánicos que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Card.Body>

            {/* Modales integrados */}
            <ModalActualizarMecanico 
                show={showEdit} 
                onHide={() => setShowEdit(false)} 
                mecanico={mecanicoSeleccionado} 
                onRefrescar={obtenerMecanicos} 
            />

            <ModalEliminarMecanico 
                show={showDelete} 
                onHide={() => setShowDelete(false)} 
                mecanico={mecanicoSeleccionado} 
                onConfirmar={obtenerMecanicos} 
            />
        </Card>
    );
};

export default TablaMecanicos;