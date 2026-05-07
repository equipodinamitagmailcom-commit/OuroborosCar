import React, { useState, useEffect } from 'react';
import { supabase } from '../database/supabaseconfig.js';
import { Button, Container, Row, Col, InputGroup, Form, Spinner } from 'react-bootstrap';

// Importación de Componentes de la Feature
import TablaCategorias from '../CatalogoRepuestos/TablaCategorias.jsx';
import ModalRegistroCategoria from '../CatalogoRepuestos/ModalRegistroCategoria.jsx';
import ModalEditarCategoria from '../CatalogoRepuestos/ModalEditarCategoria.jsx';
import ModalEliminarCategoria from '../CatalogoRepuestos/ModalEliminarCategoria.jsx';

const Categorias = () => {
    // --- ESTADOS ---
    const [listaCategorias, setListaCategorias] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

    // --- ESTADOS DE VISIBILIDAD ---
    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mostrarEdicion, setMostrarEdicion] = useState(false);
    const [mostrarEliminacion, setMostrarEliminacion] = useState(false);

    // --- OBTENCIÓN DE DATOS (DDL: categoriarepuesto) ---
    const obtenerCategorias = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('categoriarepuesto')
                .select('*')
                .order('id_categoria', { ascending: false });

            if (error) throw error;
            setListaCategorias(data || []);
        } catch (error) {
            console.error('Error al cargar categorías:', error.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        document.body.style.backgroundColor = '#121212';
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    useEffect(() => {
        obtenerCategorias();
    }, []);

    // --- MANEJADORES DE MODALES ---
    const abrirEdicion = (categoria) => {
        setCategoriaSeleccionada(categoria);
        setMostrarEdicion(true);
    };

    const abrirEliminacion = (categoria) => {
        setCategoriaSeleccionada(categoria);
        setMostrarEliminacion(true);
    };

    const cerrarModales = () => {
        setMostrarRegistro(false);
        setMostrarEdicion(false);
        setMostrarEliminacion(false);
        setCategoriaSeleccionada(null);
    };

    // Filtro por nombre
    const filtradas = listaCategorias.filter(c => 
        c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <Container className="py-4 mt-2" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
            {/* Encabezado */}
            <Row className="mb-4 align-items-center">
                <Col xs={12} md={6}>
                    <h2 className="fw-bold" style={{ color: '#A4841C' }}>Categorías de Repuestos</h2>
                    <p className="text-muted small">Clasificaciones para el inventario de Ouroboros Car</p>
                </Col>
                <Col xs={12} md={6} className="text-md-end">
                    <Button 
                        className="border-0 px-4 shadow-sm" 
                        style={{ backgroundColor: '#A4841C' }}
                        onClick={() => setMostrarRegistro(true)}
                    >
                        <i className="bi bi-plus-circle me-2"></i>Nueva Categoría
                    </Button>
                </Col>
            </Row>

            {/* Buscador */}
            <InputGroup className="mb-4 shadow-sm">
                <InputGroup.Text className="border-end-0" style={{ backgroundColor: '#2b2b2b', color: '#A4841C', borderColor: '#A4841C' }}>
                    <i className="bi bi-search text-secondary"></i>
                </InputGroup.Text>
                <Form.Control
                    placeholder="Buscar categoría..."
                    className="border-start-0 ps-0 text-white"
                    style={{ backgroundColor: '#2b2b2b', borderColor: '#A4841C' }}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </InputGroup>

            {/* Contenido Principal */}
            {cargando ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="warning" />
                    <p className="mt-2 text-muted">Cargando categorías...</p>
                </div>
            ) : filtradas.length > 0 ? (
                <TablaCategorias 
                    categorias={filtradas}
                    alEditar={abrirEdicion}
                    alEliminar={abrirEliminacion}
                />
            ) : (
                <div className="text-center py-5 border rounded border-secondary" style={{ backgroundColor: '#1e1e1e' }}>
                    <i className="bi bi-tags display-4 text-secondary"></i>
                    <p className="mt-2 text-muted">No se encontraron categorías.</p>
                </div>
            )}

            {/* --- MODALES --- */}
            
            <ModalRegistroCategoria 
                mostrar={mostrarRegistro}
                manejarCierre={cerrarModales}
                alGuardar={obtenerCategorias}
            />

            <ModalEditarCategoria 
                mostrar={mostrarEdicion}
                manejarCierre={cerrarModales}
                categoria={categoriaSeleccionada}
                alActualizar={obtenerCategorias}
            />

            <ModalEliminarCategoria 
                mostrar={mostrarEliminacion}
                manejarCierre={cerrarModales}
                categoria={categoriaSeleccionada}
                alEliminar={obtenerCategorias}
            />

        </Container>
    );
};

export default Categorias;