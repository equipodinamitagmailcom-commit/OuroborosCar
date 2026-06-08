import React from 'react';
import { Table, Button } from 'react-bootstrap';

const TablaRepuestos = ({ repuestos, onEditar, onEliminar }) => {
    return (
        <div className="table-responsive shadow-sm rounded">
            <Table hover variant="dark" className="align-middle mb-0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre del Repuesto</th>
                        <th>Categoría</th>
                        <th>Precio ($)</th>
                        <th>Descripción</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {repuestos.map((repuesto) => (
                        <tr key={repuesto.id_repuesto}>
                            <td className="fw-bold text-white">#{repuesto.id_repuesto}</td>
                            <td className="fw-semibold">{repuesto.nombre}</td>
                            <td>
                                <span className="badge text-white border" style={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(164,132,28,0.5)' }}>
                                    {repuesto.categoriarepuesto?.nombre || 'General'}
                                </span>
                            </td>
                            <td className="fw-bold" style={{ color: '#A4841C' }}>
                                ${parseFloat(repuesto.precio_repuesto).toFixed(2)}
                            </td>
                            <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                {repuesto.descripcion || '---'}
                            </td>
                            <td className="text-center text-nowrap">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    title="Editar"
                                    onClick={() => onEditar?.(repuesto)}
                                >
                                    <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    title="Eliminar"
                                    onClick={() => onEliminar?.(repuesto)}
                                >
                                    <i className="bi bi-trash"></i>
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default TablaRepuestos;