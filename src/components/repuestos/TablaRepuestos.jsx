import React from 'react';
import { Table } from 'react-bootstrap';

const TablaRepuestos = ({ repuestos }) => {
    return (
        <div className="table-responsive shadow-sm rounded">
            <Table hover className="align-middle mb-0 bg-white">
                <thead className="color-navbar text-white">
                    <tr>
                        <th>ID</th>
                        <th>Nombre del Repuesto</th>
                        <th>Categoría</th>
                        <th>Precio ($)</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    {repuestos.map((repuesto) => (
                        <tr key={repuesto.id_repuesto}>
                            <td className="fw-bold text-muted">#{repuesto.id_repuesto}</td>
                            <td className="fw-semibold">{repuesto.nombre}</td>
                            <td>
                                <span className="badge bg-light text-dark border">
                                    {repuesto.categoriarepuesto?.nombre || 'General'}
                                </span>
                            </td>
                            <td className="fw-bold color-texto-marca">
                                ${parseFloat(repuesto.precio_repuesto).toFixed(2)}
                            </td>
                            <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                {repuesto.descripcion || '---'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default TablaRepuestos;