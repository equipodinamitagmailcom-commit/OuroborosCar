import React, { useState, useEffect } from 'react';
import { supabase } from '../database/supabaseconfig.js';
import { Button, Container, Row, Col, InputGroup, Form, Spinner } from 'react-bootstrap';

// Importación de Componentes (Features)
import TarjetasRepuestos from '../repuestos/TarjetasRepuestos.jsx';
import TablaRepuestos from '../repuestos/TablaRepuestos.jsx';
import ModalRegistroRepuesto from '../repuestos/ModaRegistroRepuesto.jsx';
import ModalEdicionRepuesto from '../repuestos/ModalEdicionRepuesto.jsx';
import ModalEliminacionRepuesto from '../repuestos/ModalEliminacionRepuesto.jsx';

const Repuestos = () => {
    // --- ESTADOS ---
    const [listaRepuestos, setListaRepuestos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    
    // Estado para el objeto seleccionado en Edición/Eliminación
    const [repuestoSeleccionado, setRepuestoSeleccionado] = useState(null);

    // Estados de visibilidad de modales
    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mostrarEdicion, setMostrarEdicion] = useState(false);
    const [mostrarEliminacion, setMostrarEliminacion] = useState(false);

    // Estado para el tipo de vista (Tarjetas o Tabla)
    const [vistaTabla, setVistaTabla] = useState(false);

    // --- LÓGICA DE DATOS (Basada en tu DDL) ---
    const obtenerRepuestos = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('repuestos')
                .select(`
                    id_repuesto,
                    nombre,
                    descripcion,
                    precio_repuesto,
                    id_categoria,
                    categoriarepuesto (
                        id_categoria,
                        nombre
                    )
                `)
                .order('id_repuesto', { ascending: false });

            if (error) throw error;
            setListaRepuestos(data || []);
        } catch (error) {
            console.error('Error al obtener repuestos:', error.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerRepuestos();
    }, []);

    // --- HANDLERS DE MODALES ---
    const abrirEdicion = (repuesto) => {
        setRepuestoSeleccionado(repuesto);
        setMostrarEdicion(true);
    };

    const abrirEliminacion = (repuesto) => {
        setRepuestoSeleccionado(repuesto);
        setMostrarEliminacion(true);
    };

    const cerrarModales = () => {
        setMostrarRegistro(false);
        setMostrarEdicion(false);
        setMostrarEliminacion(false);
        setRepuestoSeleccionado(null); // Limpieza crítica
    };

    // --- FILTRADO EN TIEMPO REAL ---
    const repuestosFiltrados = listaRepuestos.filter(r => 
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.categoriarepuesto?.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <Container className="py-4 mt-2">
            {/* Cabecera Responsiva */}
            <Row className="mb-4 align-items-center">
                <Col xs={12} md={6}>
                    <h2 className="color-texto-marca fw-bold">Gestión de Repuestos</h2>
                    <p className="text-muted small">Inventario técnico de Ouroboros Car</p>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
                    <Button 
                        className="color-navbar border-0 shadow-sm" 
                        onClick={() => setMostrarRegistro(true)}
                    >
                        <i className="bi bi-plus-circle-fill me-2"></i>Agregar Repuesto
                    </Button>
                </Col>
            </Row>

            {/* Buscador y Toggle de Vista */}
            <Row className="mb-4 align-items-center">
                <Col md={8}>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-end-0">
                            <i className="bi bi-search text-secondary"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por nombre o categoría..."
                            className="border-start-0 ps-0"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </Col>
                <Col md={4} className="text-md-end mt-3 mt-md-0">
                    <div className="btn-group shadow-sm" role="group">
                        <Button 
                            variant={!vistaTabla ? "primary" : "outline-primary"}
                            onClick={() => setVistaTabla(false)}
                            title="Vista de Tarjetas"
                        >
                            <i className="bi bi-grid-3x3-gap-fill"></i>
                        </Button>
                        <Button 
                            variant={vistaTabla ? "primary" : "outline-primary"}
                            onClick={() => setVistaTabla(true)}
                            title="Vista de Tabla"
                        >
                            <i className="bi bi-table"></i>
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Área Principal de Contenido */}
            {cargando ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" role="status">
                        <span className="visually-hidden">Cargando repuestos...</span>
                    </Spinner>
                    <p className="mt-2 text-muted">Sincronizando con la base de datos...</p>
                </div>
            ) : repuestosFiltrados.length > 0 ? (
                vistaTabla ? (
                    <TablaRepuestos 
                        repuestos={repuestosFiltrados} 
                        alEditar={abrirEdicion}
                        alEliminar={abrirEliminacion}
                    />
                ) : (
                    <TarjetasRepuestos 
                        repuestos={repuestosFiltrados} 
                        alEditar={abrirEdicion}
                        alEliminar={abrirEliminacion}
                    />
                )
            ) : (
                <div className="text-center py-5">
                    <i className="bi bi-tools display-1 text-light"></i>
                    <p className="mt-3 text-muted">No se encontraron piezas en el inventario.</p>
                </div>
            )}

            {/* --- MODALES DE LA FEATURE --- */}
            
            <ModalRegistroRepuesto 
                mostrar={mostrarRegistro} 
                manejarCierre={cerrarModales} 
                alGuardar={obtenerRepuestos} 
            />

            <ModalEdicionRepuesto 
                mostrar={mostrarEdicion} 
                manejarCierre={cerrarModales} 
                repuesto={repuestoSeleccionado} 
                alActualizar={obtenerRepuestos} 
            />

            <ModalEliminacionRepuesto 
                mostrar={mostrarEliminacion} 
                manejarCierre={cerrarModales} 
                repuesto={repuestoSeleccionado} 
                alEliminar={obtenerRepuestos} 
            />

        </Container>
    );
};

export default Repuestos;