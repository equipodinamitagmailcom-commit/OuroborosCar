import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Badge, Spinner, InputGroup, Form } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import ModalActualizarMecanico from './ModalActualizarMecanico.jsx';
import ModalEliminarMecanico from './ModalEliminarMecanico.jsx';
import Paginacion from '../ordenamiento/Paginacion';

const TablaMecanicos = () => {
    const [mecanicos, setMecanicos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
    const [paginaActual, establecerPaginaActual] = useState(1);
    
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

    const mecanicosPaginados = mecanicosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    useEffect(() => {
        const totalPaginas = Math.max(1, Math.ceil(mecanicosFiltrados.length / registrosPorPagina));
        if (paginaActual > totalPaginas) {
            establecerPaginaActual(totalPaginas);
        }
    }, [mecanicosFiltrados, registrosPorPagina, paginaActual]);

    const prepararEdicion = (meca) => {
        setMecanicoSeleccionado(meca);
        setShowEdit(true);
    };

    const prepararEliminacion = (meca) => {
        setMecanicoSeleccionado(meca);
        setShowDelete(true);
    };

    return (
        <Card className="card-custom shadow-sm border-0 text-white">
            <Card.Header className="py-3 card-custom">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h5 className="fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>Personal Técnico</h5>
                    <InputGroup style={{ maxWidth: '300px' }} className="shadow-sm">
                        <InputGroup.Text className="border-end-0" style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por nombre o cédula..."
                            className="border-start-0 ps-0 text-white form-control-custom"
                            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-primary)' }}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </div>
            </Card.Header>

            <Card.Body className="p-0">
                <Table hover variant="dark" responsive className="align-middle mb-0 table-custom">
                    <thead style={{ borderBottom: '2px solid var(--color-border-primary)' }}>
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
                                    <Spinner animation="border" variant="warning" size="sm" className="me-2" />
                                    Cargando personal...
                                </td>
                            </tr>
                        ) : mecanicosFiltrados.length > 0 ? (
                            mecanicosPaginados.map((m) => (
                                <tr key={m.id_mecanico} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <td className="ps-4">
                                        <div className="fw-bold">{m.nombres} {m.apellidos}</div>
                                        <Badge className="badge-custom">Mecánico</Badge>
                                    </td>
                                    <td className="text-white-50 small">{m.cedula}</td>
                                    <td>{m.telefono || <span className="text-white-50 italic small">No registrado</span>}</td>
                                    <td className="small text-truncate" style={{ maxWidth: '200px' }}>
                                        {m.direccion}
                                    </td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button 
                                                variant="outline-warning" 
                                                size="sm" 
                                                style={{ borderColor: '#A4841C', color: '#A4841C' }}
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
                                <td colSpan="5" className="text-center py-5 text-white">
                                    No se encontraron mecánicos que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Card.Body>

            {!cargando && mecanicosFiltrados.length > 0 && (
                <div className="p-3">
                    <Paginacion
                        registrosPorPagina={registrosPorPagina}
                        totalRegistros={mecanicosFiltrados.length}
                        paginaActual={paginaActual}
                        establecerPaginaActual={establecerPaginaActual}
                        establecerRegistrosPorPagina={establecerRegistrosPorPagina}
                    />
                </div>
            )}

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